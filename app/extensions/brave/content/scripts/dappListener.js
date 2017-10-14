/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// If Flash is enabled but not runnable, show a permission notification for small
// Flash elements
/*
if (chrome.contentSettings.flashEnabled == 'allow' && chrome.contentSettings.flashAllowed != 'allow') {
  const maxFlashAttempts = 3
  let flashAttempts = 0
  const intervalId = window.setInterval(() => {
    if (flashAttempts >= maxFlashAttempts) {
      window.clearInterval(intervalId)
      return
    }
    flashAttempts = flashAttempts + 1
    if (hasHiddenFlashElement(document.documentElement)) {
      chrome.ipcRenderer.send('dispatch-action', JSON.stringify([{
        actionType: 'app-flash-permission-requested',
        location: window.location.href
      }]))
      window.clearInterval(intervalId)
    }
  }, 1000)
}
*/

const script =
  `if (window.web3) {
    if (!window.web3.currentProvider || !window.web3.currentProvider.isMetaMask) {
      const meta = document.createElement('meta')
      meta.name = 'web3-installed'
      document.head.appendChild(meta)
    }
  }`

executeScript(script)
const isDapp = document.querySelector('meta[name="web3-installed"]')

if (isDapp) {
  chrome.ipcRenderer.send('dispatch-action', JSON.stringify([{
    actionType: 'app-dapp-available',
    location: window.location.href
  }]))
}
