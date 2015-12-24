var fs = require('fs')
var exec = require('child_process').exec

// get our version
var pack = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
var version = pack.version

// get the electron version
var electronPrebuiltPack = JSON.parse(fs.readFileSync('./node_modules/electron-prebuilt/package.json', 'utf-8'))
var electronVersion = electronPrebuiltPack.version

console.log('Building version ' + version + ' in Brave-win32-x64 with Electron ' + electronVersion)

var cmds = [
  'rm -rf Brave-win32-x64',
  'NODE_ENV=production ./node_modules/webpack/bin/webpack.js',
  'rm -f dist/Brave.dmg',
  './node_modules/electron-packager/cli.js . Brave --overwrite --ignore=\"electron-packager|electron-builder|electron-prebuilt|electron-rebuild|babel$|babel-(?!polyfill|regenerator-runtime)\" --platform=win32 --arch=x64 --version=' + electronVersion + ' --icon=res/app.ico --app-version=' + version
]

var cmd = cmds.join(' && ')

console.log(cmd)

exec(cmd, function (err, stdout, stderr) {
  if (err) console.error(err)
  console.log(stdout)
})
