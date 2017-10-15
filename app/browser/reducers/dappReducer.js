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

const dappReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_DAPP_AVAILABLE:
      if (!getSetting(settings.METAMASK_PROMPT_DISMISSED) && !getSetting(settings.METAMASK_ENABLED)) {
        showDappNotification()
      }
      break
  }
  return state
}

const notifications = {
  text: {
    greeting: locale.translation('updateHello'),
    message: locale.translation('dappDetected'),
    enable: locale.translation('dappEnableExtension'),
    dismiss: locale.translation('dappDismiss')
  },
  onResponse: (message, buttonIndex) => {
    // Index 0 is for dismiss
    if (buttonIndex === 0) {
      appActions.changeSetting(settings.METAMASK_PROMPT_DISMISSED, true)
    }
    // Index 1 is for enable
    if (buttonIndex === 1) {
      appActions.changeSetting(settings.METAMASK_ENABLED, true)
    }
    appActions.hideNotification(message)
  }
}

process.on('extension-ready', (installInfo) => {
  if (installInfo.id === config.metamaskExtensionId) {
    tabActions.reload(tabState.TAB_ID_ACTIVE, true)
  }
})

const showDappNotification = () => {
  appActions.showNotification({
    greeting: notifications.text.greeting,
    message: notifications.text.message,
    buttons: [
      {text: notifications.text.dismiss},
      {text: notifications.text.enable}
    ],
    options: {
      persist: false
    }
  })
}

if (ipcMain) {
  ipcMain.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex) => {
    switch (message) {
      case notifications.text.message:
        notifications.onResponse(message, buttonIndex)
        break
    }
  })
}

module.exports = dappReducer
