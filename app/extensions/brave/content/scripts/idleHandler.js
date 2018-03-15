chrome.idle.setDetectionInterval(30)
chrome.idle.onStateChanged.addListener((idleState) => {
  // Uses appConstants.APP_IDLE_STATE_CHANGED action constant.
  chrome.ipcRenderer.send('dispatch-action', JSON.stringify([{
    actionType: 'app-idle-state-changed',
    idleState
  }]))
})
