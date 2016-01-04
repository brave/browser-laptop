var fs = require('fs')
var sqlite3 = require('sqlite3')
var parseString = require('xml2js').parseString

// Preload mapping of HTTPS Everywhere hosts to ruleset IDs for performance
// Run this whenever rulesets.sqlite is updated from the HTTPS Everywhere
// stable branch. TODO: Automate this with a git hook.
var db = new sqlite3.Database('./js/data/rulesets.sqlite', sqlite3.OPEN_READWRITE, function (dbErr) {
  if (dbErr) {
    console.log('got db open error', dbErr)
    return null
  }

  var query = 'select host, ruleset_id from targets'
  var contentQuery = 'select contents, id from rulesets'
  var updateQuery = 'update rulesets set contents = $contents where id = $id'
  var targets = {}

  db.each(query, function (err, row) {
    if (err) {
      console.log('error preloading rulesets', err)
      return null
    }
    if (!targets[row.host]) {
      targets[row.host] = [row.ruleset_id]
    } else {
      targets[row.host].push(row.ruleset_id)
    }
  }, function () {
    fs.writeFileSync('./js/data/httpse-targets.json', JSON.stringify(targets))
    console.log('successfully wrote httpse-targets.json')
  }).each(contentQuery, function (err, row) {
    if (err) {
      console.log('error transforming rulesets to JSON')
      return null
    }
    // Transform XML to JSON
    parseString(row.contents, function (err, result) {
      if (err) {
        console.log('error parsing XML', row.contents)
        return null
      }
      db.run(updateQuery, {
        $contents: JSON.stringify(result),
        $id: row.id
      })
    })
  })
})
