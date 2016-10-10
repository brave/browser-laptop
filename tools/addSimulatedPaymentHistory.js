let runUtilApp = require('./utilAppRunner')

let cmd = 'addSimulatedLedgerTransactions'

// if user has specified number of simulated transactions to add
if (process.argv[3]) {
  cmd += ' ' + process.argv[3]
}

console.log(`passing runUtilApp the command "${cmd}"`)
runUtilApp(cmd)
