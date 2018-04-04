/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

let webviewDisplay
const getWebview = () => webviewDisplay && webviewDisplay.getActiveWebview()

const webviewActions = {

  init: function (mainWindowWebviewDisplay) {
    webviewDisplay = mainWindowWebviewDisplay
  },

  /**
   * Puts the webview in focus
   */
  setWebviewFocused: function () {
    webviewDisplay && webviewDisplay.focusActiveWebview()
  },

  /**
   * Shows the certificate infomation
   */
  showCertificate: function () {
    const webview = getWebview()
    if (webview) {
      webview.showCertificate()
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
  }
}

module.exports = webviewActions
