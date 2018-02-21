/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

function ensurePaintWebviewFirstAttach (webview) {
  window.requestAnimationFrame(() => {
    webview.style.display = 'none'
    window.requestAnimationFrame(() => {
      webview.style.display = ''
    })
  })
}

function ensurePaintWebviewSubsequentAttach (webview) {
  window.requestAnimationFrame(() => {
    webview.style.top = '1px'
    window.requestAnimationFrame(() => {
      webview.style.top = ''
    })
  })
}

module.exports = class SingleWebviewDisplay {
  constructor ({containerElement, classNameWebview}) {
    this.isAttached = false
    this.webview = this.createWebview()
    this.webview.classList.add(classNameWebview)
    containerElement.appendChild(this.webview)
  }

  attachActiveTab (guestInstanceId) {
    console.log('webviewDisplay: attaching guest id', guestInstanceId)
    this.webview.attachGuest(guestInstanceId)
    this.isAttached = true
    // TODO(petemill) remove ugly workaround as <webview> will often not paint guest unless
    // size has changed or forced to.
    if (!this.isSubsequent) {
      this.isSubsequent = true
      ensurePaintWebviewFirstAttach(this.webview)
    } else {
      ensurePaintWebviewSubsequentAttach(this.webview)
    }
  }

  createWebview () {
    console.log('creating a webview')
    const webview = document.createElement('webview')
    return webview
  }
}
