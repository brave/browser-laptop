/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appConstants = require('../../../js/constants/appConstants')
const messages = require('../../../js/constants/messages')
const {ipcRenderer} = require('electron')

const debugReducer = (windowState, action) => {
  switch (action.actionType) {
    case appConstants.APP_DEBUG_NO_REPORT_STATE_MODE_CLICKED:
      ipcRenderer.removeAllListeners(messages.REQUEST_WINDOW_STATE)
      console.error('Disabled window state updates')
      break
  }
  return windowState
}

module.exports = debugReducer
