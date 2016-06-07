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

    if (m.adInsertion && m.adInsertion.enabled) {
      adInsertion(m.adInsertion.url)
    }
    if (m.passwordManager) {
      autofillPasswordListenerInit()
    }
    if (m.locale) {
      initSpellCheck(m.locale)
    }
  }

  var port = chrome.runtime.connect({name: "brave-default"})
  port.onMessage.addListener(onMessage)
  sendMessage()

}).apply(this)
