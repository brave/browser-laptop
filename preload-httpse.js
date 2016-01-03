var fs = require('fs')
var sqlite3 = require('sqlite3')

// Preload mapping of HTTPS Everywhere hosts to ruleset IDs for performance
// Run this whenever rulesets.sqlite is updated from the HTTPS Everywhere
// stable branch. TODO: Automate this with a git hook.
var db = new sqlite3.Database('./js/data/rulesets.sqlite', sqlite3.OPEN_READONLY, function (dbErr) {
  if (dbErr) {
    console.log('got db open error', dbErr)
    return null
  }

  var query = 'select host, ruleset_id from targets'
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
  }).close(function (err) {
    if (err) {
      console.log('got db close error', err)
    }
    fs.writeFileSync('./js/data/httpse-targets.json', JSON.stringify(targets))
    console.log('successfully wrote httpse-targets.json')
  })
})
