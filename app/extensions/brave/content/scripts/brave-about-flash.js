/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

(function () {
  if (window.location && window.location.origin === 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd') {
    var ipcRenderer = chrome.ipc
    window.addEventListener('new-frame', (e) => {
      ipcRenderer.sendToHost('new-frame', e.detail.frameOpts, e.detail.openInForeground)
    })
  }
}).apply(this)
