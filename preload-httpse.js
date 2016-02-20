// 1. Download https://www.eff.org/files/https-everywhere-latest.xpi
// 2. unzip https-everywhere-latest.xpi
// 3. cp /path/to/https-everywhere/chrome/content/rulesets.json .
// 4. npm run preload-httpse
// 5. Push httpse.json to AWS
// TODO: Automate this with a git hook.

'use strict'
var fs = require('fs')
var parseString = require('xml2js').parseString

// Manually exclude sites that are broken until they are fixed in the next
// HTTPS Everywhere release.
var exclusions = {
  'Nike.com.xml': 'breaks nikeplus.com',
  'PJ_Media.xml': 'mixed content on https://pjmedia.com/instapundit/',
  'Slashdot.xml': 'redirect loop on mobile slashdot.org',
  'Vox.com.xml': 'redirect loop on vox.com'
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
