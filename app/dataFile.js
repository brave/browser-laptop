/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const request = require('request')
const fs = require('fs')
const path = require('path')
const app = require('electron').app
const AppConfig = require('./appConfig')
const AppActions = require('../js/actions/appActions')
const cachedDataFiles = {}

const storagePath = (resourceName) =>
  path.join(app.getPath('userData'), `${resourceName}.dat`)
const downloadPath = (resourceName) => `${storagePath(resourceName)}.temp`

module.exports.downloadDataFile = (resourceName, url, version, force) => {
  return new Promise((resolve, reject) => {
    // console.log('downloadDataFile', resourceName)
    let headers = {}
    const AppStore = require('../js/stores/appStore')
    const etag = AppStore.getState().getIn([resourceName, 'etag'])
    if (!force && etag) {
      headers = {
        'If-None-Match': etag
      }
    }

    var req = request.get({
      url,
      headers
    }).on('response', function (response) {
      AppActions.setResourceLastCheck(resourceName, version, new Date().getTime())
      if (response.statusCode !== 200) {
        // console.log(resourceName, 'status code: ', response.statusCode)
        resolve()
        return
      }
      const etag = response.headers['etag']
      AppActions.setResourceETag(resourceName, etag)

      req.pipe(fs.createWriteStream(downloadPath(resourceName)).on('close', function () {
        fs.rename(downloadPath(resourceName), storagePath(resourceName), function (err) {
          if (err) {
            reject('could not rename downloaded file')
          } else {
            resolve()
          }
        })
      })).on('error', reject)
    }).on('error', () => {
      reject()
    })
  })
}

module.exports.readDataFile = (resourceName) => {
  return new Promise((resolve, reject) => {
    // console.log('readDataFile', resourceName)
    fs.readFile(storagePath(resourceName), function (err, data) {
      if (err || !data || data.length === 0) {
        reject()
      } else {
        resolve(data)
      }
    })
  })
}

module.exports.shouldRedownloadFirst = (resourceName, version) => {
  const AppStore = require('../js/stores/appStore')
  const lastCheckDate = AppStore.getState().getIn([resourceName, 'lastCheckDate'])
  const lastCheckVersion = AppStore.getState().getIn([resourceName, 'lastCheckVersion'])
  return lastCheckVersion !== version ||
    lastCheckDate && (new Date().getTime() - lastCheckDate) > AppConfig[resourceName].msBetweenRechecks
}

module.exports.init = (win, resourceName,
    startFiltering, filteringWorker, first, windowsToStartFor) => {
  const version = AppConfig[resourceName].version
  const url = AppConfig[resourceName].url.replace('{version}', version)

  if (!AppConfig[resourceName].enabled) {
    return
  }

  // We use the same instance for all BrowserWindows
  // So just go directly to start when it's non first
  if (!first) {
    // Data is not available yet, add it to a list to notify
    if (!cachedDataFiles[resourceName]) {
      windowsToStartFor.push(win)
      return
    }
    startFiltering(win)
    return
  }

  const loadProcess = (resourceName, version, doneInit) =>
    module.exports.readDataFile(resourceName)
    .then(doneInit)
    .catch((resolve, reject) => {
      module.exports.downloadDataFile(resourceName, url, version, true)
      .then(module.exports.readDataFile.bind(null, resourceName))
      .then(doneInit)
      .catch((err) => {
        console.log(`Could not init ${resourceName}`, err || '')
        reject()
      })
    })

  const doneInit = data => {
    // console.log('init data file')
    // Make sure we keep a reference to the data since
    // it's used directly
    cachedDataFiles[resourceName] = data
    filteringWorker.deserialize(data)
    windowsToStartFor.push(win)
    windowsToStartFor.forEach(startFiltering)
    windowsToStartFor = null
  }

  if (module.exports.shouldRedownloadFirst(resourceName, version)) {
    module.exports.downloadDataFile(resourceName, url, version, false)
      .then(loadProcess.bind(null, resourceName, version, doneInit))
  } else {
    loadProcess(resourceName, version, doneInit)
  }
}

module.exports.debug = (resourceName, details, shouldBlock) => {
  if (!shouldBlock) {
    return
  }
  /*
  console.log('-----')
  console.log(`${resourceName} should block: `, shouldBlock)
  console.log(details.url)
  console.log(details.firstPartyUrl)
  console.log(details.resourceType)
  */
}
