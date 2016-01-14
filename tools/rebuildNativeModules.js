var VersionInfo = require('./lib/versionInfo')
var execute = require('./lib/execute')
var fs = require('fs')

console.log('Patching sqlite3 binding.gyp...')
;(function patchSqliteBindingGYP (gypPath, moduleName, modulePath) {
  var gypFileContents = fs.readFileSync(gypPath, 'UTF8')
  // Backup the old file
  fs.writeFileSync(gypPath + '.old', gypFileContents)
  // Replace some variables which aren't supported by the npm dist version
  // we need to use.
  gypFileContents = gypFileContents
    .replace(/<\(module_name\)/g, moduleName)
    .replace(/<\(module_path\)/g, modulePath)
  // Write out the patched binding.gyp file
  fs.writeFileSync(gypPath, gypFileContents)
})('./node_modules/sqlite3/binding.gyp',
  'node_sqlite3',
  './lib/binding/node-v' + process.versions.modules +
    '-' + process.platform + '-' + process.arch)

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
  'cd ../../',
  'cd ./node_modules/sqlite3',
  '"../../node_modules/.bin/node-gyp" rebuild' +
    ' --target=' + VersionInfo.electronVersion +
    ' --arch=x64' +
    ' --dist-url=https://atom.io/download/atom-shell',
  'cd ../../'
]

execute(cmds, env, console.log.bind(null, 'done'))
