/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var port = (function () {
  function sendHello() {
    port.postMessage({url: window.location.href})
  }

  function onMessage(m) {
    if (m.msg === 'wait') {
      setTimeout(sendHello, 100)
      return
    }

    if (m.adInsertion && m.adInsertion.enabled) {
      adInsertion(m.adInsertion.url)
    }
    if (m.passwordManager) {
      autofillPasswordListenerInit()
    }
  }

  var port = chrome.runtime.connect({name: "brave-default"})
  port.onMessage.addListener(onMessage)
  sendHello()

  return port

}).apply(this)

function sendMessage (msg) {
  port.postMessage(msg)
}
