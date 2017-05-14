/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Bloodhound = require('bloodhound-js')
const siteTags = require('../../../js/constants/siteTags')

let initialized = false
let engine
let lastQueryOptions

// Same as sortByAccessCountWithAgeDecay but if one is a prefix of the
// other then it is considered always sorted first.
const sortForSuggestions = (s1, s2) => {
  return lastQueryOptions.internalSort(s1, s2)
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

const getTagToken = (tag) => '|' + tag + '|'
const tokenizeInput = (data) => {
  let url = data || ''
  let parts = []

  if (typeof data === 'object' && data !== null) {
    url = data.location
    if (data.title) {
      parts = data.title.toLowerCase().split(/\s/)
    }
    if (data.tags) {
      parts = parts.concat(data.tags.map(getTagToken))
    }
  } else {
    if (lastQueryOptions && !lastQueryOptions.historySuggestionsOn && lastQueryOptions.bookmarkSuggestionsOn) {
      parts.push(getTagToken(siteTags.BOOKMARK))
    }
  }

  if (url) {
    url = url.toLowerCase().replace(/^https?:\/\//i, '')
    parts = parts.concat(url.split(/[.\s\\/?&]/))
  }

  return parts
}

const add = (data) => {
  if (!initialized) {
    return
  }
  if (typeof data === 'string') {
    engine.add(data)
  } else {
    engine.add(data.toJS ? data.toJS() : data)
  }
}

const query = (input, options = {}) => {
  if (!initialized) {
    return Promise.resolve([])
  }

  return new Promise((resolve, reject) => {
    const {getSortForSuggestions, normalizeLocation} = require('./suggestion')
    input = normalizeLocation((input || '').toLowerCase())
    lastQueryOptions = Object.assign({}, options, {
      input,
      internalSort: getSortForSuggestions(input)
    })
    if (lastQueryOptions.historySuggestionsOn !== false || lastQueryOptions.bookmarkSuggestionsOn !== false) {
      engine.search(input, function (results) {
        resolve(results)
      }, function (err) {
        reject(err)
      })
    } else {
      resolve([])
    }
  })
}

module.exports = {
  init,
  add,
  tokenizeInput,
  query
}
