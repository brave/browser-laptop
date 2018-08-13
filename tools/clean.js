const path = require('path')
const rimraf = require('./lib/rimraf')

const rootDir = path.join(__dirname, '..')

process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const runUtilApp = require('./utilAppRunner')

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

const cmd = process.argv[2]
if (cmd) {
  module.exports[cmd]()
} else {
  module.exports.app()
}
