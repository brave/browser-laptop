/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const braveNotifier = require('brave-node-notifier')

// Actions
const appActions = require('../../../js/actions/appActions')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const settings = require('../../../js/constants/settings')

// State
const userModelState = require('../../common/state/userModelState')

// Utils
const {makeImmutable} = require('../../common/state/immutableUtil')
const notificationUtil = require('../../renderer/lib/notificationUtil')

const nativeNotifications = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_NATIVE_NOTIFICATION_CREATE:
      {
        notificationUtil.createNotification(action.get('options'))
        break
      }
    case appConstants.APP_ON_NATIVE_NOTIFICATION_CONFIG:
      {
        const ok = !!action.get('ok')

        if (!ok) {
          appActions.changeSetting(settings.ADS_ENABLED, false)
        }

        state = userModelState.setUserModelValue(state, 'config', ok)
        break
      }
    case appConstants.APP_ON_NATIVE_NOTIFICATION_CHECK:
      {
        braveNotifier.configured((err, result) => {
          if (err) {
            appActions.onUserModelLog('Configured error', {err, result})
            result = false
          }

          appActions.onNativeNotificationConfig(result)
        })
      }
  }

  return state
}

module.exports = nativeNotifications
