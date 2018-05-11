/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = class SingleWebviewDisplay {
  constructor ({containerElement, classNameWebview}) {
    this.isAttached = false
    this.webview = this.createWebview()
    this.webview.classList.add(classNameWebview)
    containerElement.appendChild(this.webview)
  }

  attachActiveTab (tabId) {
    console.log('webviewDisplay: attaching tab id', tabId)
    require('electron').remote.getWebContents(tabId, (webContents) => {
      if (!webContents || webContents.isDestroyed()) {
        return
      }
      this.webview.attachGuest(webContents.guestInstanceId, webContents)
    })
    this.isAttached = true
  }

  createWebview () {
    console.log('creating a webview')
    const webview = document.createElement('webview')
    return webview
  }

  focusActiveWebview () {

  }

  getActiveWebview () {
    return this.webview
  }
}
