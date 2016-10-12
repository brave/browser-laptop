const fs = require('fs')

const randomHostname = require('./randomHostname')

const Synopsis = require('ledger-publisher').Synopsis

const PROTOCOL_PREFIXES = ['http://', 'https://']

const generateSynopsisVisits = function (synopsis, numPublishers) {
  let numHosts = numPublishers || Math.round(Math.random() * 100)

  let hosts = (new Array(numHosts)).fill(null).map(function () { return randomHostname() })

  hosts.forEach(function (host) {
    let numVisits = Math.round(Math.random() * 10)

    for (let i = 0; i < numVisits; i++) {
      synopsis.addVisit(PROTOCOL_PREFIXES[Math.round(Math.random())] + host + '/', Math.round(Math.random() * 60 * 1000))
    }
  })

  return synopsis
}

const updateExistingSynopsisFile = function (synopsisPath, numPublishers) {
  let synopsis = new Synopsis(JSON.parse(fs.readFileSync(synopsisPath).toString()))

  synopsis = generateSynopsisVisits(synopsis, numPublishers)

  fs.writeFileSync(synopsisPath, JSON.stringify(synopsis, null, 2))
}

module.exports = {
  updateExistingSynopsisFile: updateExistingSynopsisFile
}
