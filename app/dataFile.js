/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const request = require('request')
const fs = require('fs')
const path = require('path')
const urlParse = require('url').parse
const app = require('electron').app
const appConfig = require('../js/constants/appConfig')
const appActions = require('../js/actions/appActions')
const cachedDataFiles = {}

const storagePath = (url) =>
  path.join(app.getPath('userData'), path.basename(urlParse(url).pathname))
const downloadPath = (url) => `${storagePath(url)}.temp`

function downloadSingleFile (resourceName, url, version, force, resolve, reject) {
  // console.log('downloading', url)
  let headers = {}
  const AppStore = require('../js/stores/appStore')
  const etag = AppStore.getState().getIn([resourceName, 'etag'])
  if (!force && etag) {
    headers = {
      'If-None-Match': etag
    }
  }

  // console.log('doing a request.get', resourceName)
  var req = request.get({
    url,
    headers
  }).on('response', response => {
    // console.log('response...', resourceName)
    if (response.statusCode !== 200) {
      // console.log(resourceName, 'status code: ', response.statusCode)
      reject(`Got HTTP status code ${response.statusCode}`)
      return
    }
    const etag = response.headers['etag']

    // console.log('setting dwonloadPath...', resourceName)
    req.pipe(fs.createWriteStream(downloadPath(url)).on('close', () => {
      fs.rename(downloadPath(url), storagePath(url), err => {
        if (err) {
          // console.log('rjecting for download:', resourceName)
          reject('could not rename downloaded file')
        } else {
          // console.log('resolving for download:', resourceName)
          appActions.setResourceETag(resourceName, etag)
          appActions.setResourceLastCheck(resourceName, version, new Date().getTime())
          resolve()
        }
      })
    })).on('error', reject)
  }).on('error', () => {
    reject()
  })
}

module.exports.downloadDataFile = (resourceName, url, version, force) => {
  return new Promise((resolve, reject) => {
    downloadSingleFile(resourceName, url, version, force, resolve, reject)
  })
}

module.exports.readDataFile = (resourceName, url) => {
  return new Promise((resolve, reject) => {
    fs.readFile(storagePath(url), (err, data) => {
      if (err || !data || data.length === 0) {
        // console.log('rejecting for read for resource:', resourceName)
        reject()
      } else {
        // console.log('resolving for read for resource:', resourceName)
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
    lastCheckDate && (new Date().getTime() - lastCheckDate) > appConfig[resourceName].msBetweenRechecks
}

/**
 * @param {string} resourceName Name of the "extension".
 * @param {function(BrowserWindow)} startExtension Function that starts the
 *   extension listeners.
 * @param {function(Buffer|string)} onInitDone function to call when data is downloaded.
 * @param {boolean} forceDownload Whether to force the data file to be downloaded. Defaults to false.
 *   Takes either the data itself as an argument or the pathname on disk of the
 *   directory where the data was downloaded.
 */
module.exports.init = (resourceName, startExtension, onInitDone, forceDownload) => {
  const version = appConfig[resourceName].version
  const url = appConfig[resourceName].url.replace('{version}', version)

  if (!appConfig[resourceName].enabled) {
    return
  }

  const doneInit = data => {
    // Make sure we keep a reference to the data since
    // it's used directly
    // console.log('done init:', resourceName)
    cachedDataFiles[resourceName] = data
    onInitDone(data)
    startExtension()
  }

  const loadProcess = (resourceName, version) =>
    module.exports.readDataFile(resourceName, url)
    .then(doneInit)
    .catch(() => {
      module.exports.downloadDataFile(resourceName, url, version, true)
      .then(module.exports.readDataFile.bind(null, resourceName, url))
      .then(doneInit)
      .catch((err) => {
        console.log(`Could not init ${resourceName}`, err || '')
      })
    })

  if (forceDownload || module.exports.shouldRedownloadFirst(resourceName, version)) {
    module.exports.downloadDataFile(resourceName, url, version, false)
      .then(loadProcess.bind(null, resourceName, version))
      .catch(loadProcess.bind(null, resourceName, version))
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
