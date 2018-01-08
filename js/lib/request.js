/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')
const session = electron.session
const underscore = require('underscore')
const urlParse = require('../../app/common/urlParse')
const ipc = electron.ipcMain

var cachedDefaultSession = null
var backgroundPageWebContents = null

if (ipc) {
  ipc.on('got-background-page-webcontents', (e) => {
    backgroundPageWebContents = e.sender
  })
}

const getDefaultSession = () => {
  if (!cachedDefaultSession) {
    cachedDefaultSession = session.fromPartition('default')
  }
  return cachedDefaultSession
}

/**
 * Sends a network request using Chromium's networks stack instead of Node's.
 * Depends on there being a loaded browser window available.
 * @param {Object|string} options - options object or URL to load
 * @param {function.<Error, Object, string>} callback
 * @param {Object=} session - muon session to use if not the default
 */
module.exports.request = (options, callback, session) => {
  var params
  var responseType = options.responseType || 'text'
  var defaultSession = session || getDefaultSession()

  if (!defaultSession) return callback(new Error('Request failed, no session available'))

  if (typeof options === 'string') options = { url: options }
  params = underscore.defaults(underscore.pick(options, [ 'method', 'headers' ]), { headers: {} })
  params.headers['accept-encoding'] = ''
  if (options.payload) {
    underscore.extend(params, {
      payload: JSON.stringify(options.payload),
      payload_content_type: params.headers['content-type'] || 'application/json; charset=utf-8'
    })
  }

  if (typeof options.url !== 'string') {
    return callback(new Error('URL is not valid'))
  }

  if (process.env.NODE_ENV === 'development' &&
      urlParse(options.url).protocol === 'http:') {
    console.log('WARNING: requesting non-HTTPS URL', options.url)
  }

  defaultSession.webRequest.fetch(options.url, params, (err, response, body) => {
    var rsp = underscore.pick(response || {},
                              [ 'statusCode', 'statusMessage', 'headers', 'httpVersionMajor', 'httpVersionMinor' ])

    underscore.keys(rsp.headers).forEach((header) => {
      if (Array.isArray(rsp.headers[header])) rsp.headers[header] = rsp.headers[header][0]
    })

    if (err) return callback(err, rsp)

    underscore.defaults(rsp, { statusMessage: '', httpVersionMajor: 1, httpVersionMinor: 1 })
    if (responseType !== 'text') body = Buffer.from(body, 'binary')
    if (responseType === 'blob') body = 'data:' + rsp.headers['content-type'] + ';base64,' + body.toString('base64')

    callback(null, rsp, body)
  })
}

module.exports.requestDataFile = (url, headers, path, reject, resolve) => {
  var defaultSession = getDefaultSession()
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

/**
 * Fetches url, title, and image for a publishers site (Youtube, Twitch, etc.)
 * See
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
 * WARNING: the output of this function is untrusted. You should be careful not
 *  to execute it as code!
 * @param {string} url - url to fetch
 * @param {Object} options - options to pass to window.fetch
 * @param {Function({url: string, title: string, image: string, error: string})} callback
 */
module.exports.fetchPublisherInfo = (url, options, callback) => {
  if (!backgroundPageWebContents) {
    callback(new Error('Background page web contents not initialized.'), { url })
    return
  }
  backgroundPageWebContents.send('fetch-publisher-info', url, options)
  ipc.once('got-publisher-info-' + url, (e, response) => {
    callback(response.error, response.body)
  })
}
