'use strict'

const path = require('path')
const {removeSync, ensureDirSync, copySync} = require('fs-extra')

const targetDirectory = path.resolve('app/extensions/ethwallet')

removeSync(targetDirectory)
ensureDirSync(targetDirectory)
require('meteor-dapp-wallet-prebuilt').init(targetDirectory)
copySync(path.resolve('img/ethereum/'), targetDirectory)
