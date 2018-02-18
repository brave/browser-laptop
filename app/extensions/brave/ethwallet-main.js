'use strict'

const ipc = window.chrome.ipcRenderer

window.addEventListener('load', () => {
  document.body.style.zoom = '120%'
  ipc.send('ethwallet-index-loaded')
})

Meteor.startup(function() {
    Tracker.autorun(function(){
        // If on ropsten, add the testnet BAT token, only once.
        if (!localStorage['dapp_hasBAT'] && Session.get('network') === 'ropsten'){
            localStorage.setItem('dapp_hasBAT', true)

            // wait 5s, to allow the tokens to be loaded from the localstorage first
            Meteor.setTimeout(function(){
                const batToken = '0x60b10c134088ebd63f80766874e2cade05fc987b'
                const tokenId = Helpers.makeId('token', batToken)
                Tokens.upsert(tokenId, {$set: {
                    address: batToken,
                    name: 'BAT Ropsten',
                    symbol: 'BATr',
                    balances: {},
                    decimals: 18
                }})
            }, 5000)

        // If on main net, add the BAT token, only once.
        } else if (!localStorage['dapp_hasBAT'] && Session.get('network') === 'main'){
            localStorage.setItem('dapp_hasBAT', true)

            // wait 5s, to allow the tokens to be loaded from the localstorage first
            Meteor.setTimeout(function(){
                const batToken = '0x0D8775F648430679A709E98d2b0Cb6250d2887EF'
                const tokenId = Helpers.makeId('token', batToken)
                Tokens.upsert(tokenId, {$set: {
                    address: batToken,
                    name: 'Basic Attention Token',
                    symbol: 'BAT',
                    balances: {},
                    decimals: 18
                }})
            }, 5000)
        }
    })
})


var sheet = document.styleSheets[0]
sheet.insertRule('body { filter: invert(100%) }', 1)
