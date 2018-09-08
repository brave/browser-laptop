let runUtilApp = require('./utilAppRunner')

let cmd = 'pushBackNextReconcileStamp'

if (process.argv[2]) {
  cmd += ' ' + process.argv[2]
}

runUtilApp(cmd, undefined, ['inherit', 'inherit', 'inherit'])
