/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')
const session = electron.session
const underscore = require('underscore')
const util = require('util')

/**
 * Sends a network request using Chromium's networks stack instead of Node's.
 * Depends on there being a loaded browser window available.
 * @param {string} url - the url to load
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

/*
const http = require('http')
const https = require('https')
const url = require('url')

module.exports.request = (options, callback) => {
  var client, parts, request

  if (typeof options === 'string') options = { url: options }
  parts = url.parse(options.url)
  parts.method = options.method || 'GET'
  parts.headers = options.headers

  client = parts.protocol === 'https:' ? https : http
  request = client.request(parts, (response) => {
    var chunks = []
    var responseType = options.responseType || 'text'

    response.on('data', (chunk) => {
      if (!Buffer.isBuffer(chunk)) chunk = new Buffer(chunk, responseType !== 'text' ? 'binary' : 'utf8')

      chunks.push(chunk)
    }).on('end', () => {
      var rsp = underscore.pick(response, [ 'statusCode', 'statusMessage', 'headers', 'httpVersionMajor', 'httpVersionMinor' ])

      var done = (err, result) => { callback(err, rsp, result) }

      var f = {
        arraybuffer: () => { done(null, Buffer.concat(chunks)) },

        blob: () => {
          done(null, 'data:' + rsp.headers['content-type'] + ';base64,' + Buffer.concat(chunks).toString('base64'))
        },

        text: () => { done(null, Buffer.concat(chunks).toString('utf8')) }
      }[responseType] || (() => { done(null, Buffer.concat(chunks).toString('binary')) })

      underscore.defaults(rsp, { httpVersionMajor: 1, httpVersionMinor: 1 })
      try { f() } catch (ex) { done(ex) }
    }).setEncoding('binary')
  }).on('error', (err) => {
    callback(err)
  })
  if (options.payload) request.write(JSON.stringify(options.payload))
  request.end()
}
 */

module.exports.requestDataFile = (url, headers, path, reject, resolve) => {
  var defaultSession = session.defaultSession
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
