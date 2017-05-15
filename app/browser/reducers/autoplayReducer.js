/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const {makeImmutable} = require('../../common/state/immutableUtil')
const {ipcMain, webContents} = require('electron')
const AppStore = require('../../../js/stores/appStore')
const siteSettings = require('../../../js/state/siteSettings')
const settings = require('../../../js/constants/settings')
const appActions = require('../../../js/actions/appActions')
const {getOrigin} = require('../../../js/state/siteUtil')
const locale = require('../../locale')
const messages = require('../../../js/constants/messages')
const getSetting = require('../../../js/settings').getSetting
const {autoplayOption} = require('../../common/constants/settingsEnums')

const showAutoplayMessageBox = (tabId) => {
  const tab = webContents.fromTabID(tabId)
  if (!tab || tab.isDestroyed()) {
    return
  }
  const location = tab.getURL()
  const origin = getOrigin(location)
  if (getSetting(settings.AUTOPLAY_MEDIA) === autoplayOption.ALWAYS_ALLOW) {
    appActions.changeSiteSetting(origin, 'autoplay', true)
    return
  }
  const originSettings = siteSettings.getSiteSettingsForURL(AppStore.getState().get('siteSettings'), origin)
  if (originSettings && originSettings.get('autoplay') === false) {
    return
  }
  const message = locale.translation('allowAutoplay', {origin})

  appActions.showNotification({
    buttons: [
      {text: locale.translation('yes')},
      {text: locale.translation('no')}
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
      if (buttonIndex === 0) {
        appActions.changeSiteSetting(origin, 'autoplay', true)
        if (tab && !tab.isDestroyed()) {
          tab.reload()
          tab.on('destroyed', function temporaryAllow (e) {
            if (!persist) {
              appActions.removeSiteSetting(origin, 'autoplay')
            }
          })
        }
      } else {
        if (persist) {
          appActions.changeSiteSetting(origin, 'autoplay', false)
        }
      }
    }
  })
}

const autoplayReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_AUTOPLAY_BLOCKED:
      showAutoplayMessageBox(action.get('tabId'))
      break
  }
  return state
}

module.exports = autoplayReducer
