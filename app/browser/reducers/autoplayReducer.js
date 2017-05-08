/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const {makeImmutable} = require('../../common/state/immutableUtil')
const {ipcMain, webContents} = require('electron')
const AppStore = require('../../../js/stores/appStore')
const siteSettings = require('../../../js/state/siteSettings')
const appActions = require('../../../js/actions/appActions')
const {getOrigin} = require('../../../js/state/siteUtil')
const locale = require('../../locale')
const messages = require('../../../js/constants/messages')
const urlParse = require('../../common/urlParse')

const showAutoplayMessageBox = (location, tabId) => {
  const origin = getOrigin(location)
  const originSettings = siteSettings.getSiteSettingsForURL(AppStore.getState().get('siteSettings'), origin)
  if (originSettings && originSettings.get('noAutoplay') === true) {
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
      let ruleKey = origin
      const parsedUrl = urlParse(location)
      if ((parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:')) {
        ruleKey = `https?://${parsedUrl.host}`
      }
      if (buttonIndex === 0) {
        appActions.changeSiteSetting(ruleKey, 'noAutoplay', false)

        if (tabId) {
          const tab = webContents.fromTabID(tabId)
          if (tab && !tab.isDestroyed()) {
            return tab.reload()
          }
        }
      } else {
        if (persist) {
          appActions.changeSiteSetting(ruleKey, 'noAutoplay', true)
        }
      }
    }
  })
}

const autoplayReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_AUTOPLAY_BLOCKED:
      showAutoplayMessageBox(action.get('location'), action.get('tabId'))
      break
  }
  return state
}

module.exports = autoplayReducer
