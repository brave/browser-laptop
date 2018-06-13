/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const notifier = require('brave-ads-notifier')

// Actions
const appActions = require('../../../js/actions/appActions')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const settings = require('../../../js/constants/settings')

// State
const windows = require('../windows')
const userModelState = require('../../common/state/userModelState')
const Immutable = require('immutable')

// Utils
const {makeImmutable} = require('../../common/state/immutableUtil')
const notificationUtil = require('../../renderer/lib/notificationUtil')
const userModel = require('../api/userModel')

const nativeNotifications = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_NATIVE_NOTIFICATION_CREATE:
      {
        notificationUtil.createNotification(action.get('options'))
        break
      }
    case appConstants.APP_ON_NATIVE_NOTIFICATION_CONFIGURATION_CHECK:
      {
        notifier.configured((err, result) => {
          appActions.onUserModelLog(appConstants.APP_ON_NATIVE_NOTIFICATION_CONFIGURATION_CHECK, {err, result})

          appActions.onNativeNotificationConfigurationReport((!err) && (result))
        })
        break
      }
    case appConstants.APP_ON_NATIVE_NOTIFICATION_CONFIGURATION_REPORT:
      {
        const ok = !!action.get('ok')
        const previous = userModelState.getUserModelValue(state, 'allowed')

        if (ok !== previous) state = userModelState.setUserModelValue(state, 'configured', ok)

        if (!ok) appActions.changeSetting(settings.ADS_ENABLED, false)
        break
      }
    case appConstants.APP_ON_NATIVE_NOTIFICATION_ALLOWED_CHECK:
      {
        notifier.enabled((err, result) => {
          appActions.onUserModelLog(appConstants.APP_ON_NATIVE_NOTIFICATION_ALLOWED_CHECK, {err, result})

          appActions.onNativeNotificationAllowedReport((!err) && (result), !!action.get('serveP'))
        })
        break
      }
    case appConstants.APP_ON_NATIVE_NOTIFICATION_ALLOWED_REPORT:
      {
        const ok = !!action.get('ok')
        const previous = userModelState.getUserModelValue(state, 'allowed')
        const serveP = !!action.get('serveP')

        if (ok !== previous) state = userModelState.setUserModelValue(state, 'allowed', ok)
        if ((!serveP) || (ok !== previous)) {
          const action = Immutable.fromJS({
            actionType: appConstants.APP_CHANGE_SETTING,
            key: settings.ADS_ENABLED,
            value: ok
          })

          state = userModel.generateAdReportingEvent(state, 'settings', action)
        }
        if (!serveP) break

        if (ok) {
          state = userModel.checkReadyAdServe(state, windows.getActiveWindowId())
        } else {
          appActions.onUserModelLog('Ad not served', { reason: 'notifications not presently allowed' })
        }
        break
      }
  }

  return state
}

module.exports = nativeNotifications
