/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const ipc = require('./ipc')
const messages = require('../constants/messages')

const AboutActions = {
  /**
   * Dispatches an event to the renderer process to change a setting
   *
   * @param {string} key - The settings key to change the value on
   * @param {string} value - The value of the setting to set
   */
  changeSetting: function (key, value) {
    ipc.send(messages.CHANGE_SETTING, key, value)
  },

  newFrame: function (url) {
    ipc.send(messages.SHORTCUT_NEW_FRAME, url)
  }
}
module.exports = AboutActions
