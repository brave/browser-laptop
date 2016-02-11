/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const messages = require('../constants/messages')

const AboutActions = {
  /**
   * Dispatches an event to the renderer process to change a setting
   *
   * @param {string} key - The settings key to change the value on
   * @param {string} value - The value of the setting to set
   */
  changeSetting: function (key, value) {
    const event = new window.CustomEvent(messages.CHANGE_SETTING, {
      detail: {
        key,
        value
      }
    })
    window.dispatchEvent(event)
  },

  /**
   * Click through a certificate error.
   *
   * @param {string} url - The URL with the cert error
   */
  acceptCertError: function (url) {
    // TODO
  }
}
module.exports = AboutActions
