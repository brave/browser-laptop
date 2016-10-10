'use strict'

const electron = require('electron')
const app = electron.app
app.setName('brave')
require('../../../app/browser/lib/patchUserDataDir')

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

  let ledgerState = JSON.parse(fs.readFileSync(ledgerStatePath).toString())

  let simulatedTransactions = simulateLedgerTransactions(numTx)

  ledgerState.transactions = (ledgerState.transactions || []).concat(simulatedTransactions)

  fs.writeFileSync(ledgerStatePath, JSON.stringify(ledgerState, null, 2))
}

app.on('ready', () => {
  const cmd = process.argv[2]
  switch (cmd) {
    case 'cleanUserData':
      cleanUserData(process.argv[3])
      break
    case 'addSimulatedLedgerTransactions':
      addSimulatedLedgerTransactions(process.argv[3])
      break
  }

  process.exit(0)
})
