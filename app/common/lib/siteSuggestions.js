/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Bloodhound = require('bloodhound-js')

let initialized = false
let engine
let internalSort
let lastQueryInput

// Same as sortByAccessCountWithAgeDecay but if one is a prefix of the
// other then it is considered always sorted first.
const sortForSuggestions = (s1, s2) => {
  return internalSort(s1, s2)
}

const getSiteIdentity = (data) => {
  if (typeof data === 'string') {
    return data
  }
  return (data.location || '') + (data.partitionNumber ? '|' + data.partitionNumber : '')
}

const init = (sites) => {
  engine = new Bloodhound({
    local: sites.toJS ? sites.toJS() : sites,
    sorter: sortForSuggestions,
    queryTokenizer: tokenizeInput,
    datumTokenizer: tokenizeInput,
    identify: getSiteIdentity
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
    lastQueryInput = input || ''
    const {getSortForSuggestions} = require('./suggestion')
    internalSort = getSortForSuggestions(lastQueryInput.toLowerCase())
    engine.search(lastQueryInput, function (results) {
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
