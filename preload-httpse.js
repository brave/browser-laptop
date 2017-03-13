// 1. Download https://www.eff.org/files/https-everywhere-latest.xpi
// 2. unzip https-everywhere-latest.xpi
// 3. cp /path/to/https-everywhere/chrome/content/rulesets.json .
// 4. npm run preload-httpse
// 5. Push httpse.json to AWS
// TODO: Automate this with a git hook.

'use strict'
var fs = require('fs')
var path = require('path')
var parseString = require('xml2js').parseString
var sqlite3 = require('sqlite3')
var levelup = require('level')

// Manually exclude sites that are broken until they are fixed in the next
// HTTPS Everywhere release.
var exclusions = {
  'Nike.com.xml': 'breaks nikeplus.com',
  'PJ_Media.xml': 'mixed content on https://pjmedia.com/instapundit/',
  'Slashdot.xml': 'redirect loop on mobile slashdot.org',
  'Delta.com.xml': 'https://delta.com does not redirect to https://www.delta.com',
  'Cargo.xml': 'breaks cargocollective.com',
  'TMZ.com.xml': 'breaks www.tmz.com',
  'BusinessInsider.xml': 'breaks http://www.businessinsider.com/silicon-valley-100-2016-6?op=0',
  'Tesco.xml': 'breaks tesco.com due to CSP mismatch',
  'Vodafone.ie.xml': 'breaks pagination on http://shop.vodafone.ie/shop/phonesAndPlans/phonesAndPlansHome.jsp?subPage=phones&planFilter=onAccount',
  'IDownloadBlog.xml': 'breaks http://www.idownloadblog.com/',
  'EBay_static.com.xml': 'breaks suggested product image previews',
  'Cisco.xml': 'breaks http://www.cisco.com/c/m/en_us/training-events/events-webinars/techwise-tv/listings.html',
  'GQ.xml': 'mixed content on gq.com'
}

var rulesets = JSON.parse(fs.readFileSync('rulesets.json', 'utf8'))

// Convert XML rules to JSON
for (let id in rulesets.rulesetStrings) {
  let contents = rulesets.rulesetStrings[id]
  parseString(contents, function (err, result) {
    if (err) {
      throw new Error('FATAL: error parsing XML: ' + contents)
    }
    // Exclude broken rules
    var ruleset = result.ruleset
    if (ruleset.$.f in exclusions) {
      console.log('NOTE: Excluding rule', JSON.stringify(result))
      ruleset.$.default_off = exclusions[ruleset.$.f]
    }
    rulesets.rulesetStrings[id] = result
  })
}
console.log('Writing httpse.json')
fs.writeFileSync('httpse.json', JSON.stringify(rulesets), 'utf8')

// Convert httpse.json to sqlite for mobile
console.log('creating httpse.sqlite')
var db = new sqlite3.Database('httpse.sqlite', function (err) {
  if (err !== null) {
    throw new Error('FATAL: could not open db: ' + err)
  }

  db.exec([
    'DROP TABLE IF EXISTS rulesets',
    'CREATE TABLE rulesets (id INTEGER PRIMARY KEY, contents TEXT)',
    'DROP TABLE IF EXISTS targets',
    'CREATE TABLE targets (host TEXT UNIQUE, ids TEXT)'].join('; '), function (err) {
    if (err !== null) {
      throw new Error('FATAL: could not create tables: ' + err)
    }

    var rulesetStatement = db.prepare('INSERT INTO rulesets (id, contents) VALUES(?, ?)')
    var targetStatement = db.prepare('INSERT INTO targets (host, ids) VALUES(?, ?)')

    // TODO: Speed this up
    for (var id in rulesets.rulesetStrings) {
      let contents = JSON.stringify(rulesets.rulesetStrings[id])
      rulesetStatement.run(id, contents)
    }
    for (var target in rulesets.targets) {
      let ids = JSON.stringify(rulesets.targets[target])
      targetStatement.run(target, ids)
    }
  })
})

const rmDir = function (dirPath) {
  try {
    var files = fs.readdirSync(dirPath)
  } catch (e) {
    return
  }
  if (files.length > 0) {
    for (var i = 0; i < files.length; i++) {
      var filePath = path.join(dirPath, files[i])
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath)
      } else {
        rmDir(filePath)
      }
    }
  }
  fs.rmdirSync(dirPath)
}

console.log('creating httpse.leveldb')
rmDir('./httpse.leveldb')

const httpseLevelDB = levelup('httpse.leveldb', {compression: false, errorIfExists: true})

const ruleSets = {}
for (var id in rulesets.rulesetStrings) {
  ruleSets[id] = rulesets.rulesetStrings[id]
}

let batch = httpseLevelDB.batch()
for (var target in rulesets.targets) {
  let targetRuleSets = []
  rulesets.targets[target].forEach((id) => {
    let ruleset = ruleSets[id]
    if (!ruleset.ruleset.$.default_off && !ruleset.ruleset.$.platform) {
      let rule = {
        r: ruleset.ruleset.rule.map((rule) => {
          if (rule.$.from === '^http:' && rule.$.to === 'https:') {
            return { d: 1 }
          } else {
            return { f: rule.$.from, t: rule.$.to }
          }
        })
      }
      if (ruleset.ruleset.exclusion) {
        rule.e = ruleset.ruleset.exclusion.map((exclusion) => {
          return { p: exclusion.$.pattern }
        })
      }
      targetRuleSets = targetRuleSets.concat(rule)
    }
  })
  let reverseTarget = target.split('.').reverse().join('.')
  if (targetRuleSets.length > 0) {
    batch.put(reverseTarget, JSON.stringify(targetRuleSets), {sync: true})
  }
}

batch.write((err) => {
  if (err) {
    console.error(err)
  } else {
    httpseLevelDB.close((err) => {
      if (err) {
        console.error(err)
      } else {
        console.log('done')
      }
    })
  }
})
