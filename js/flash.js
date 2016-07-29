// @flow
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs')
const path = require('path')
let electron
let app
try {
  electron = require('electron')
} catch (e) {
  electron = global.require('electron')
}
if (process.type === 'browser') {
  app = electron.app
} else {
  app = electron.remote.app
}

const getPepperFlashPath = () => {
  if (['darwin', 'win32'].includes(process.platform)) {
    return app.getPath('pepperFlashSystemPlugin')
  }
  const basePath = '/usr/lib'
  const plugin = 'libpepflashplayer.so'
  let pluginPath = path.resolve(basePath, 'pepperflash-nonfree', plugin)
  try {
    fs.statSync(pluginPath)
  } catch (e) {
    pluginPath = path.resolve(basePath, 'PepperFlash', plugin)
    // Throws error if not found
    fs.statSync(pluginPath)
  }
  return pluginPath
}

module.exports.init = () => {
  // TODO: This only works if sync currently
  try {
    const pepperFlashSystemPluginPath = getPepperFlashPath()
    const pepperFlashManifestPath = path.resolve(pepperFlashSystemPluginPath, '..', 'manifest.json')
    const data = fs.readFileSync(pepperFlashManifestPath)
    if (!data) {
      return false
    }

    const pepperFlashManifest = JSON.parse(data)
    app.commandLine.appendSwitch('ppapi-flash-path', pepperFlashSystemPluginPath)
    app.commandLine.appendSwitch('ppapi-flash-version', pepperFlashManifest.version)
    return true
  } catch (e) {
    return false
  }
}

module.exports.checkFlashInstalled = (cb) => {
  try {
    const pepperFlashSystemPluginPath = getPepperFlashPath()
    const pepperFlashManifestPath = path.resolve(pepperFlashSystemPluginPath, '..', 'manifest.json')
    fs.readFile(pepperFlashManifestPath, (err, data) => {
      if (err || !data) {
        cb(false)
      } else {
        cb(true)
      }
    })
  } catch (e) {
    cb(false)
  }
}
