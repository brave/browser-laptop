/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

(function () {
  var ipcRenderer = process.binding.v8_util.getHiddenValue(this, 'ipc')
  ipcRenderer.on('settings-updated', (e, settings) => {
    const event = new window.CustomEvent('settings-updated', {
      detail: settings
    })
    window.dispatchEvent(event)
  })
  ipcRenderer.on('bookmarks-updated', (e, bookmarks) => {
    const event = new window.CustomEvent('bookmarks-updated', {
      detail: bookmarks
    })
    window.dispatchEvent(event)
  })
  ipcRenderer.on('cert-details-updated', (e, details) => {
    const event = new window.CustomEvent('cert-details-updated', {
      detail: details
    })
    window.dispatchEvent(event)
  })

  window.addEventListener('change-setting', (e) => {
    ipcRenderer.send('change-setting', e.detail.key, e.detail.value)
  })
  window.addEventListener('cert-error-accepted', (e) => {
    ipcRenderer.send('cert-error-accepted', e.detail.url)
  })
  window.addEventListener('new-frame', (e) => {
    ipcRenderer.sendToHost('new-frame', e.detail.location, e.detail.openInForeground)
  })
  window.addEventListener('context-menu-opened', (e) => {
    ipcRenderer.sendToHost('context-menu-opened', e.detail.nodeProps, e.detail.contextMenuType)
  })
}).apply(this)
