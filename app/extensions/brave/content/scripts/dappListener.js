/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const script =
  `
  function __insertWeb3Installed() {
    if (!window.alreadyInserted) {
      const meta = document.createElement('meta')
      meta.name = 'web3-installed'
      document.head.appendChild(meta)
      window.alreadyInserted = true
    }
  }
  if (window.web3) {
    if (!window.web3.currentProvider || !window.web3.currentProvider.isMetaMask) {
      __insertWeb3Installed()
    }
  } else {
    var oldWeb3 = window.web3
    Object.defineProperty(window, 'web3', {
      configurable: true,
      set: function (val) {
        __insertWeb3Installed()
        oldWeb3 = val
      },
      get: function () {
        __insertWeb3Installed()
        return oldWeb3
      }
    })
  }`

if (chrome.contentSettings.dappDetection == 'allow') {
  executeScript(script)
}

setTimeout(function () {
  console.log('checking now for toolbar')
  const isDapp = document.querySelector('meta[name="web3-installed"]')

  if (isDapp) {
    chrome.ipcRenderer.send('dispatch-action', JSON.stringify([{
      actionType: 'app-dapp-available',
      location: window.location.href
    }]))
  }
}, 3000)
