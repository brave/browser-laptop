/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const request = require('request')
const fs = require('fs')
const path = require('path')
const urlParse = require('url').parse
const app = require('electron').app
const AppConfig = require('./appConfig')
const AppActions = require('../js/actions/appActions')
const cachedDataFiles = {}

const storagePath = (url) =>
  path.join(app.getPath('userData'), path.basename(urlParse(url).pathname))
const downloadPath = (url) => `${storagePath(url)}.temp`

function downloadSingleFile (resourceName, url, version, force, resolve, reject) {
  console.log('downloading', url)
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
      reject('Got HTTP status code ' + response.statusCode)
      return
    }
    const etag = response.headers['etag']
    AppActions.setResourceETag(resourceName, etag)

    req.pipe(fs.createWriteStream(downloadPath(url)).on('close', function () {
      console.log('wrote', storagePath(url))
      fs.rename(downloadPath(url), storagePath(url), function (err) {
        if (err) {
          reject('could not rename downloaded file')
        } else {
          console.log('renamed', storagePath(url))
          resolve()
        }
      })
    })).on('error', reject)
  }).on('error', () => {
    reject()
  })
}

module.exports.downloadDataFile = (resourceName, url, version, force) => {
  if (resourceName === 'httpsEverywhere') {
    return new Promise((resolve, reject) => {
      downloadSingleFile(resourceName, url, version, force, () => {
        var targets = AppConfig[resourceName].targetsUrl.replace('{version}', version)
        downloadSingleFile(resourceName, targets, version, force, resolve, reject)
      }, reject)
    })
  } else {
    return new Promise((resolve, reject) => {
      downloadSingleFile(resourceName, url, version, force, resolve, reject)
    })
  }
}

module.exports.readDataFile = (resourceName, url) => {
  if (resourceName === 'httpsEverywhere') {
    // If https everywhere, just return the path to the files on disk
    return new Promise((resolve, reject) => {
      fs.stat(storagePath(url), function (err, stats) {
        if (err || !stats.isFile()) {
          reject()
        } else {
          resolve(app.getPath('userData'))
        }
      })
    })
  } else {
    return new Promise((resolve, reject) => {
      fs.readFile(storagePath(url), function (err, data) {
        if (err || !data || data.length === 0) {
          reject()
        } else {
          resolve(data)
        }
      })
    })
  }
}

module.exports.shouldRedownloadFirst = (resourceName, version) => {
  const AppStore = require('../js/stores/appStore')
  const lastCheckDate = AppStore.getState().getIn([resourceName, 'lastCheckDate'])
  const lastCheckVersion = AppStore.getState().getIn([resourceName, 'lastCheckVersion'])
  return lastCheckVersion !== version ||
    lastCheckDate && (new Date().getTime() - lastCheckDate) > AppConfig[resourceName].msBetweenRechecks
}

/**
 * @param {BrowserWindow} win Window to start in.
 * @param {string} resourceName Name of the "extension".
 * @param {function(BrowserWindow)} startExtension Function that starts the
 *   extension listeners.
 * @param {boolean} first Whether this is the first window
 * @param {Array.<BrowserWindow>} windowsToStartFor Additional windows to start
 *   the extension in.
 * @param {function(Buffer|string)} onInitDone function to call when data is downloaded.
 *   Takes either the data itself as an argument or the pathname on disk of the
 *   directory where the data was downloaded.
 */
module.exports.init = (win, resourceName,
    startExtension, first, windowsToStartFor, onInitDone) => {
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
    startExtension(win)
    return
  }

  const doneInit = data => {
    // Make sure we keep a reference to the data since
    // it's used directly
    cachedDataFiles[resourceName] = data
    onInitDone(data)
    windowsToStartFor.push(win)
    windowsToStartFor.forEach(startExtension)
    windowsToStartFor = null
  }

  const loadProcess = (resourceName, version) =>
    module.exports.readDataFile(resourceName, url)
    .then(doneInit)
    .catch((resolve, reject) => {
      module.exports.downloadDataFile(resourceName, url, version, true)
      .then(module.exports.readDataFile.bind(null, resourceName, url))
      .then(doneInit)
      .catch((err) => {
        console.log(`Could not init ${resourceName}`, err || '')
        reject()
      })
    })

  if (module.exports.shouldRedownloadFirst(resourceName, version)) {
    module.exports.downloadDataFile(resourceName, url, version, false)
      .then(loadProcess.bind(null, resourceName, version))
  } else {
    loadProcess(resourceName, version)
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
