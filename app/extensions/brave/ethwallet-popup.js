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

const onBack = () => {
   document.getElementById('create').classList.remove('visible')
   document.getElementById('create').classList.add('hidden')
   document.getElementById('appContainer').classList.remove('hidden')
   document.getElementById('appContainer').classList.add('visible')
}

document.getElementById('createEthWallet').onclick = () => {
  var pwd = document.getElementById('pwd').value
  ipc.send('create-wallet', pwd)
  onBack()
}

document.getElementById('createWallet').onclick = () => {
   document.getElementById('create').classList.add('visible')
   document.getElementById('create').classList.remove('hidden')
   document.getElementById('appContainer').classList.add('hidden')
   document.getElementById('appContainer').classList.remove('visible')
}

document.getElementById('back').onclick = onBack

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
