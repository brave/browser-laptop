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
   * Loads a URL in a new frame in a safe way.
   * It is important that it is not a simple anchor because it should not
   * preserve the about preload script. See #672
   */
  newFrame: function (location, openInForeground = true) {
    const event = new window.CustomEvent(messages.NEW_FRAME, {
      detail: {
        location,
        openInForeground
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
    const event = new window.CustomEvent(messages.CERT_ERROR_ACCEPTED, {
      detail: {
        url
      }
    })
    window.dispatchEvent(event)
  },

  /**
   * Opens a context menu
   */
  contextMenu: function (nodeProps, contextMenuType, e) {
    e.preventDefault()
    e.stopPropagation()
    const event = new window.CustomEvent(messages.CONTEXT_MENU_OPENED, {
      detail: {
        nodeProps,
        contextMenuType
      }
    })
    window.dispatchEvent(event)
  }
}
module.exports = AboutActions
