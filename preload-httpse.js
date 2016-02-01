var fs = require('fs')
var sqlite3 = require('sqlite3')
var parseString = require('xml2js').parseString

// Manually exclude sites that are broken until they are fixed in the next
// HTTPS Everywhere release.
var exclusions = {
  'Nike.com.xml': 'breaks nikeplus.com',
  'PJ_Media.xml': 'mixed content on https://pjmedia.com/instapundit/',
  'Slashdot.xml': 'redirect loop on mobile slashdot.org',
  'Vox.com.xml': 'redirect loop on vox.com'
}

// Preload mapping of HTTPS Everywhere hosts to ruleset IDs and convert
// XML to JSON for performance reasons.
// 1. Download https://www.eff.org/files/https-everywhere-latest.xpi
// 2. unzip https-everywhere-latest.xpi
// 3. cp /path/to/https-everywhere/defaults/rulesets.sqlite .
// 4. npm run preload-httpse
// 5. Push rulesets.sqlite and httpse-targets.json to AWS
// 6. rm rulesets.sqlite httpse-targets.json
// TODO: Automate this with a git hook.
var db = new sqlite3.Database('./rulesets.sqlite', sqlite3.OPEN_READWRITE, function (dbErr) {
  if (dbErr) {
    console.log('FATAL: got db open error', dbErr)
    return null
  }

  var query = 'select host, ruleset_id from targets'
  var contentQuery = 'select contents, id from rulesets'
  var updateQuery = 'update rulesets set contents = $contents where id = $id'
  var targets = {}

  db.each(query, function (err, row) {
    if (err) {
      console.log('FATAL: error preloading rulesets', err)
      return null
    }
    if (!targets[row.host]) {
      targets[row.host] = [row.ruleset_id]
    } else {
      targets[row.host].push(row.ruleset_id)
    }
  }, function () {
    fs.writeFileSync('./httpse-targets.json', JSON.stringify(targets))
    console.log('NOTE: successfully wrote httpse-targets.json')
  }).each(contentQuery, function (err, row) {
    if (err) {
      console.log('FATAL: error transforming rulesets to JSON')
      return null
    }
    // Transform XML to JSON
    parseString(row.contents, function (err, result) {
      if (err) {
        console.log('FATAL: error parsing XML', row.contents)
        return null
      }
      // Exclude broken rules from the db
      var ruleset = result.ruleset
      if (ruleset.$.f in exclusions) {
        console.log('NOTE: Excluding rule', JSON.stringify(result))
        ruleset.$.default_off = exclusions[ruleset.$.f]
      }
      db.run(updateQuery, {
        $contents: JSON.stringify(result),
        $id: row.id
      })
    })
  })
})
