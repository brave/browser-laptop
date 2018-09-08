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

function ledgerStateFileError (func, path, exc) {
  console.error(`\nERROR in ${func}: could not find/open/parse Ledger data file.`)
  console.error(`\nExpected path to Ledger data file: ${path}`)
  console.error('\nProbable solution: Run Brave and enable Payments, then execute this script. Enabling/disabling Payments (or restarting Brave) should then show the generated transactions in Brave.')
  console.error(exc.toString())
}

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
    ledgerStateFileError('addSimulatedLedgerTransactions', ledgerStatePath, exc)
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

/**
 * Usage:
 * npm push-back-next-reconcile-stamp {numWeeks}
 *
 * @param numWeeks - Number of weeks to subtract from the current reconcileStamp
 *
 * If numWeeks is not provided, reconcileStamp will be set to the current
 * time minus one week. (This serves to set the payment status as overdue to trigger reconcilation)
 */
function pushBackNextReconcileStamp (numWeeks) {
  numWeeks = parseInt(numWeeks) || -1

  const userDataPath = app.getPath('userData')
  const ledgerStatePath = path.join(userDataPath, 'ledger-state.json')

  try {
    let ledgerState = JSON.parse(fs.readFileSync(ledgerStatePath).toString())

    if (!ledgerState.reconcileStamp) {
      console.error('ERROR in setReconcileStamp: reconcileStamp not found in ledger-state.json')
      return
    }

    const now = new Date().getTime()
    const oneWeek = (1000 * 60 * 60 * 24 * 7)

    ledgerState.reconcileStamp = (numWeeks === -1)
      ? (now - oneWeek)
      : (ledgerState.reconcileStamp - (numWeeks * oneWeek))

    fs.writeFileSync(ledgerStatePath, JSON.stringify(ledgerState, null, 2))
    console.log(`Successfully set reconcileStamp to: ${ledgerState.reconcileStamp}`)
  } catch (exc) {
    ledgerStateFileError('pushBackNextReconcileStamp', ledgerStatePath, exc)
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
    case 'pushBackNextReconcileStamp':
      pushBackNextReconcileStamp(process.argv[3])
      break
  }

  process.exit(0)
})
