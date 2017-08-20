/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const windowState = require('../common/state/windowState')
let currentWindowId = -1
let currentWindow = null

const isMaximized = (state) => {
  const win = windowState.getByWindowId(state, currentWindowId)
  return (win && win.get('state') === 'maximized') || false
}

const isFullScreen = (state) => {
  const win = windowState.getByWindowId(state, currentWindowId)
  return (win && win.get('state') === 'fullscreen') || false
}

const isFocused = (state) => {
  const win = windowState.getByWindowId(state, currentWindowId)
  return (win && win.get('focused')) || false
}

module.exports = {
  getCurrentWindowId: () => {
    return currentWindowId
  },
  setWindowId: (windowId) => {
    currentWindowId = windowId
  },
  // lazy load this
  getCurrentWindow: () => {
    return currentWindow || (currentWindow = require('electron').remote.getCurrentWindow())
  },
  isMaximized,
  isFocused,
  isFullScreen
}
