/* This SourceCode Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const {makeImmutable} = require('../../common/state/immutableUtil')
const {simpleShareActiveTab} = require('../share')
const BrowserWindow = require('electron').BrowserWindow

const shareReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SIMPLE_SHARE_ACTIVE_TAB_REQUESTED:
      let windowId = action.get('senderWindowId')
      if (windowId == null) {
        if (BrowserWindow.getActiveWindow()) {
          windowId = BrowserWindow.getActiveWindow().id
        }
      }

      state = simpleShareActiveTab(state, windowId, action.get('shareType'))
      break
  }
  return state
}

module.exports = shareReducer
