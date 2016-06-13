var appState = null
var appConfig = null
var _empty_ = Immutable.Map()

chrome.ipc.on('update-state', (evt, newState, newConfig) => {
  appState = Immutable.fromJS(newState)
  appConfig = newConfig
})

chrome.runtime.onConnect.addListener((port) => {
  sendMessage = () => {
    let tabSettings = getSiteSettings(appState, port.sender.tab.incognito)
    let locationSettings = getSiteSettingsForURL(tabSettings, port.sender.tab.url) || _empty_

    port.postMessage(activeSettings(locationSettings, appState, appConfig))
  }

  port.onMessage.addListener((msg) => {
    if (!port.sender || !port.sender.tab)
      return

    if (msg.type === 'action') {
      chrome.ipc.send('dispatch-action', JSON.stringify(msg.action))
    }

    // have not received state yet
    if (!appState || !appConfig) {
      port.postMessage({msg: 'wait'})
      return
    }

    sendMessage()
  })
})

