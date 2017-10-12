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

const updateExistingSynopsisFile = require('../synopsisHelpers').updateExistingSynopsisFile
function addSimulatedSynopsisVisits (numPublishers) {
  let userDataPath = app.getPath('userData')
  let ledgerSynopsisPath = path.join(userDataPath, 'ledger-synopsis.json')

  updateExistingSynopsisFile(ledgerSynopsisPath, numPublishers)
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
