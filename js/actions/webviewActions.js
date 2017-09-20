/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const getWebview = (key) =>
  key
  ? document.querySelector(`webview[data-frame-key="${key}"]`)
  : document.querySelector('.frameWrapper.isActive webview')

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
  },

  findInPage: function (searchString, caseSensitivity, forward, findNext, webview) {
    webview = webview || getWebview()
    if (!webview) {
      return
    }

    if (searchString) {
      webview.findInPage(searchString, {
        matchCase: caseSensitivity,
        forward,
        findNext
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
