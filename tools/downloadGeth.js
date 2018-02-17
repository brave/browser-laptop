'use strict'

const fs = require('fs')

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
