const appStoreRenderer = require('../../js/stores/appStoreRenderer')
const windowState = require('../common/state/windowState')

let currentWindowId = -1
let currentWindow = null

const isMaximized = () => {
  const win = windowState.getByWindowId(appStoreRenderer.state, currentWindowId)
  return win && win.get('state') === 'maximized'
}

const isFullScreen = () => {
  const win = windowState.getByWindowId(appStoreRenderer.state, currentWindowId)
  return win && win.get('state') === 'fullscreen'
}

const isFocused = () => {
  const win = windowState.getByWindowId(appStoreRenderer.state, currentWindowId)
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
