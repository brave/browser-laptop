'use strict'

const Manager = require('ethereum-client-binaries').Manager
const fs = require('fs')
const path = require('path')

const clientBinaries = fs.readFileSync('gethBinaries.json')
const config = JSON.parse(clientBinaries)
const mgr = new Manager(config)

const GETH_BIN_PATH = path.join('app', 'bin')

mgr.init({ folders: [ GETH_BIN_PATH ] })
.then(() => {
  if (!mgr.clients.Geth.state.available) {
    console.log('Geth is missing or out of date, starting download...')
    mgr.download('Geth')
    .then((result) => {
      console.log('Done')
      const fullPath = result.client.activeCli.fullPath
      if (fullPath) {
        if (!fs.existsSync(GETH_BIN_PATH)) {
          fs.mkdirSync(GETH_BIN_PATH)
        }
        const outPath = path.join(GETH_BIN_PATH, result.client.activeCli.bin)
        if (fs.existsSync(outPath)) {
          fs.unlinkSync(outPath)
        }
        var is = fs.createReadStream(fullPath)
        var os = fs.createWriteStream(outPath)
        is.pipe(os)
        is.on('end', () => {
          fs.unlinkSync(fullPath)
          fs.chmodSync(outPath, '755')
        })
      }
    })
  } else {
    console.log('Geth is up to date')
  }
})
