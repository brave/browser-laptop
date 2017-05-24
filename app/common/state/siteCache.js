/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const Immutable = require('immutable')
const {isMap} = require('./immutableUtil')
const siteUtil = require('../../../js/state/siteUtil')
const UrlUtil = require('../../../js/lib/urlutil')

const createLocationSiteKeysCache = (state) => {
  state = state.set('locationSiteKeysCache', new Immutable.Map())
  state.get('sites').forEach((site, siteKey) => {
    const location = siteUtil.getLocationFromSiteKey(siteKey)
    if (!location) {
      return
    }
    state = addLocationSiteKey(state, location, siteKey)
  })
  return state
}

// See getSiteKeysByFolder() for explanation.
const createSiteKeysByFolderCache = (state) => {
  const sites = state.get('sites')
  // Memoize nested folder paths.
  // '1': ['2', '1']
  // '3': ['2', '1', '3']
  let groupedPathMemo = {}
  const groupedPath = (siteKey) => {
    if (typeof siteKey === 'number') {
      siteKey = siteKey + ''
    }
    const memoResult = groupedPathMemo[siteKey]
    if (memoResult) {
      return memoResult
    }

    const site = sites.get(siteKey)
    if (!site) {
      return [siteKey]
    }
    const parentFolderId = site.get('parentFolderId')
    if (parentFolderId && parentFolderId !== -1) {
      const path = groupedPath(parentFolderId).concat([siteKey])
      groupedPathMemo[siteKey] = path
      return path
    } else {
      return [siteKey]
    }
  }

  // For sorting
  let keysOrders = {}
  let result = new Immutable.Map()
  sites.forEach((site, key) => {
    if (typeof key === 'number') {
      key = key + ''
    }
    const tags = site.get('tags')
    if (!tags || tags.size === 0) {
      return
    }
    if (siteUtil.isBookmark(site)) {
      result = result.setIn(groupedPath(key), null)
    } else if (siteUtil.isFolder(site)) {
      result = result.setIn(groupedPath(key), new Immutable.Map())
    } else {
      return
    }
    keysOrders[key] = site.get('order')
  })

  const deepSort = (map) => {
    map = map.map(value => isMap(value) ? deepSort(value) : value)
    return map.sortBy((value, key) => keysOrders[key])
  }
  result = deepSort(result)
  return state.set('siteKeysByFolderCache', result)
}

module.exports.loadLocationSiteKeysCache = (state) => {
  const cache = state.get('locationSiteKeysCache')
  if (cache) {
    return state
  }
  return createLocationSiteKeysCache(state)
}

module.exports.createSiteKeysByFolderCache = createSiteKeysByFolderCache

/**
 * Given a location, get matching appState siteKeys based on cache.
 * Loads cache from appState if it hasn't been loaded yet.
 * @param state Application state
 * @param location {string}
 * @return {Immutable.List<string>|null} siteKeys including this location.
 */
module.exports.getLocationSiteKeys = (state, location) => {
  const normalLocation = UrlUtil.getLocationIfPDF(location)
  return state.getIn(['locationSiteKeysCache', normalLocation])
}

/**
 * Group Immutable Map key paths by folder and order as seen in menus.
 * OrderedMap {
 *   '1': OrderedMap {
 *     '3': OrderedMap { },
 *     'https://archive.org|0|1': null
 *   },
 *   '2': OrderedMap { 'https://example.com|0|2 },
 *   'https://wikipedia.org|0|0': null
 * }
 *
 * @param state Application state
 * @return {Immutable.Map} Site keys by folder
 */
module.exports.getSiteKeysByFolder = (state) => {
  return state.get('siteKeysByFolderCache')
}

/**
 * Given a location, add appState siteKey to cached siteKeys list.
 * Returns new state.
 * @param state Application state
 * @param location {string}
 * @param siteKey {string}
 */
const addLocationSiteKey = (state, location, siteKey) => {
  if (!siteKey || !location) {
    return state
  }
  const normalLocation = UrlUtil.getLocationIfPDF(location)
  const cacheKey = ['locationSiteKeysCache', normalLocation]
  const siteKeys = state.getIn(cacheKey)
  if (!siteKeys) {
    return state.setIn(cacheKey, new Immutable.List([siteKey]))
  } else {
    if (siteKeys.includes(siteKey)) {
      return state
    }
    return state.setIn(cacheKey, siteKeys.push(siteKey))
  }
}
module.exports.addLocationSiteKey = addLocationSiteKey

/**
 * Given a location, remove matching appState siteKeys in cache.
 * Loads cache from appState if it hasn't been loaded yet.
 * @param state Application state
 * @param location {string}
 * @param siteKey {string}
 */
const removeLocationSiteKey = (state, location, siteKey) => {
  if (!siteKey || !location) {
    return state
  }
  const normalLocation = UrlUtil.getLocationIfPDF(location)
  const cacheKey = ['locationSiteKeysCache', normalLocation]
  let siteKeys = state.getIn(cacheKey)
  if (!siteKeys) {
    return state
  }
  siteKeys = siteKeys.filter(key => key !== siteKey)
  if (siteKeys.size > 0) {
    return state.setIn(cacheKey, siteKeys)
  } else {
    return state.deleteIn(cacheKey)
  }
}
module.exports.removeLocationSiteKey = removeLocationSiteKey
