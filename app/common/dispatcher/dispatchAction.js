module.exports = function (name, action) {
  action = Object.assign({
    actionType: name
  }, action)

  if (typeof chrome !== 'undefined' && typeof chrome.ipcRenderer === 'function') {
    chrome.ipcRenderer.send('dispatch-action', JSON.stringify(action))
  } else if (typeof process !== 'undefined') {
    if (process.type === 'browser' && typeof process.emit === 'function') {
      process.emit('dispatch-action', action)
    } else if (process.type === 'worker' && typeof postMessage === 'function') {
      postMessage({message: 'dispatch-action', action})
    }
  } else {
    throw new Error('Unsupported environment for dispatch')
  }
}
