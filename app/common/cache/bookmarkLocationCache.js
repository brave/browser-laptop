/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const Immutable = require('immutable')
const appUrlUtil = require('../../../js/lib/appUrlUtil')
const UrlUtil = require('../../../js/lib/urlutil')

const normalizeLocation = (location) => {
  const sourceAboutUrl = appUrlUtil.getSourceAboutUrl(location)
  if (sourceAboutUrl) {
    return sourceAboutUrl
  }
  return UrlUtil.getLocationIfPDF(location)
}

/**
 * Calculate location for siteKey
 *
 * @param siteKey The site key to to be calculated
 * @return {string|null}
 */
const getLocationFromCacheKey = function (siteKey) {
  if (!siteKey) {
    return null
  }

  const splitKey = siteKey.split('|', 2)
  if (typeof splitKey[0] === 'string' && typeof splitKey[1] === 'string') {
    return splitKey[0]
  }
  return null
}

const generateCache = (state) => {
  const cache = state.getIn(['cache', 'bookmarkLocation'])
  if (cache) {
    return state
  }

  state = state.setIn(['cache', 'bookmarkLocation'], new Immutable.Map())
  const bookmarksState = require('../state/bookmarksState')
  bookmarksState.getBookmarks(state).forEach((site, siteKey) => {
    const location = getLocationFromCacheKey(siteKey)
    if (!location) {
      return
    }
    state = addCacheKey(state, location, siteKey)
  })
  return state
}

/**
 * Given a location, get matching appState siteKeys based on cache.
 * Loads cache from appState if it hasn't been loaded yet.
 * @param state Application state
 * @param location {string}
 * @return {Immutable.List<string>|null} siteKeys including this location.
 */
const getCacheKey = (state, location) => {
  const normalLocation = normalizeLocation(location)
  return state.getIn(['cache', 'bookmarkLocation', normalLocation], Immutable.List())
}

/**
 * Given a location, add appState siteKey to cached siteKeys list.
 * Returns new state.
 * @param state Application state
 * @param location {string}
 * @param siteKey {string}
 */
const addCacheKey = (state, location, siteKey) => {
  if (!siteKey || !location) {
    return state
  }

  const normalLocation = normalizeLocation(location)
  const cacheKey = ['cache', 'bookmarkLocation', normalLocation]
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

/**
 * Given a location, remove matching appState siteKeys in cache.
 * Loads cache from appState if it hasn't been loaded yet.
 * @param state Application state
 * @param location {string}
 * @param siteKey {string}
 */
const removeCacheKey = (state, location, siteKey) => {
  if (!siteKey || !location) {
    return state
  }
  const normalLocation = normalizeLocation(location)
  const cacheKey = ['cache', 'bookmarkLocation', normalLocation]
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

module.exports = {
  generateCache,
  getCacheKey,
  addCacheKey,
  removeCacheKey
}
