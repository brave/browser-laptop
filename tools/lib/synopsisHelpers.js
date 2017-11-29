const randomHostname = require('./randomHostname')

const Synopsis = require('bat-publisher').Synopsis

const PROTOCOL_PREFIXES = ['http://', 'https://']

const generateSynopsisVisits = function (synopsis, numPublishers) {
  let numHosts = numPublishers || Math.round(Math.random() * 100)

  let hosts = (new Array(numHosts)).fill(null).map(function () { return randomHostname() })

  hosts.forEach(function (host) {
    let numVisits = Math.round(Math.random() * 10)

    for (let i = 0; i < numVisits; i++) {
      synopsis.addPublisher(PROTOCOL_PREFIXES[Math.round(Math.random())] + host + '/', {
        duration: Math.round(Math.random() * 60 * 1000),
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
