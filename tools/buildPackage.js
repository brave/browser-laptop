/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var VersionInfo = require('./lib/versionInfo')
var execute = require('./lib/execute')
const ignoredPaths = require('./lib/ignoredPaths')
const config = require('./lib/config')
const path = require('path')

const isWindows = process.platform === 'win32'
const isDarwin = process.platform === 'darwin'
var arch = 'x64'
const isLinux = process.platform === 'linux'

var appIcon
if (isWindows) {
  appIcon = 'res/app.ico'
  if (process.env.TARGET_ARCH === 'ia32') {
    arch = 'ia32'
  }
} else if (isDarwin) {
  appIcon = 'res/app.icns'
} else {
  appIcon = 'res/app.png'
}

const buildDir = 'Brave-' + process.platform + '-' + arch

var env = {
  NODE_ENV: 'production',
  CHANNEL: process.env.CHANNEL
}

var channels = { dev: true, beta: true, stable: true }
if (!channels[env.CHANNEL]) {
  throw new Error('CHANNEL environment variable must be set to dev, beta or stable')
}

console.log('Writing buildConfig.js...')
config.writeBuildConfig(
  {
    channel: env.CHANNEL,
    BROWSER_LAPTOP_REV: require('git-rev-sync').long(),
    nodeEnv: env.NODE_ENV
  },
  'buildConfig.js'
)

var cmds = ['echo cleaning up target...']

if (isWindows) {
  cmds = cmds.concat([
    '(if exist Brave-win32-x64 rmdir /s /q Brave-win32-x64)',
    '(if exist Brave-win32-ia32 rmdir /s /q Brave-win32-ia32)'
  ])

  // Remove the destination folder for the selected arch
  if (arch === 'ia32') {
    cmds = cmds.concat([
      '(if exist dist-ia32 rmdir /s /q dist-ia32)'
    ])
  } else {
    cmds = cmds.concat([
      '(if exist dist-x64 rmdir /s /q dist-x64)'
    ])
  }
} else {
  cmds = cmds.concat([
    'rm -Rf ' + buildDir,
    'rm -Rf dist',
    'rm -f Brave.tar.bz2'
  ])
}

cmds = cmds.concat([
  'echo done',
  'echo starting build...'
])

console.log('Building version ' + VersionInfo.braveVersion + ' in ' + buildDir + ' with Electron ' + VersionInfo.electronVersion)

cmds = cmds.concat([
  '"./node_modules/.bin/webpack"',
  'npm run checks',
  'node ./node_modules/electron-packager/cli.js . Brave' +
    ' --overwrite' +
    ' --ignore="' + ignoredPaths.join('|') + '"' +
    ' --platform=' + process.platform +
    ' --arch=' + arch +
    ' --version=' + VersionInfo.electronVersion +
    ' --icon=' + appIcon +
    ' --asar=true' +
    ' --app-version=' + VersionInfo.braveVersion +
    ' --build-version=' + VersionInfo.electronVersion +
    ' --protocol="http" --protocol-name="HTTP Handler"' +
    ' --protocol="https" --protocol-name="HTTPS Handler"' +
    ' --version-string.CompanyName="Brave Software"' +
    ' --version-string.ProductName="Brave"' +
    ' --version-string.Copyright="Copyright 2017, Brave Software"' +
    ' --version-string.FileDescription="Brave"'
])

function BuildManifestFile () {
  const fs = require('fs')
  const fileContents = fs.readFileSync('./res/Update.VisualElementsManifest.xml', 'utf8')
  const versionedFileContents = fileContents.replace(/{{braveVersion}}/g, 'app-' + VersionInfo.braveVersion)
  fs.writeFileSync('temp.VisualElementsManifest.xml', versionedFileContents, 'utf8')
}

if (isLinux) {
  cmds.push('mv Brave-linux-x64/Brave Brave-linux-x64/brave')
  cmds.push('ncp ./app/extensions ' + path.join(buildDir, 'resources', 'extensions'))
} else if (isDarwin) {
  cmds.push('ncp ./app/extensions ' + path.join(buildDir, 'Brave.app', 'Contents', 'Resources', 'extensions'))
} else if (isWindows) {
  BuildManifestFile()
  cmds.push('move .\\temp.VisualElementsManifest.xml "' + path.join(buildDir, 'resources', 'Update.VisualElementsManifest.xml') + '"')
  cmds.push('copy .\\res\\start-tile-70.png "' + path.join(buildDir, 'resources', 'start-tile-70.png') + '"')
  cmds.push('copy .\\res\\start-tile-150.png "' + path.join(buildDir, 'resources', 'start-tile-150.png') + '"')
  cmds.push('makensis.exe -DARCH=' + arch + ' res/braveDefaults.nsi')
  cmds.push('ncp ./app/extensions ' + path.join(buildDir, 'resources', 'extensions'))
  // Make sure the Brave.exe binary is squirrel aware so we get squirrel events and so that Squirrel doesn't auto create shortcuts.
  cmds.push('"node_modules/rcedit/bin/rcedit.exe" ./Brave-win32-' + arch + '/Brave.exe --set-version-string "SquirrelAwareVersion" "1"')
}

cmds.push('mkdirp ' + path.join(buildDir, 'resources', 'app.asar.unpacked', 'node_modules', 'spellchecker', 'vendor', 'hunspell_dictionaries'))
cmds.push('ncp ' + path.join('node_modules', 'spellchecker', 'vendor', 'hunspell_dictionaries') + ' ' + path.join(buildDir, 'resources', 'app.asar.unpacked', 'node_modules', 'spellchecker', 'vendor', 'hunspell_dictionaries'))

if (isDarwin) {
  cmds.push('mkdirp ' + path.join(buildDir, 'Brave.app', 'Contents', 'Resources', 'app.asar.unpacked', 'node_modules', 'node-anonize2-relic-emscripten'))
  cmds.push('ncp ' + path.join('node_modules', 'node-anonize2-relic-emscripten', 'anonize2.js.mem') + ' ' + path.join(buildDir, 'Brave.app', 'Contents', 'Resources', 'app.asar.unpacked', 'node_modules', 'node-anonize2-relic-emscripten', 'anonize2.js.mem'))
} else {
  cmds.push('mkdirp ' + path.join(buildDir, 'resources', 'app.asar.unpacked', 'node_modules', 'node-anonize2-relic-emscripten'))
  cmds.push('ncp ' + path.join('node_modules', 'node-anonize2-relic-emscripten', 'anonize2.js.mem') + ' ' + path.join(buildDir, 'resources', 'app.asar.unpacked', 'node_modules', 'node-anonize2-relic-emscripten', 'anonize2.js.mem'))
}

execute(cmds, env, (err) => {
  if (err) {
    console.error('buildPackage failed', err)
    process.exit(1)
    return
  }
  config.clearBuildConfig()
  console.log('done')
})
