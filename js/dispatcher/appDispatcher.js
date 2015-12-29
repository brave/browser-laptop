/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const messages = require('../constants/messages')
const Serializer = require('../dispatcher/serializer')

class AppDispatcher {
  /**
   * dispatch
   * @param  {object} action The action to dispatch
   */
  dispatch (action) {
    if (process.type === 'renderer') {
      global.require('electron').ipcRenderer.send(messages.APP_ACTION, Serializer.serialize(action))
    } else {
      process.emit(messages.APP_ACTION, action)
    }
  }
}

const appDispatcher = new AppDispatcher()
module.exports = appDispatcher
