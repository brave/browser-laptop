/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const messages = require('../constants/messages')

class AppDispatcher {
  /**
   * dispatch
   * @param  {object} payload The data from the action.
   */
  dispatch (payload) {
    if (process.type === 'renderer') {
      global.require('electron').ipcRenderer.send(messages.APP_ACTION, payload)
    } else {
      process.emit(messages.APP_ACTION, payload)
    }
  }
}

const appDispatcher = new AppDispatcher()
module.exports = appDispatcher
