/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const {makeImmutable} = require('../../common/state/immutableUtil')
const {ipcMain, webContents} = require('electron')
const siteSettings = require('../../../js/state/siteSettings')
const appActions = require('../../../js/actions/appActions')
const {getOrigin} = require('../../../js/lib/urlutil')
const locale = require('../../locale')
const messages = require('../../../js/constants/messages')
const getSetting = require('../../../js/settings').getSetting
const settings = require('../../../js/constants/settings')
const {autoplayOption} = require('../../common/constants/settingsEnums')

let notificationCallbacks = []
let temporaryAllowPlays = []

const showAutoplayMessageBox = (state, tabId) => {
  const tab = webContents.fromTabID(tabId)
  if (!tab || tab.isDestroyed() ||
      getSetting(settings.AUTOPLAY_MEDIA) === autoplayOption.ALWAYS_DENY) {
    return
  }
  const location = tab.getURL()
  const origin = getOrigin(location)
  const originSettings = siteSettings.getSiteSettingsForURL(state.get('siteSettings'), origin)
  if (originSettings && originSettings.get('autoplay') === false) {
    return
  }

  const message = locale.translation('allowAutoplay', {origin})

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

  if (!notificationCallbacks[tabId]) {
    notificationCallbacks[tabId] = (e, msg, buttonIndex, persist) => {
      if (msg === message) {
        appActions.hideNotification(message)
        if (buttonIndex === 1) {
          appActions.changeSiteSetting(origin, 'autoplay', true)
          if (tab && !tab.isDestroyed()) {
            tab.reload()
            if (!persist) {
              temporaryAllowPlays[tabId] = origin
            }
          }
        } else {
          if (persist) {
            appActions.changeSiteSetting(origin, 'autoplay', false)
          }
        }
        if (notificationCallbacks[tabId]) {
          ipcMain.removeListener(messages.NOTIFICATION_RESPONSE, notificationCallbacks[tabId])
          delete notificationCallbacks[tabId]
        }
      }
    }
    ipcMain.on(messages.NOTIFICATION_RESPONSE, notificationCallbacks[tabId])
  }
}

const hideAutoplayMessageBox = (tabId) => {
  const tab = webContents.fromTabID(tabId)
  if (!tab || tab.isDestroyed()) {
    return
  }
  const location = tab.getURL()
  const origin = getOrigin(location)
  const message = locale.translation('allowAutoplay', {origin})
  appActions.hideNotification(message)
  if (notificationCallbacks[tabId]) {
    ipcMain.removeListener(messages.NOTIFICATION_RESPONSE, notificationCallbacks[tabId])
    delete notificationCallbacks[tabId]
    temporaryAllowPlays[tabId] = origin
    appActions.changeSiteSetting(origin, 'autoplay', true)
  }
}

const removeTemporaryAllowPlays = (tabId) => {
  if (temporaryAllowPlays[tabId]) {
    appActions.removeSiteSetting(temporaryAllowPlays[tabId], 'autoplay')
    delete temporaryAllowPlays[tabId]
  }
}

const autoplayReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_AUTOPLAY_BLOCKED:
      showAutoplayMessageBox(state, action.get('tabId'))
      break
    case appConstants.APP_MEDIA_STARTED_PLAYING:
      hideAutoplayMessageBox(action.get('tabId'))
      break
    case appConstants.APP_TAB_CLOSED:
      removeTemporaryAllowPlays(action.get('tabId'))
      break
    case appConstants.APP_SHUTTING_DOWN:
      temporaryAllowPlays.forEach((origin) => {
        appActions.removeSiteSetting(origin, 'autoplay')
      })
      break
  }
  return state
}

module.exports = autoplayReducer
