chrome.idle.setDetectionInterval(15*60)
chrome.idle.onStateChanged.addListener((idleState) => {
  chrome.ipc.send('dispatch-action', JSON.stringify({
    actionType: 'app-idle-state-changed',
    idleState
  }))
})
