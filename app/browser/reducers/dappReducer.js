/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const {makeImmutable} = require('../../common/state/immutableUtil')
const locale = require('../../locale')
const appActions = require('../../../js/actions/appActions')
const {ipcMain} = require('electron')
const messages = require('../../../js/constants/messages')
const settings = require('../../../js/constants/settings')
const getSetting = require('../../../js/settings').getSetting
const tabActions = require('../../common/actions/tabActions')
const tabState = require('../../common/state/tabState')
const config = require('../../../js/constants/config')
const {getOrigin} = require('../../../js/state/siteUtil')

let notificationCallbacks = []

const dappReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_DAPP_AVAILABLE:
      if (!getSetting(settings.METAMASK_ENABLED)) {
        showDappNotification(action.get('location'))
      }
      break
  }
  return state
}

const notifications = {
  text: {
    greeting: locale.translation('updateHello'),
    enable: locale.translation('dappEnableExtension'),
    dismiss: locale.translation('dappDismiss')
  }
}

process.on('extension-ready', (installInfo) => {
  if (installInfo.id === config.metamaskExtensionId) {
    tabActions.reload(tabState.TAB_ID_ACTIVE, true)
  }
})

const showDappNotification = (location) => {
  const origin = getOrigin(location)
  if (!origin || getSetting(settings.METAMASK_PROMPT_DISMISSED)) {
    return
  }

  const message = locale.translation('dappDetected').replace(/{{\s*origin\s*}}/, origin)

  appActions.showNotification({
    greeting: notifications.text.greeting,
    message: message,
    buttons: [
      {text: notifications.text.dismiss},
      {text: notifications.text.enable}
    ],
    frameOrigin: origin,
    options: {
      persist: true
    }
  })

  if (!notificationCallbacks[message]) {
    notificationCallbacks[message] = (e, msg, buttonIndex, persist) => {
      if (msg === message) {
        appActions.hideNotification(message)
        // Index 0 is for dismiss
        if (buttonIndex === 0) {
          if (persist) {
            appActions.changeSetting(settings.METAMASK_PROMPT_DISMISSED, true)
          }
        }

        // Index 1 is for enable
        if (buttonIndex === 1) {
          appActions.changeSetting(settings.METAMASK_ENABLED, true)
        }

        if (notificationCallbacks[message]) {
          ipcMain.removeListener(messages.NOTIFICATION_RESPONSE, notificationCallbacks[message])
          delete notificationCallbacks[message]
        }
      }
    }
  }

  ipcMain.on(messages.NOTIFICATION_RESPONSE, notificationCallbacks[message])
}

module.exports = dappReducer
