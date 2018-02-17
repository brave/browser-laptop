const ipc = window.chrome.ipcRenderer

const doAction = (message, args) => {
  args.actionType = message
  ipc.send('dispatch-action', JSON.stringify([args]))
}

document.getElementById('openEthwallet').onclick = () => {
  doAction('app-create-tab-requested', {
    createProperties: {
      url: window.location.origin + '/index.html'
    }
  })
}
