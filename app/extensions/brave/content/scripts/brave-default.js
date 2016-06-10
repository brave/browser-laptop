/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

(function () {
  function sendMessage() {
    port.postMessage({url: window.location.href})
  }

  function onMessage(m) {
    if (m.msg === 'wait') {
      setTimeout(sendMessage, 100)
      return
    }

    if (m.fingerprintingProtection) {
      blockCanvasFingerprinting()
    }
    if (m.block3rdPartyStorage) {
      block3rdPartyStorage()
    }
  }

  var port = chrome.runtime.connect({name: "brave-default"})
  port.onMessage.addListener(onMessage)
  sendMessage()

  /* End block of 3rd party storage */
}).apply(this)
