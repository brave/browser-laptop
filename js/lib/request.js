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
    defaultSession.webRequest.fetch(url, {}, (err, response, responseBody) => {
      callback(err, response.statusCode, responseBody)
    })
  }
}

module.exports.requestDataFile = (url, headers, path, reject, resolve) => {
  let defaultSession = session.defaultSession
  if (!defaultSession) {
    reject('Request failed, no session available')
  } else {
    // console.log('webRequest.fetch: ', url, headers, path)
    defaultSession.webRequest.fetch(url, { headers, path }, (err, response) => {
      // console.log('response: ', response)
      if (!err && response.statusCode === 200) {
        let etag = response.headers['etag']
        if (etag && etag.constructor === Array) {
          etag = etag[0]
        }
        resolve(etag)
      } else {
        reject(`Got HTTP status code ${response.statusCode}`)
      }
    })
  }
}
