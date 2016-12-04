// @flow
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs')
const path = require('path')
const electron = require('electron')
const app = electron.app
const ipcMain = electron.ipcMain
const webContents = electron.webContents
const appActions = require('./actions/appActions')
const appConfig = require('./constants/appConfig')
const Filtering = require('../app/filtering')
const locale = require('../app/locale')
const messages = require('./constants/messages')
const siteUtil = require('./state/siteUtil')
const urlParse = require('url').parse
const settings = require('./constants/settings')
const {siteHacks} = require('./data/siteHacks')
const urlutil = require('./lib/urlutil')

let flashInstalled = false
const notificationCallbacks = {}

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
 * Shows a Flash CtP notification if Flash is installed and enabled.
 * If not enabled, alert user that Flash is installed.
 * @param {string} origin - frame origin that is requesting to run flash.
 *   can either be main frame or subframe.
 */
const showFlashNotification = (origin, tabId, url, noFlashUrl) => {
  // Generate a random string that is unlikely to collide. Not
  // cryptographically random.
  const nonce = Math.random().toString()

  if (flashInstalled) {
    const message = locale.translation('allowFlashPlayer', { origin })
    // Show Flash notification bar
    appActions.showMessageBox({
      buttons: [
        {text: locale.translation('deny')},
        {text: locale.translation('allow')}
      ],
      message,
      frameOrigin: origin,
      options: {
        nonce,
        persist: true
      }
    })
    notificationCallbacks[message] = (buttonIndex, persist) => {
      let newUrl = null
      if (buttonIndex === 1) {
        if (persist) {
          appActions.changeSiteSetting(origin, 'flash', Date.now() + 7 * 24 * 1000 * 3600)
        } else {
          appActions.changeSiteSetting(origin, 'flash', 1)
        }
        newUrl = url
      } else {
        if (persist) {
          appActions.changeSiteSetting(origin, 'flash', false)
        }
        if (noFlashUrl) {
          newUrl = noFlashUrl
        }
      }

      if (!newUrl) {
        return
      }

      let tab = webContents.fromTabID(tabId)
      if (tab && !tab.isDestroyed()) {
        tab.loadURL(newUrl)
      }
    }
  } else {
    module.exports.checkFlashInstalled((installed) => {
      if (installed) {
        let message = locale.translation('flashInstalled')
        appActions.showMessageBox({
          buttons: [
            {text: locale.translation('goToPrefs')},
            {text: locale.translation('goToAdobe')}
          ],
          message: message,
          options: {nonce}
        })
        notificationCallbacks[message] = (buttonIndex, persist) => {
          const location = buttonIndex === 0 ? 'about:preferences#security' : appConfig.flash.installUrl
          appActions.newTab({ location })
        }
      } else if (noFlashUrl) {
        let tab = webContents.fromTabID(tabId)
        if (tab && !tab.isDestroyed()) {
          tab.loadURL(noFlashUrl)
        }
      }
    })
  }

  ipcMain.once(messages.NOTIFICATION_RESPONSE + nonce, (e, msg, buttonIndex, persist) => {
    try {
      const cb = notificationCallbacks[msg]
      delete notificationCallbacks[msg]
      if (cb) {
        cb(buttonIndex, persist)
      }
    } catch (e) {
      console.error(e)
    }
    appActions.hideMessageBox(msg)
  })
}

const flashSetting = (url, isPrivate) => {
  let activeSiteSettings = Filtering.getSiteSettings(url, isPrivate)
  return activeSiteSettings && activeSiteSettings.get('flash')
}

const allowRunningFlash = (url, isPrivate) => {
  return typeof flashSetting(url, isPrivate) === 'number'
}

/**
 * Checks whether the first-party page is one that should have Flash install
 * URL interception.
 * @param {string} url
 * @return {boolean}
 */
const shouldInterceptFlash = (url, isPrivate) => {
  if (!url) {
    return false
  }

  if (flashSetting(url, isPrivate) === false) {
    return false
  }

  return urlutil.shouldInterceptFlash(url)
}

function handleFlashCTP (details, isPrivate) {
  // we never do anything with the result because this is after page load
  const result = {
    resourceName: module.exports.resourceName
  }

  if (!flashInstalled || details.resourceType !== 'mainFrame' || !allowRunningFlash(details.url, isPrivate)) {
    return result
  }

  const mainFrameUrl = Filtering.getMainFrameUrl(details)
  if (!mainFrameUrl) {
    return result
  }

  const origin = siteUtil.getOrigin(mainFrameUrl)
  const parsed = urlParse(mainFrameUrl)
  const hack = siteHacks[parsed.hostname]

  if (origin && hack && hack.enableFlashCTP) {
    // Fix #3011
    showFlashNotification(origin, details.tabId, null, hack.redirectURL)
  }

  return result
}

function handleFlashInstallUrl (details, isPrivate) {
  const result = {
    resourceName: module.exports.resourceName,
    redirectURL: null,
    cancel: false
  }

  if (details.resourceType !== 'mainFrame') {
    return result
  }

  const mainFrameUrl = Filtering.getMainFrameUrl(details)
  if (!mainFrameUrl) {
    return result
  }

  const origin = siteUtil.getOrigin(mainFrameUrl)
  if (origin && urlutil.isFlashInstallUrl(details.url) &&
        shouldInterceptFlash(mainFrameUrl, isPrivate)) {
    result.cancel = true
    showFlashNotification(origin, details.tabId, details.url)
  }

  return result
}

module.exports.init = (state, action) => {
  setImmediate(() => {
    module.exports.checkFlashInstalled((result, path, manifest) => {
      if (result) {
        flashInstalled = true
        Filtering.registerBeforeRequestFilteringCB(handleFlashInstallUrl)
        Filtering.registerHeadersReceivedFilteringCB(handleFlashCTP)
        app.commandLine.appendSwitch('ppapi-flash-path', path)
        app.commandLine.appendSwitch('ppapi-flash-version', manifest.version)
      }
      setImmediate(() => {
        appActions.changeSetting(settings.FLASH_INSTALLED, result)
      })
    })
  })
  return state
}

module.exports.checkFlashInstalled = (cb) => {
  try {
    const pepperFlashSystemPluginPath = getPepperFlashPath()
    const pepperFlashManifestPath = path.resolve(pepperFlashSystemPluginPath, '..', 'manifest.json')
    fs.readFile(pepperFlashManifestPath, (err, data) => {
      if (err || !data) {
        cb(false)
      } else {
        cb(true, pepperFlashSystemPluginPath, JSON.parse(data))
      }
    })
  } catch (e) {
    cb(false)
  }
}

module.exports.resourceName = 'flash'
