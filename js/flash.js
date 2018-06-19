// @flow
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs')
const path = require('path')
const {app, ipcMain, webContents, Menu} = require('electron')
const appActions = require('./actions/appActions')
const {getOrigin} = require('./lib/urlutil')
const locale = require('../app/locale')
const messages = require('./constants/messages')
const settings = require('./constants/settings')
const appConfig = require('./constants/appConfig')
const {getSetting} = require('./settings')
const {memoize} = require('underscore')
const tabState = require('../app/common/state/tabState')

// set to true if the flash install check has succeeded
let flashInstalled = false

const getPepperFlashPath = memoize(() => {
  if (['darwin', 'win32'].includes(process.platform)) {
    try {
      return app.getPath('pepperFlashSystemPlugin')
    } catch (e) {
      return undefined
    }
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
})

module.exports.getFlashResourceId = () => {
  const pepperPath = getPepperFlashPath()
  if (!pepperPath) {
    return 'unknown-flash-resource-id'
  }
  return path.basename(pepperPath)
}

module.exports.showFlashMessageBox = (location, tabId) => {
  const origin = getOrigin(location)
  const message = locale.translation('allowFlashPlayer', {origin})

  // This is bad, we shouldn't be calling actions from actions
  // so we need to refactor notifications into a state helper
  appActions.showNotification({
    buttons: [
      {text: locale.translation('deny')},
      {text: locale.translation('allow')}
    ],
    message,
    frameOrigin: origin,
    options: {
      persist: true
    }
  })

  ipcMain.once(messages.NOTIFICATION_RESPONSE, (e, msg, buttonIndex, persist) => {
    if (msg === message) {
      appActions.hideNotification(message)
      if (buttonIndex === 1) {
        if (persist) {
          appActions.changeSiteSetting(origin, 'flash', Date.now() + (7 * 24 * 1000 * 3600))
        } else {
          appActions.changeSiteSetting(origin, 'flash', 1)
        }

        if (tabId) {
          const tab = webContents.fromTabID(tabId)
          if (tab && !tab.isDestroyed()) {
            tab.reload()
          }
        }
      } else {
        if (persist) {
          appActions.changeSiteSetting(origin, 'flash', false)
        }
      }
    }
  })
}

module.exports.checkFlashInstalled = (cb) => {
  try {
    const pepperFlashSystemPluginPath = getPepperFlashPath()
    if (!pepperFlashSystemPluginPath) {
      return false
    }
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

const flashMenuTemplateInit = (state, tabId) => {
  const windowId = tabState.getWindowId(state, tabId)
  const location = tabState.getLocation(state, tabId)
  const isPrivate = tabState.isIncognito(state, tabId)

  const canRunFlash = state.getIn(['flash', 'enabled']) && getSetting(settings.FLASH_INSTALLED)
  const template = []
  if (!canRunFlash) {
    template.push({
      label: locale.translation('openFlashPreferences'),
      click: () => {
        appActions.createTabRequested({
          url: 'about:preferences#plugins',
          windowId: windowId,
          active: true
        })
      }
    })
  } else {
    template.push({
      label: locale.translation('allowFlashOnce'),
      click: () => {
        appActions.allowFlashOnce(tabId, location, isPrivate)
      }
    })
    if (!isPrivate) {
      template.push({
        label: locale.translation('allowFlashAlways'),
        click: () => {
          appActions.allowFlashAlways(tabId, location)
        }
      })
    }
  }
  return template
}

module.exports.onFlashContextMenu = (state, tabId) => {
  const tab = webContents.fromTabID(tabId)
  if (!tab) {
    return
  }
  if (tab.session && tab.session.partition === appConfig.tor.partition) {
    return
  }

  const flashMenu = Menu.buildFromTemplate(flashMenuTemplateInit(state, tabId))
  flashMenu.popup(tab)
}

module.exports.init = () => {
  setImmediate(module.exports.checkFlashInstalled)
}

module.exports.resourceName = 'flash'
