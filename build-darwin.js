var fs = require('fs')
var exec = require('child_process').exec

// get our version
var pack = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
var version = pack.version

// get the electron version
var electronPrebuiltPack = JSON.parse(fs.readFileSync('./node_modules/electron-prebuilt/package.json', 'utf-8'))
var electronVersion = electronPrebuiltPack.version

console.log('Building version ' + version + ' in Brave-darwin-x64 with Electron ' + electronVersion)

var cmds = [
  'rm -rf Brave-darwin-x64',
  'NODE_ENV=production ./node_modules/webpack/bin/webpack.js',
  'rm -f dist/Brave.dmg',
  './node_modules/electron-packager/cli.js . Brave --overwrite --ignore="electron-download|electron-rebuild|electron-packager|electron-builder|electron-prebuilt|electron-rebuild|babel$|babel-(?!polyfill|regenerator-runtime)" --platform=darwin --arch=x64 --version=' + electronVersion + ' --icon=res/app.icns --app-version=' + version + ' --build-version=' + electronVersion
]

var cmd = cmds.join(' && ')

console.log(cmd)

exec(cmd, function (err, stdout, stderr) {
  if (err) console.error(err)
  console.log(stdout)
})
