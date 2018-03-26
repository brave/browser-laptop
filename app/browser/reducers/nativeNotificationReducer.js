/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// Constants
const appConstants = require('../../../js/constants/appConstants')

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
  }

  return state
}

module.exports = nativeNotifications
