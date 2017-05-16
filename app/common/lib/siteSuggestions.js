/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Bloodhound = require('bloodhound-js')
const {isUrl} = require('../../../js/lib/appUrlUtil')
const siteTags = require('../../../js/constants/siteTags')
const urlParse = require('../urlParse')

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

const getPartsFromNonUrlInput = (input) =>
  input.toLowerCase().split(/[,-.\s\\/?&]/)

const getTagToken = (tag) => '|' + tag + '|'

const tokenizeInput = (data) => {
  let url = data || ''
  let parts = []

  if (typeof data === 'object' && data !== null) {
    // When lastAccessTime is 1 it is a default built-in entry which we don't want
    // to appear in suggestions.
    if (data.lastAccessedTime === 1) {
      return []
    }
    url = data.location
    if (data.title) {
      parts = getPartsFromNonUrlInput(data.title)
    }
    if (data.tags) {
      parts = parts.concat(data.tags.map(getTagToken))
    }
  } else {
    if (lastQueryOptions && !lastQueryOptions.historySuggestionsOn && lastQueryOptions.bookmarkSuggestionsOn) {
      parts.push(getTagToken(siteTags.BOOKMARK))
    }
  }

  if (url && isUrl(url)) {
    const parsedUrl = urlParse(url.toLowerCase())
    if (parsedUrl.hash) {
      parts.push(parsedUrl.hash.slice(1))
    }
    if (parsedUrl.host) {
      parts = parts.concat(parsedUrl.host.split('.'))
    }
    if (parsedUrl.pathname) {
      parts = parts.concat(parsedUrl.pathname.split(/[.\s\\/]/))
    }
    if (parsedUrl.query) {
      parts = parts.concat(parsedUrl.query.split(/[&=]/))
    }
    if (parsedUrl.protocol) {
      parts = parts.concat(parsedUrl.protocol)
    }
  } else if (url) {
    parts = parts.concat(getPartsFromNonUrlInput(url))
  }
  return parts.filter(x => !!x)
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
    const {getSortForSuggestions} = require('./suggestion')
    input = (input || '').toLowerCase()
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
