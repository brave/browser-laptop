const ipc = window.chrome.ipcRenderer

ipc.send('get-popup-bat-balance')
ipc.on('popup-bat-balance', (e, amount) => {
  if (amount) {
    document.getElementById('batBalance').innerText = `Brave Wallet Balance: ${amount} BAT`
  }
})

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
