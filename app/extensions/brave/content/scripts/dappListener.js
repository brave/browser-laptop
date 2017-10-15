/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const script =
  `if (window.web3) {
    if (!window.web3.currentProvider || !window.web3.currentProvider.isMetaMask) {
      const meta = document.createElement('meta')
      meta.name = 'web3-installed'
      document.head.appendChild(meta)
    }
  } else {
    var oldWeb3 = window.web3
    Object.defineProperty(window, 'web3', {
      set: function (val) {
        oldWeb3 = val
      },
      get: function () {
        if (window.alreadyInserted) {
          return oldWeb3
        }
        window.alreadyInserted = true
        const meta = document.createElement('meta')
        meta.name = 'web3-installed'
        document.head.appendChild(meta)
        return oldWeb3
      }
    })
  }`

executeScript(script)
setTimeout(function () {
  const isDapp = document.querySelector('meta[name="web3-installed"]')

  if (isDapp) {
    chrome.ipcRenderer.send('dispatch-action', JSON.stringify([{
      actionType: 'app-dapp-available',
      location: window.location.href
    }]))
  }
}, 1000)