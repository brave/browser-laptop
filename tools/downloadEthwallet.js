'use strict'

const fs = require('fs')
const path = require('path')
const {removeSync, ensureDirSync, copySync} = require('fs-extra')

const targetDirectory = path.resolve('app/extensions/ethwallet')

removeSync(targetDirectory)
ensureDirSync(targetDirectory)
require('meteor-dapp-wallet-prebuilt').init(targetDirectory)
copySync(path.resolve('img/ethereum/'), targetDirectory)

const Manager = require('ethereum-client-binaries').Manager
const clientBinaries = fs.readFileSync('gethBinaries.json')
const config = JSON.parse(clientBinaries)
const mgr = new Manager(config)
mgr.init()
.then(() => {
  mgr.download('Geth', {
    downloadFolder: './app/'
  })
})
