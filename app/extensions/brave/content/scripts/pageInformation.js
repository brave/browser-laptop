/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* jshint asi: true */
/* jshint esversion: 6 */

(function () { try {
  if (window.top !== window.self) return

  // Don't allow ledger to run in incognito
  if (chrome.extension.inIncognitoContext || isTorTab()) {
    return
  }

  var results = { timestamp: new Date().getTime(), protocol: document.location.protocol }

  var node = document.head.querySelector("link[rel='icon']")
  if (!node) node = document.head.querySelector("link[rel='shortcut icon']")
  if (node) results.faviconURL = node.getAttribute('href')

  var location = document.location.href
  // called from ledger.js with variable LEDGER_PUBLISHER_RESPONSE
  chrome.ipcRenderer.once('ledger-publisher-response-' + location, () => {
    if (results.faviconURL) {
      var prefix = (results.faviconURL.indexOf('//') === 0) ? document.location.protocol
                   : (results.faviconURL.indexOf('/') === 0) ? document.location.protocol + '//' + document.location.host
                   : (results.faviconURL.indexOf(':') === -1) ? document.location.protocol + '//' + document.location.host + '/'
                   : null
      if (prefix) results.faviconURL = prefix + results.faviconURL
    }

    const url = window.location.href
    results.url = url
    chrome.ipcRenderer.send('dispatch-action', JSON.stringify([{
      location: url,
      actionType: 'event-set-page-info',
      pageInfo: results
    }]))
  })
  chrome.ipcRenderer.send('ledger-publisher', location)

} catch (ex) { console.log(ex.toString() + '\n' + ex.stack) } })()
