var VersionInfo = require('./lib/versionInfo')
var execute = require('./lib/execute')

const isWindows = process.platform === 'win32'
const isDarwin = process.platform === 'darwin'
const arch = 'x64'
const buildDir = 'Brave-' + process.platform + '-' + arch

var appIcon
if (isWindows) {
  appIcon = 'res/app.ico'
} else if (isDarwin) {
  appIcon = 'res/app.icns'
} else {
  appIcon = 'res/app.png'
}

var env = {
  NODE_ENV: 'production'
}

console.log('Building version ' + VersionInfo.braveVersion + ' in ' + buildDir + ' with Electron ' + VersionInfo.electronVersion)

var cmds = [
  'rm -rf ' + buildDir,
  'rm -f dist/*.dmg dist/*.nupkg dist/*.exe dist/*.msi dist/RELEASES dist/*.zip',
  '"./node_modules/.bin/webpack"',
  'npm run checks',
  'node ./node_modules/electron-packager/cli.js . Brave' +
    ' --overwrite' +
    ' --ignore="electron-download|electron-rebuild|electron-packager|electron-builder|electron-prebuilt|electron-rebuild|babel$|babel-(?!polyfill|regenerator-runtime)"' +
    ' --platform=' + process.platform +
    ' --arch=' + arch +
    ' --version=' + VersionInfo.electronVersion +
    ' --icon=' + appIcon +
    ' --asar=true' +
    ' --app-version=' + VersionInfo.braveVersion +
    ' --build-version=' + VersionInfo.electronVersion +
    ' --protocol="http" --protocol-name="HTTP Handler"' +
    ' --protocol="https" --protocol-name="HTTPS Handler"' +
    ' --version-string.CompanyName=\"Brave Inc.\"' +
    ' --version-string.ProductName=\"Brave\"' +
    ' --version-string.Copyright=\"Copyright 2016, Brave Inc.\"' +
    ' --version-string.FileDescription=\"Brave\"'
]

execute(cmds, env, console.log.bind(null, 'done'))
