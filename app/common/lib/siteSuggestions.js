/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Bloodhound = require('bloodhound-js')
let initialized = false
let engine

const init = (sites) => {
  if (initialized) {
    return Promise.resolve()
  }
  engine = new Bloodhound({
    local: sites,
    queryTokenizer: tokenizeInput,
    datumTokenizer: tokenizeInput
  })
  const promise = engine.initialize()
  promise.then(() => {
    initialized = true
  })
  return promise
}

const tokenizeInput = (data) => {
  let url = data || ''
  let parts = []

  if (typeof data === 'object' && data !== null) {
    url = data.location
    if (data.title) {
      parts = data.title.toLowerCase().split(/\s/)
    }
  }

  if (url) {
    url = url.toLowerCase().replace(/^https?:\/\//i, '')
    parts = parts.concat(url.split(/[.\s\\/?&]/))
  }

  return parts
}

const query = (input) => {
  if (!initialized) {
    return Promise.resolve([])
  }
  return new Promise((resolve, reject) => {
    engine.search(input, function (results) {
      resolve(results)
    }, function (err) {
      reject(err)
    })
  })
}

module.exports = {
  init,
  tokenizeInput,
  query
}
