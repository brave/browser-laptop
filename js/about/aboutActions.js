/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const messages = require('../constants/messages')
const serializer = require('../dispatcher/serializer')

function dispatch (action) {
  const event = new window.CustomEvent(messages.DISPATCH_ACTION, {
    detail: serializer.serialize(action)
  })
  window.dispatchEvent(event)
}

const AboutActions = {
  /**
   * Dispatches a window action
   * @param {string} key - The settings key to change the value on
   * @param {string} value - The value of the setting to set
   */
  dispatchAction: function (action) {
    dispatch(action)
  },

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
   * Dispatches an event to the renderer process to change a site setting
   *
   * @param {string} hostPattern - host pattern of site
   * @param {string} key - The settings key to change the value on
   * @param {string} value - The value of the setting to set
   */
  changeSiteSetting: function (hostPattern, key, value) {
    const event = new window.CustomEvent(messages.CHANGE_SITE_SETTING, {
      detail: {
        hostPattern,
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
  newFrame: function (frameOpts, openInForeground = true) {
    const event = new window.CustomEvent(messages.NEW_FRAME, {
      detail: {
        frameOpts,
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
  },

  moveSite: function (sourceDetail, destinationDetail, prepend, destinationIsParent) {
    const event = new window.CustomEvent(messages.MOVE_SITE, {
      detail: {
        sourceDetail,
        destinationDetail,
        prepend,
        destinationIsParent
      }
    })
    window.dispatchEvent(event)
  },

  openDownloadPath: function (download) {
    const event = new window.CustomEvent(messages.OPEN_DOWNLOAD_PATH, {
      detail: {
        download: download.toJS()
      }
    })
    window.dispatchEvent(event)
  },

  decryptPassword: function (encryptedPassword, authTag, iv, id) {
    const event = new window.CustomEvent(messages.DECRYPT_PASSWORD, {
      detail: {
        encryptedPassword,
        authTag,
        iv,
        id
      }
    })
    window.dispatchEvent(event)
  },

  setClipboard: function (text) {
    const event = new window.CustomEvent(messages.SET_CLIPBOARD, {
      detail: text
    })
    window.dispatchEvent(event)
  },

  deletePassword: function (password) {
    const event = new window.CustomEvent(messages.DELETE_PASSWORD, {
      detail: password
    })
    window.dispatchEvent(event)
  },

  deletePasswordSite: function (origin) {
    const event = new window.CustomEvent(messages.DELETE_PASSWORD_SITE, {
      detail: origin
    })
    window.dispatchEvent(event)
  },

  clearPasswords: function () {
    const event = new window.CustomEvent(messages.CLEAR_PASSWORDS)
    window.dispatchEvent(event)
  },

  checkFlashInstalled: function () {
    const event = new window.CustomEvent(messages.CHECK_FLASH_INSTALLED)
    window.dispatchEvent(event)
  },

  showNotification: function (msg) {
    // msg is l10n id of message to show
    const event = new window.CustomEvent(messages.SHOW_NOTIFICATION, {
      detail: msg
    })
    window.dispatchEvent(event)
  },

  setResourceEnabled: function (resourceName, enabled) {
    const event = new window.CustomEvent(messages.SET_RESOURCE_ENABLED, {
      detail: {
        resourceName,
        enabled
      }
    })
    window.dispatchEvent(event)
  }
}
module.exports = AboutActions
