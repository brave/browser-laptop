let runUtilApp = require('./utilAppRunner')

let cmd = 'addSimulatedLedgerTransactions'

// if user has specified number of simulated transactions to add
if (process.argv[2]) {
  cmd += ' ' + process.argv[2]
}

runUtilApp(cmd, undefined, ['inherit', 'inherit', 'inherit'])
