// @flow
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs')
const path = require('path')
const electron = require('electron')
const app = electron.app
const appActions = require('./actions/appActions')
const settings = require('./constants/settings')

// set to true if the flash install check has succeeded
let flashInstalled = false

const getPepperFlashPath = () => {
  if (['darwin', 'win32'].includes(process.platform)) {
    return app.getPath('pepperFlashSystemPlugin')
  }
  const basePath = '/usr/lib'
  const plugin = 'libpepflashplayer.so'
  let pluginPath = path.resolve(basePath, 'pepperflashplugin-nonfree', plugin)
  try {
    fs.statSync(pluginPath)
  } catch (e) {
    pluginPath = path.resolve(basePath, 'PepperFlash', plugin)
    try {
      fs.statSync(pluginPath)
    } catch (e) {
      // Throws error if not found
      pluginPath = path.resolve('/usr/lib64/chromium', 'PepperFlash', plugin)
    }
  }
  return pluginPath
}

module.exports.checkFlashInstalled = (cb) => {
  try {
    const pepperFlashSystemPluginPath = getPepperFlashPath()
    const pepperFlashManifestPath = path.resolve(pepperFlashSystemPluginPath, '..', 'manifest.json')
    fs.readFile(pepperFlashManifestPath, (err, data) => {
      try {
        if (err || !data) {
          flashInstalled = false
        } else {
          const manifest = JSON.parse(data)
          app.commandLine.appendSwitch('ppapi-flash-path', pepperFlashSystemPluginPath)
          app.commandLine.appendSwitch('ppapi-flash-version', manifest.version)
          flashInstalled = true
        }
      } finally {
        appActions.changeSetting(settings.FLASH_INSTALLED, flashInstalled)
        cb && cb(flashInstalled)
      }
    })
  } catch (e) {
    cb && cb(flashInstalled)
  }
}

module.exports.init = () => {
  setImmediate(module.exports.checkFlashInstalled)
}

module.exports.resourceName = 'flash'
