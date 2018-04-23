/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Bloodhound = require('bloodhound-js')
const {isUrl} = require('../../../js/lib/appUrlUtil')
const siteTags = require('../../../js/constants/siteTags')
const urlParse = require('../urlParse')
const Immutable = require('immutable')
const urlUtil = require('../../../js/lib/urlutil')

let take = 1000
let initialQueTime = 50
let initialized = false
let engine
let lastQueryOptions
let initialQueInterval = []

// Same as sortByAccessCountWithAgeDecay but if one is a prefix of the
// other then it is considered always sorted first.
const sortForSuggestions = (s1, s2) => {
  return lastQueryOptions.internalSort(s1, s2)
}

const getSiteIdentity = (data) => {
  if (typeof data === 'string') {
    return data
  }

  const partitionNumber = data.get('partitionNumber')
  let location = data.get('location') || ''
  location = urlUtil.stripLocation(location)
  return location + (partitionNumber ? '|' + partitionNumber : '')
}

const loadOtherSites = (sites) => {
  add(sites.take(take))
  return sites.skip(take)
}

const init = (...sites) => {
  engine = new Bloodhound({
    local: [],
    sorter: sortForSuggestions,
    queryTokenizer: tokenizeInput,
    datumTokenizer: tokenizeInput,
    identify: getSiteIdentity
  })

  const promise = engine.initialize()

  promise.then(() => {
    initialized = true
    let i = 0
    for (let item of sites) {
      item = item.toJS ? item : Immutable.fromJS(item)
      if (item.size === 0) {
        continue
      }
      let list = item.toList()
      list = loadOtherSites(list)

      if (list.size > 0) {
        initialQueInterval[i] = setInterval((j) => {
          list = loadOtherSites(list)

          if (list.size === 0) {
            clearInterval(initialQueInterval[j])
          }
        }, initialQueTime, i)
      }
      i++
    }
  })

  return promise
}

const getPartsFromNonUrlInput = (input) =>
  input.toLowerCase().split(/[,-.\s\\/?&]/)

const getTagToken = (tag) => '|' + tag + '|'

const tokenizeInput = (data) => {
  let url = data || ''
  let parts = []

  const isSiteObject = data != null && data.toJS
  if (isSiteObject) {
    // When lastAccessTime is 1 it is a default built-in entry which we don't want
    // to appear in suggestions.
    if (data.get('lastAccessedTime') === 1) {
      return []
    }
    url = data.get('location')
    if (data.get('title')) {
      parts = parts.concat(getPartsFromNonUrlInput(data.get('title')))
    }
  } else {
    if (lastQueryOptions && !lastQueryOptions.historySuggestionsOn && lastQueryOptions.bookmarkSuggestionsOn) {
      parts.push(getTagToken(siteTags.BOOKMARK))
    }
  }

  const parsedUrl = typeof url === 'string' && isUrl(url) && urlParse(url.toLowerCase())

  if (parsedUrl && (parsedUrl.hash || parsedUrl.host || parsedUrl.pathname || parsedUrl.query || parsedUrl.protocol)) {
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
      // I think fast-url-parser has a bug in it where it returns an object for query
      // instead of a string.  Object is supported but only when you pass in true
      // for the second value of parse which we don't do.
      // We can remove this when we change away from using fast-url-parser in favour of the
      // Chrome URL parser.
      if (parsedUrl.query.constructor !== String) {
        parsedUrl.query = Object.entries(parsedUrl.query).map((x) => x.join('=')).join('&')
      }
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
  engine.add(data.toJS ? data : Immutable.fromJS(data))
}

const remove = (data) => {
  if (!initialized) {
    return
  }
  engine.remove(data.toJS ? data : Immutable.fromJS(data))
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
  query,
  remove
}
