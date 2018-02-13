/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const notificationTypes = require('../../common/constants/notificationTypes')

// Utils
const {makeImmutable} = require('../../common/state/immutableUtil')
const tabs = require('../tabs')

const flashReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_ON_NATIVE_NOTIFICATION_CLICK:
      {
        const data = action.get('data')
        switch (data.get('notificationId')) {
          case notificationTypes.ADS:
            {
              // TODO what we want to open, for now we just open ad url
              tabs.maybeCreateTab(state, Immutable.fromJS({
                url: data.get('notificationUrl'),
                windowId: action.get('senderWindowId')
              }))
              break
            }
        }
        break
      }
  }
  return state
}

module.exports = flashReducer
