// @flow
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs')
const path = require('path')
const electron = require('electron')
const app = electron.app
const webContents = electron.webContents
const appActions = require('./actions/appActions')
const Filtering = require('../app/filtering')
const settings = require('./constants/settings')

// set to true if `init` has been called
let initialized = false
// set to true if the flash install check has succeeded
let flashInstalled = false
// set to true if a flash install url has been loaded
let flashMaybeInstalled = false

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

/**
 * Checks whether a link is an Flash installer URL.
 * @param {string} url
 * @return {boolean}
 */
const isFlashInstallUrl = (url) => {
  const adobeRegex = new RegExp('//(get\\.adobe\\.com/([a-z_-]+/)*flashplayer|www\\.macromedia\\.com/go/getflash|www\\.adobe\\.com/go/getflash)', 'i')
  return adobeRegex.test(url)
}

const handleFlashInstallUrl = (details, isPrivate) => {
  const result = {
    resourceName: module.exports.resourceName,
    redirectURL: null,
    cancel: false
  }

  const url = details.url
  if (!url || details.resourceType !== 'mainFrame') {
    return result
  }

  if (!isFlashInstallUrl(url)) {
    return result
  }

  if (!flashInstalled) {
    if (flashMaybeInstalled) {
      setImmediate(() => {
        module.exports.checkFlashInstalled((installed) => {
          flashMaybeInstalled = installed
          let tab = webContents.fromTabID(details.tabId)
          if (tab && !tab.isDestroyed()) {
            tab.loadURL(url)
          }
        })
      })
      result.cancel = true
    } else {
      flashMaybeInstalled = true
    }
  }

  return result
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
  if (initialized) {
    return
  }
  initialized = true

  Filtering.registerBeforeRequestFilteringCB(handleFlashInstallUrl)
  module.exports.checkFlashInstalled()
}

module.exports.resourceName = 'flash'
