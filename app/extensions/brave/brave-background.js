window.appState = null
window.appConfig = null
window._empty_ = Immutable.Map()

chrome.ipc.on('update-state', (evt, newState, newConfig) => {
  window.appState = Immutable.fromJS(newState)
  window.appConfig = newConfig
})

chrome.runtime.onConnect.addListener((port) => {
  sendMessage = () => {
    let tabSettings = getSiteSettings(window.appState, port.sender.tab.incognito)
    let locationSettings = getSiteSettingsForURL(tabSettings, port.sender.tab.url) || _empty_

    port.postMessage(activeSettings(locationSettings, window.appState, window.appConfig))
  }

  port.onMessage.addListener((msg) => {
    if (!port.sender || !port.sender.tab || port.sender.id !== chrome.runtime.id)
      return

    if (msg.type === 'action') {
      chrome.ipc.send('dispatch-action', JSON.stringify(msg.action))
    }

    // have not received state yet
    if (!window.appState || !window.appConfig) {
      port.postMessage({msg: 'wait'})
      return
    }

    sendMessage()
  })
})
