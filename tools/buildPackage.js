/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var VersionInfo = require('./lib/versionInfo')
var execute = require('./lib/execute')
const ignoredPaths = require('./lib/ignoredPaths')
const config = require('./lib/config')

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
    channel: env.CHANNEL
  },
  'buildConfig.js'
)

var cmds = ['echo cleaning up target...']

if (isWindows) {
  cmds = cmds.concat([
    '(if exist ' + buildDir + ' rmdir /s /q ' + buildDir + ')',
    '(if exist dist rmdir /s /q dist)'
  ])
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
    ' --version-string.CompanyName=\"Brave Inc.\"' +
    ' --version-string.ProductName=\"Brave\"' +
    ' --version-string.Copyright=\"Copyright 2016, Brave Inc.\"' +
    ' --version-string.FileDescription=\"Brave\"'
])

if (process.platform === 'linux') {
  cmds.push('mv Brave-linux-x64/Brave Brave-linux-x64/brave')
}

execute(cmds, env, console.log.bind(null, 'done'))
