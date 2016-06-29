var os = require('os')
var path = require('path')
var VersionInfo = require('./lib/versionInfo')
var execute = require('./lib/execute')

console.log('Installing native modules, please wait...')

var braveGyp = path.join(os.homedir(), '.brave-gyp')
var env = {
  HOME: braveGyp,
  APPDATA: braveGyp
}

var rebuildCmd = '"../.bin/node-gyp" rebuild' +
  ' --target=' + VersionInfo.electronVersion +
  ' --arch=x64' +
  ' --dist-url=https://atom.io/download/atom-shell'

var cmds = [
  'cd ./node_modules/abp-filter-parser-cpp',
  rebuildCmd,
  'cd ../tracking-protection',
  rebuildCmd,
  'cd ../spellchecker',
  rebuildCmd,
  'cd ../keytar',
  rebuildCmd
]

execute(cmds, env, console.log.bind(null, 'done'))
