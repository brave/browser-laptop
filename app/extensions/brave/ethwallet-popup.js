'use strict'

const ipc = window.chrome.ipcRenderer
let batAddress = null
const indexUrl = `${window.location.origin}/index.html`

ipc.send('get-popup-bat-balance')
ipc.on('popup-bat-balance', (e, amount, walletAddress) => {
  /*
  if (amount) {
    document.getElementById('batBalance').innerText = `Brave Wallet Balance: ${amount} BAT`
  }
  */
  batAddress = walletAddress
})

const doAction = (message, args) => {
  args.actionType = message
  ipc.send('dispatch-action', JSON.stringify([args]))
}

document.getElementById('createEthWallet').onclick = () => {
  var pwd = document.getElementById("pwd").value;
  ipc.send('create-wallet', JSON.stringify([pwd]));
}

document.getElementById('openEthwallet').onclick = () => {
  doAction('app-create-tab-requested', {
    createProperties: {
      url: indexUrl
    }
  })
}

document.getElementById('transferFunds').onclick = () => {
  const sendUrl = `${window.location.origin}/#!send/${batAddress || ''}`
  doAction('app-create-tab-requested', {
    createProperties: {
      url: indexUrl
    }
  })
  // Meteor can't load sendUrl until indexUrl has already been loaded :(
  ipc.once('ethwallet-index-loaded', () => {
    doAction('app-load-url-in-active-tab-requested', {
      url: sendUrl
    })
  })
}
