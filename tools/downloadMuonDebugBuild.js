'use strict'

const path = require('path')
const fs = require('fs')
const request = require('request')
const execute = require('./lib/execute')

const muonFolder = path.join(__dirname, '..', 'node_modules', 'electron-prebuilt')
const muonFolderDist = path.join(muonFolder, 'dist')
const muonVersion = 'latest' // XXX
const downloadUrl = `https://brave-test-builds.s3.amazonaws.com/muon/brave-debug-${muonVersion}-linux-x64.zip`
const localPath = path.join(muonFolder, `brave-debug-${muonVersion}-linux-x64.zip`)

console.log(`downloading muon debug build: ${downloadUrl}`)
request
  .get(downloadUrl)
  .on('error', function (error) {
    console.log('could not get', downloadUrl, error)
    process.exit(1)
  })
  .on('end', function (response) {
    console.log('muon download finished')
    execute(`unzip -o -q -d ${muonFolderDist} ${localPath}`, process.env, (err) => {
      if (err) {
        console.error('failed', err)
        process.exit(1)
        return
      }
      console.log('done')
    })
  })
  .pipe(fs.createWriteStream(localPath))
