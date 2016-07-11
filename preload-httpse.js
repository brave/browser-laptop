// 1. Download https://www.eff.org/files/https-everywhere-latest.xpi
// 2. unzip https-everywhere-latest.xpi
// 3. cp /path/to/https-everywhere/chrome/content/rulesets.json .
// 4. npm run preload-httpse
// 5. Push httpse.json to AWS
// TODO: Automate this with a git hook.

'use strict'
var fs = require('fs')
var parseString = require('xml2js').parseString
var sqlite3 = require('sqlite3')

// Manually exclude sites that are broken until they are fixed in the next
// HTTPS Everywhere release.
var exclusions = {
  'Nike.com.xml': 'breaks nikeplus.com',
  'PJ_Media.xml': 'mixed content on https://pjmedia.com/instapundit/',
  'Slashdot.xml': 'redirect loop on mobile slashdot.org',
  'Delta.com.xml': 'https://delta.com does not redirect to https://www.delta.com',
  'Cargo.xml': 'breaks cargocollective.com',
  'TMZ.com.xml': 'breaks www.tmz.com',
  'BusinessInsider.xml': 'breaks http://www.businessinsider.com/silicon-valley-100-2016-6?op=0'
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

  db.exec(['DROP TABLE IF EXISTS rulesets',
          'CREATE TABLE rulesets (id INTEGER PRIMARY KEY, contents TEXT)',
          'DROP TABLE IF EXISTS targets',
          'CREATE TABLE targets (host TEXT, ids TEXT)'].join('; '), function (err) {
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
