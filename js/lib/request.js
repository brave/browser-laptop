/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')
const session = electron.session

/**
 * Sends a network request using Chromium's networks stack instead of Node's.
 * Depends on there being a loaded browser window available.
 * @param {string} url - the url to load
 */
module.exports.request = (url, callback) => {
  let defaultSession = session.defaultSession
  if (!defaultSession) {
    callback(new Error('Request failed, no session available'))
  } else {
    defaultSession.webRequest.fetch(url, 'get', {}, (statusCode, responseBody, headers) => {
      callback(null, statusCode, responseBody)
    })
  }
}

module.exports.requestDataFile = (url, headers, path, reject, resolve) => {
  let defaultSession = session.defaultSession
  if (!defaultSession) {
    reject('Request failed, no session available')
  } else {
    defaultSession.webRequest.fetch(url, 'get', headers, path, (statusCode, responseBody, headers) => {
      if (statusCode === 200) {
        resolve(headers['etag'])
      } else if (statusCode !== 200) {
        reject(`Got HTTP status code ${statusCode}`)
      }
    })
  }
}
