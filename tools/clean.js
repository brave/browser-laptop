const path = require('path')
const proc = require('child_process')
const rimraf = require('./lib/rimraf')

const rootDir = path.join(__dirname, '..')

function runUtilApp (cmd, file) {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development'
  const utilAppDir = path.join(__dirname, 'lib', 'utilApp')
  const options = {
    env: process.env,
    cwd: utilAppDir
  }
  cmd = cmd.split(' ')
  const utilApp = proc.spawnSync('electron', [utilAppDir].concat(cmd), options)
  if (utilApp.error) {
    console.log('Could not run utilApp - run `npm install electron-prebuilt` and try again', utilApp.error)
  }
}

module.exports.nodeModules = () => {
  console.warn('removing node_modules...')
  rimraf.sync(path.join(rootDir, 'node_modules'))
}

module.exports.electron = () => {
  console.warn('removing ~/.electron...')
  rimraf.sync(path.join(process.env.HOME || process.env.USERPROFILE, '.electron'))
}

module.exports.userData = (file = process.argv[3]) => {
  let cmd = 'cleanUserData'
  if (file) {
    console.warn(`removing userData/${file}...`)
    cmd = cmd + ' ' + file
  } else {
    console.warn('removing userData...')
  }
  runUtilApp(cmd)
}

module.exports.sessionStore = () => {
  module.exports.userData('session-store-1')
}

module.exports.dataFiles = () => {
  module.exports.userData('ABPFilterParserData.dat')
  module.exports.userData('httpse.json')
  module.exports.userData('SafeBrowsingData.dat')
  module.exports.userData('TrackingProtection.dat')
}

module.exports.app = () => {
  module.exports.electron()
  module.exports.nodeModules()
  console.log('done')
}

module.exports.all = () => {
  module.exports.userData()
  module.exports.app()
}

var cmd = process.argv[2]
if (cmd) {
  module.exports[cmd]()
} else {
  module.exports.app()
}
