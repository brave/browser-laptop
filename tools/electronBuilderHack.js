var os = require('os')
var path = require('path')
var execute = require('./lib/execute')

console.log('Patching electron-builder native modules, please wait...')

var braveGyp = path.join(os.homedir(), '.brave-gyp')
var env = {
  HOME: braveGyp,
  APPDATA: braveGyp
}

var rebuildCmd = '"../.bin/node-gyp" rebuild'

var cmds = [
  'cp .npmrc ./node_modules/macos-alias',
  'cp .npmrc ./node_modules/fs-xattr',
  'cd ./node_modules/macos-alias',
  rebuildCmd,
  'cd ../fs-xattr',
  rebuildCmd
]

execute(cmds, env, console.log.bind(null, 'done'))
