var VersionInfo = require('./lib/versionInfo')
var execute = require('./lib/execute')

console.log('Installing native modules, please wait...')
var env = {
  HOME: '~/.brave-gyp',
  APPDATA: '~/.brave-gyp'
}

var cmds = [
  'cd ./node_modules/abp-filter-parser-cpp',
  '"../../node_modules/.bin/node-gyp" rebuild' +
    ' --target=' + VersionInfo.electronVersion +
    ' --arch=x64' +
    ' --dist-url=https://atom.io/download/atom-shell',
  'cd ../../',
  'cd ./node_modules/tracking-protection',
  '"../../node_modules/.bin/node-gyp" rebuild' +
    ' --target=' + VersionInfo.electronVersion +
    ' --arch=x64' +
    ' --dist-url=https://atom.io/download/atom-shell',
  'cd ../../'
]

execute(cmds, env, console.log.bind(null, 'done'))
