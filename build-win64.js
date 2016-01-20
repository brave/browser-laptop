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
  'set NODE_ENV=production&&"./node_modules/.bin/webpack"',
  'npm run checks',
  'node node_modules/electron-packager/cli.js . Brave --ignore=\"electron-packager|electron-builder|electron-prebuilt|electron-rebuild|win64-dist|babel$|babel-(?!polyfill|regenerator-runtime)\" --platform=win32 --arch=x64 --version=' + electronVersion + ' --icon=res/app.ico --asar=true --app-version=' + version + ' --version-string.CompanyName=\"Brave Inc.\" --version-string.ProductName=\"Brave\" --version-string.Copyright=\"Copyright 2016, Brave Inc.\" --version-string.FileDescription=\"Brave\"'
]

var cmd = cmds.join(' && ')

console.log(cmd)

exec(cmd, function (err, stdout, stderr) {
  if (err) console.error(err)
  console.log(stdout)
})
