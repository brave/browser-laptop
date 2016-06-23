/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

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
   * Repalces the selected text in an editable
   * @param {string} text - The text to replace with
   */
  replace: function (text) {
    const webview = getWebview()
    if (webview) {
      webview.replaceMisspelling(text)
    }
  }
}

module.exports = webviewActions
