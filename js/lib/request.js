/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')
const session = electron.session
const underscore = require('underscore')
const util = require('util')
const urlParse = require('../../app/common/urlParse')

/**
 * Sends a network request using Chromium's networks stack instead of Node's.
 * Depends on there being a loaded browser window available.
 * @param {Object|string} options - options object or URL to load
 * @param {function.<Error, Object, string>} callback
 */
module.exports.request = (options, callback) => {
  var params
  var defaultSession = session.defaultSession
  var responseType = options.responseType || 'text'

  if (!defaultSession) return callback(new Error('Request failed, no session available'))

  if (typeof options === 'string') options = { url: options }
  params = underscore.defaults(underscore.pick(options, [ 'method', 'headers' ]), { headers: {} })
  params.headers['accept-encoding'] = ''
  if (options.payload) {
    underscore.extend(params, { payload: JSON.stringify(options.payload),
                                payload_content_type: params.headers['content-type'] || 'application/json; charset=utf-8'
                              })
  }

  if (process.env.NODE_ENV === 'development' &&
      urlParse(options.url).protocol === 'http:') {
    console.log('WARNING: requesting non-HTTPS URL', options.url)
  }

  defaultSession.webRequest.fetch(options.url, params, (err, response, body) => {
    var rsp = underscore.pick(response || {},
                              [ 'statusCode', 'statusMessage', 'headers', 'httpVersionMajor', 'httpVersionMinor' ])

    underscore.keys(rsp.headers).forEach((header) => {
      if (util.isArray(rsp.headers[header])) rsp.headers[header] = rsp.headers[header][0]
    })

    if (err) return callback(err, rsp)

    underscore.defaults(rsp, { statusMessage: '', httpVersionMajor: 1, httpVersionMinor: 1 })
    if (responseType !== 'text') body = new Buffer(body, 'binary')
    if (responseType === 'blob') body = 'data:' + rsp.headers['content-type'] + ';base64,' + body.toString('base64')

    callback(null, rsp, body)
  })
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
