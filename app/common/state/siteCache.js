/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const Immutable = require('immutable')
const siteUtil = require('../../../js/state/siteUtil')
const appUrlUtil = require('../../../js/lib/appUrlUtil')
const historyCache = require('./historyCache')
const UrlUtil = require('../../../js/lib/urlutil')

const normalizeLocation = (location) => {
  const sourceAboutUrl = appUrlUtil.getSourceAboutUrl(location)
  if (sourceAboutUrl) {
    return sourceAboutUrl
  }
  return UrlUtil.getLocationIfPDF(location)
}

module.exports.loadSiteKeyCaches = (state) => {
  const shouldCacheLocation = !state.get('locationSiteKeysCache')
  if (shouldCacheLocation) {
    state = state.set('locationSiteKeysCache', new Immutable.Map())
  }
  const cacheLocation = (site, siteKey) => {
    const location = siteUtil.getLocationFromSiteKey(siteKey)
    if (!location) {
      return
    }
    state = addLocationSiteKey(state, location, siteKey)
  }
  state.get('sites').forEach((site, siteKey) => {
    if (shouldCacheLocation) {
      cacheLocation(site, siteKey)
    }
    historyCache.addSiteKey(siteKey, site)
  })
  return state
}

/**
 * Given a location, get matching appState siteKeys based on cache.
 * @param state Application state
 * @param location {string}
 * @return {Immutable.List<string>|null} siteKeys including this location.
 */
module.exports.getLocationSiteKeys = (state, location) => {
  const normalLocation = normalizeLocation(location)
  return state.getIn(['locationSiteKeysCache', normalLocation])
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
  const normalLocation = normalizeLocation(location)
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
  const normalLocation = normalizeLocation(location)
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
