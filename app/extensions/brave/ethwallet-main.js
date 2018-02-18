'use strict'

const ipc = window.chrome.ipcRenderer

window.addEventListener('load', () => {
  ipc.send('ethwallet-index-loaded')
})
