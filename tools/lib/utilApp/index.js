'use strict'

const electron = require('electron')
const app = electron.app
app.setName('brave')

const path = require('path')
const rimraf = require('../rimraf')

const cleanUserData = (location) => {
  location = location ? path.join(app.getPath('userData'), location) : app.getPath('userData')
  if (location && location !== '') {
    console.log(`removing ${location}...`)
    rimraf.sync(location)
  }
}

const simulateLedgerTransactions = require('../simulateLedgerTransactions')
const fs = require('fs')

function addSimulatedLedgerTransactions (numTx) {
  let userDataPath = app.getPath('userData')
  let ledgerStatePath = path.join(userDataPath, 'ledger-state.json')

  try {
    let ledgerState = JSON.parse(fs.readFileSync(ledgerStatePath).toString())

    let simulatedTransactions = simulateLedgerTransactions(numTx)

    ledgerState.transactions = (ledgerState.transactions || []).concat(simulatedTransactions)

    fs.writeFileSync(ledgerStatePath, JSON.stringify(ledgerState, null, 2))

    console.log(`Updated Ledger data file at ${ledgerStatePath}`)
  } catch (exc) {
    console.error('ERROR in addSimulatedLedgerTransactions: could not find/open/parse Ledger data file.')
    console.error(`Expected path to Ledger data file: ${ledgerStatePath}`)
    console.error('Probable solution: Run Brave and enable Payments, then execute this script. Enabling/disabling Payments (or restarting Brave) should then show the generated transactions in Brave.')
  }
}

const {addSynopsisVisits} = require('../synopsisHelpers')
function addSimulatedSynopsisVisits (numPublishers) {
  let userDataPath = app.getPath('userData')
  const sessionFile = path.join(userDataPath, `session-store-1`)

  try {
    let sessionData = fs.readFileSync(sessionFile)
    sessionData = JSON.parse(sessionData)

    sessionData = addSynopsisVisits(sessionData, numPublishers)
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2))
  } catch (err) {
    console.error('ERROR in addSimulatedSynopsisVisits: ', err.toString())
  }
}

app.on('ready', () => {
  const cmd = process.argv[2]
  switch (cmd) {
    case 'cleanUserData':
      cleanUserData(process.argv[3])
      break
    case 'addSimulatedLedgerTransactions':
      addSimulatedLedgerTransactions(parseInt(process.argv[3]))
      break
    case 'addSimulatedSynopsisVisits':
      addSimulatedSynopsisVisits(parseInt(process.argv[3]))
      break
  }

  process.exit(0)
})
