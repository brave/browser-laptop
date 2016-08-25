/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const messages = require('../constants/messages.js')

const getWebview = () =>
  document.querySelector('.frameWrapper.isActive webview')

const webviewActions = {
  /**
   * Puts the webview in focus
   */
  setWebviewFocused: function () {
    const webview = getWebview()
    if (webview) {
      webview.focus()
    }
  },

  /**
   * Inspect the element for the active webview at the x, y content position
   * @param {number} x - horizontal position of the element to inspect
   * @param {number} y - vertical position of the element to inspect
   */
  inspectElement: function (x, y) {
    const webview = getWebview()
    if (webview) {
      webview.inspectElement(x, y)
    }
  },

  /**
   * Replaces the selected text in an editable
   * @param {string} text - The text to replace with
   */
  replace: function (text) {
    const webview = getWebview()
    if (webview) {
      webview.replaceMisspelling(text)
    }
  },

  /**
   * Shows the definition of the selected text in a pop-up window (macOS only)
   */
  showDefinitionForSelection: function () {
    const webview = getWebview()
    if (webview) {
      webview.showDefinitionForSelection()
    }
  },

  /**
   * Check two-finger gesture swipe back/forward ability
   * @param {bool} back - true for back, false for forward
   */
  checkSwipe: function (back) {
    const webview = getWebview()
    if (webview) {
      if (back) {
        webview.send(messages.CHECK_SWIPE_BACK)
      } else {
        webview.send(messages.CHECK_SWIPE_FORWARD)
      }
    }
  },

  /**
   * Set/unset webkit fullscreen status
   * @param {Boolean} isFullScreen - fullscreen state to go to
   */
  setFullScreen: function (isFullScreen) {
    const webview = getWebview()
    if (webview) {
      if (!isFullScreen) {
        webview.executeJavaScript('document.webkitExitFullscreen()')
      } else {
        webview.executeJavaScript('document.webkitRequestFullscreen()')
      }
    }
  },

  findInPage: function (searchString, caseSensitivity, forward, webview) {
    webview = webview || getWebview()
    if (!webview) {
      return
    }

    if (searchString) {
      webview.findInPage(searchString, {
        matchCase: caseSensitivity,
        forward: forward !== undefined ? forward : true,
        findNext: forward !== undefined
      })
    } else {
      webview.stopFindInPage('clearSelection')
    }
  },

  stopFindInPage: function (webview) {
    webview = webview || getWebview()
    if (!webview) {
      return
    }
    webview.stopFindInPage('keepSelection')
  }
}

module.exports = webviewActions
