/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const URL = require('url')
const ABPFilterParserLib = require('abp-filter-parser-cpp')
const ABPFilterParser = ABPFilterParserLib.ABPFilterParser
const FilterOptions = ABPFilterParserLib.FilterOptions
const AppConfig = require('./appConfig')
const DataFile = require('./dataFile')

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

const debug = (details, shouldBlock) => {
  if (!shouldBlock) {
    return
  }
  /*
  console.log('-----')
  console.log('Should block: ', shouldBlock)
  console.log(details.url)
  console.log(details.firstPartyUrl)
  console.log(details.resourceType)
  */
}

const startAdBlocking = (win) => {
  win.webContents.session.webRequest.onBeforeRequest(function (details, cb) {
    const firstPartyUrl = URL.parse(details.firstPartyUrl)
    const shouldBlock = firstPartyUrl.protocol &&
      firstPartyUrl.protocol.startsWith('http') &&
      mapFilterType[details.resourceType] !== undefined &&
      parser.matches(details.url, mapFilterType[details.resourceType], firstPartyUrl.hostname)
    debug(details, shouldBlock)
    try {
      cb({
        cancel: shouldBlock
      })
    } catch (e) {
      cb({})
    }
  })
}

let windowsToStartAdblockFor = []
module.exports.init = (win) => {
  if (!AppConfig.enableAdBlockDefault) {
    return
  }

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

  const init = data => {
    // console.log('init data file')
    // Make sure we keep a reference to the data since
    // it's used directly
    module.exports.adBlockData = data
    parser.deserialize(data)
    windowsToStartAdblockFor.push(win)
    windowsToStartAdblockFor.forEach(startAdBlocking)
    windowsToStartAdblockFor = null
  }

  const readData = () => DataFile.readDataFile(resourceName)
    .then(init)
    .catch((resolve, reject) => {
      DataFile.downloadDataFile(resourceName, url, AppConfig.adBlockVersion, true)
      .then(DataFile.readDataFile.bind(null, resourceName))
      .then(init)
      .catch((err) => {
        console.log('Could not init adblock', err || '')
        reject()
      })
    })

  const resourceName = 'adblock'
  const url = AppConfig.adBlockUrl.replace('{version}', AppConfig.adBlockVersion)
  if (DataFile.shouldRedownloadFirst(resourceName, AppConfig.adBlockVersion)) {
    DataFile.downloadDataFile(resourceName, url, AppConfig.adBlockVersion, false)
      .then(readData)
  } else {
    readData()
  }
}
