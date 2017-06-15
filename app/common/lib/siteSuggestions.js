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
  sites = sites.toJS ? sites.toJS() : sites
  // Sort sites with smaller count first because later ones will overwrite with correct counts based on the site identity.
  // This can happen when a user bookmarks the same site multiple times, but only one of the items are getting counts
  // incremented by normal operations.
  sites = sites.sort((s1, s2) => (s1.count || 0) - (s2.count || 0))
  engine = new Bloodhound({
    local: sites,
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

  const isSiteObject = typeof data === 'object' && data !== null
  if (isSiteObject) {
    // When lastAccessTime is 1 it is a default built-in entry which we don't want
    // to appear in suggestions.
    if (data.lastAccessedTime === 1) {
      return []
    }
    url = data.location
    if (data.customTitle) {
      parts = getPartsFromNonUrlInput(data.customTitle)
    }
    if (data.title) {
      parts = parts.concat(getPartsFromNonUrlInput(data.title))
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
    // Cache parsed value for latter use when sorting
    if (isSiteObject) {
      data.parsedUrl = parsedUrl
    }
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
