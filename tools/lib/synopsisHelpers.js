const crypto = require('brave-crypto')
const randomHostname = require('./randomHostname')

const Synopsis = require('bat-publisher').Synopsis

const PROTOCOL_PREFIXES = ['http://', 'https://']

const generateSynopsisVisits = function (synopsis, numPublishers) {
  let numHosts = numPublishers || crypto.random.uniform(100)

  let hosts = (new Array(numHosts)).fill(null).map(function () { return randomHostname() })

  hosts.forEach(function (host) {
    let numVisits = crypto.random.uniform(10)

    for (let i = 0; i < numVisits; i++) {
      const nprefixes = PROTOCOL_PREFIXES.length
      const prefix = PROTOCOL_PREFIXES[crypto.random.uniform(nprefixes)]
      synopsis.addPublisher(prefix + host + '/', {
        duration: crypto.random.uniform(60 * 1000),
        revisitP: false
      })
    }
  })

  return synopsis
}

const addSynopsisVisits = function (sessionData, numPublishers) {
  let synopsis = new Synopsis(sessionData.ledger.synopsis)
  const generated = generateSynopsisVisits(synopsis, numPublishers)

  try {
    sessionData.ledger.synopsis = generated
  } catch (e) {
    console.log('Please create empty profile first')
  }

  return sessionData
}

module.exports = {
  addSynopsisVisits
}
