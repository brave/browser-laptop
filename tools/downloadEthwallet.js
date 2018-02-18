'use strict'

const path = require('path')
const {removeSync, ensureDirSync, copySync} = require('fs-extra')

const targetDirectory = path.resolve('app/extensions/ethwallet')

removeSync(targetDirectory)
ensureDirSync(targetDirectory)
require('meteor-dapp-wallet-prebuilt').init(targetDirectory)
copySync(path.resolve('img/ethereum/'), targetDirectory)
copySync(path.resolve('app/extensions/brave/ethwallet-popup.html'), path.join(targetDirectory, 'ethwallet-popup.html'))
copySync(path.resolve('app/extensions/brave/ethwallet-popup.js'), path.join(targetDirectory, 'ethwallet-popup.js'))
copySync(path.resolve('app/extensions/brave/ethwallet-main.js'), path.join(targetDirectory, 'ethwallet-main.js'))
