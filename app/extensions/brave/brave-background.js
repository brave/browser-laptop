chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    if (!port.sender || !port.sender.tab || port.sender.id !== chrome.runtime.id)
      return

    if (msg.type === 'action') {
      chrome.ipc.send('dispatch-action', JSON.stringify(msg.action))
    }
  })
})
