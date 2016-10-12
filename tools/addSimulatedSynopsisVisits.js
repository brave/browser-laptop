let runUtilApp = require('./utilAppRunner')

let cmd = 'addSimulatedSynopsisVisits'

// if user has specified number of simulated publishers to add
if (process.argv[2]) {
  cmd += ' ' + process.argv[2]
}

runUtilApp(cmd, undefined, ['inherit', 'inherit', 'inherit'])
