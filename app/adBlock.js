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
const AppActions = require('../js/actions/appActions')

const adBlockFilename = 'adBlock.dat'
const storagePath = path.join(app.getPath('userData'), adBlockFilename)
const downloadPath = `${storagePath}.temp`

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
  return new Promise((resolve, reject) => {
    let headers = {}
    const resourceName = 'adblock'
    const AppStore = require('../js/stores/appStore')
    const etag = AppStore.getState().getIn([resourceName, 'etag'])
    if (etag) {
      headers = {
        'If-None-Match': etag
      }
    }

    var req = request.get({
      url: AppConfig.adBlockUrl.replace('{version}', AppConfig.adBlockVersion),
      headers
    }).on('response', function (response) {
      AppActions.setResourceLastCheck(resourceName, AppConfig.adBlockVersion, new Date().getTime())
      if (response.statusCode !== 200) {
        readAdBlockData().then(resolve).catch(reject)
        return
      }
      const etag = response.headers['etag']
      AppActions.setResourceETag(resourceName, etag)

      req.pipe(fs.createWriteStream(downloadPath).on('close', function () {
        fs.rename(downloadPath, storagePath, function (err) {
          if (err) {
            reject('could not rename downloaded file')
          } else {
            resolve()
          }
        })
      }))
      .on('error', reject)
    })
  })
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

  const AppStore = require('../js/stores/appStore')
  const resourceName = 'adblock'
  const lastCheckDate = AppStore.getState().getIn([resourceName, 'lastCheckDate'])
  const lastCheckVersion = AppStore.getState().getIn([resourceName, 'lastCheckVersion'])

  let redownloadFirst
  if (lastCheckVersion !== AppConfig.adBlockVersion ||
      lastCheckDate && (new Date().getTime() - lastCheckDate) > AppConfig.msBetweenDataFileRechecks) {
    redownloadFirst = downloadAdBlockData().then(readAdBlockData)
  }

  (redownloadFirst || readAdBlockData().catch(() => {
    return new Promise((resolve, reject) => {
      downloadAdBlockData().then(readAdBlockData).then(resolve).catch(reject)
    })
  })).then(data => {
    // Make sure we keep a reference to the data since
    // it's used directly
    module.exports.adBlockData = data
    parser.deserialize(data)
    windowsToStartAdblockFor.push(win)
    windowsToStartAdblockFor.forEach(startAdBlocking)
    windowsToStartAdblockFor = null
  }).catch((e) => {
    console.error('Could not start adblock!', e)
  })
}
