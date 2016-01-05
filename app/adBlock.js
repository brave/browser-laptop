'use strict'

const URL = require('url')
const request = require('request')
const fs = require('fs')
const path = require('path')
const ABPFilterParserLib = require('abp-filter-parser-cpp')
const ABPFilterParser = ABPFilterParserLib.ABPFilterParser
const FilterOptions = ABPFilterParserLib.FilterOptions
const app = require('electron').app
const AppConfig = require('./appConfig')

const adBlockFilename = `adBlock-${AppConfig.adBlockVersion}`
const storagePath = path.join(app.getPath('userData'), adBlockFilename)

let parser

let mapFilterType = {
  mainFrame: FilterOptions.document,
  subFrame: FilterOptions.subdocument,
  stylesheet: FilterOptions.stylesheet,
  script: FilterOptions.script,
  image: FilterOptions.image,
  object: FilterOptions.object,
  xhr: FilterOptions.xmlHttpRequest,
  other: FilterOptions.other
}

/*
const debug = (details) => {
  console.log('-----')
  console.log(details.url)
  console.log(details.firstPartyUrl)
  console.log(details.resourceType)
}
*/

const downloadAdBlockData = () => {
  return new Promise((resolve, reject) =>
    request(AppConfig.adBlockUrl.replace('{version}', AppConfig.adBlockVersion))
      .pipe(fs.createWriteStream(storagePath))
      .on('close', resolve)
      .on('error', reject))
}

const startAdBlocking = (win) => {
  win.webContents.session.webRequest.onBeforeRequest(function (details, cb) {
    // debug(details)
    try {
      cb({
        cancel: mapFilterType[details.resourceType] !== undefined &&
          parser.matches(details.url, mapFilterType[details.resourceType], URL.parse(details.firstPartyUrl).firstPartyUrl)
      })
    } catch (e) {
      cb({})
    }
  })
}

const readAdBlockData = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(storagePath, function (err, data) {
      if (err) {
        reject()
      } else {
        resolve(data)
      }
    })
  })
}

let windowsToStartAdblockFor = []
module.exports.init = (win) => {
  // Use the same parser for all BrowserWindows
  if (parser) {
    // AdBlock data is not available yet, add it to a list to notify
    if (!module.exports.adBlockData) {
      windowsToStartAdblockFor.push(win)
      return
    }
    startAdBlocking(win)
    return
  }

  parser = new ABPFilterParser()

  readAdBlockData().catch(() => {
    return new Promise((resolve, reject) => {
      downloadAdBlockData().then(readAdBlockData).then(resolve).catch(reject)
    })
  }).then(data => {
    // Make sure we keep a reference to the data since
    // it's used directly
    module.exports.adBlockData = data
    parser.deserialize(data)
    windowsToStartAdblockFor.push(win)
    windowsToStartAdblockFor.forEach(startAdBlocking)
    windowsToStartAdblockFor = null
  }).catch(() => {
    console.error('Could not start adblock!')
  })
}
