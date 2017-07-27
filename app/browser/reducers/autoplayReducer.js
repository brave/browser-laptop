/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const {makeImmutable} = require('../../common/state/immutableUtil')
const {ipcMain, webContents} = require('electron')
const siteSettings = require('../../../js/state/siteSettings')
const appActions = require('../../../js/actions/appActions')
const {getOrigin} = require('../../../js/state/siteUtil')
const locale = require('../../locale')
const messages = require('../../../js/constants/messages')

let notificationCallbacks = []

const showAutoplayMessageBox = (state, tabId) => {
  const tab = webContents.fromTabID(tabId)
  if (!tab || tab.isDestroyed()) {
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
      {text: locale.translation('allow')},
      {text: locale.translation('deny')}
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
        if (buttonIndex === 0) {
          appActions.changeSiteSetting(origin, 'autoplay', true)
          if (tab && !tab.isDestroyed()) {
            tab.reload()
            const temporaryAllow = (e) => {
              tab.removeListener('media-started-playing', temporaryAllow)
              if (!persist) {
                appActions.removeSiteSetting(origin, 'autoplay')
              }
            }
            tab.on('media-started-playing', temporaryAllow)
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
  }
}

const autoplayReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_AUTOPLAY_BLOCKED:
      showAutoplayMessageBox(state, action.get('tabId'))
      break
    case appConstants.APP_AUTOPLAY_DISMISSED:
      hideAutoplayMessageBox(action.get('tabId'))
      break
  }
  return state
}

module.exports = autoplayReducer
