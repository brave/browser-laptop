/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const appActions = require('../../../js/actions/appActions')
const debounce = require('../../../js/lib/debounce')
const historyState = require('../../common/state/historyState')
const bookmarkLocationCache = require('../../common/cache/bookmarkLocationCache')
const newTabData = require('../../../js/data/newTabData')
const {isSourceAboutUrl} = require('../../../js/lib/appUrlUtil')
const aboutNewTabMaxEntries = 18
let appStore

let minCountOfTopSites
let minAccessOfTopSites
const staticData = Immutable.fromJS(newTabData.topSites)

const pinnedTopSites = (state) => {
  return state.getIn(['about', 'newtab', 'pinnedTopSites'], Immutable.List())
}

const ignoredTopSites = (state) => {
  return state.getIn(['about', 'newtab', 'ignoredTopSites'], Immutable.List())
}

const isPinned = (state, siteKey) => {
  return pinnedTopSites(state).find(site => site.get('key') === siteKey)
}

const isIgnored = (state, siteKey) => {
  return ignoredTopSites(state).includes(siteKey)
}

const sortCountDescending = (left, right) => {
  const leftCount = left.get('count', 0)
  const rightCount = right.get('count', 0)
  if (leftCount < rightCount) {
    return 1
  }
  if (leftCount > rightCount) {
    return -1
  }
  if (left.get('lastAccessedTime') < right.get('lastAccessedTime')) {
    return 1
  }
  if (left.get('lastAccessedTime') > right.get('lastAccessedTime')) {
    return -1
  }
  return 0
}

const calculateTopSites = (clearCache, withoutDebounce = false) => {
  if (clearCache) {
    clearTopSiteCacheData()
  }
  if (withoutDebounce) {
    getTopSiteData()
  } else {
    debouncedGetTopSiteData()
  }
}

const getTopSiteData = () => {
  if (!appStore) {
    appStore = require('../../../js/stores/appStore')
  }
  const state = appStore.getState()
  // remove folders; sort by visit count; enforce a max limit
  let sites = historyState.getSites(state)
    .filter((site, key) => !isSourceAboutUrl(site.get('location')) &&
      !isPinned(state, key) &&
      !isIgnored(state, key) &&
      (minCountOfTopSites === undefined || (site.get('count') || 0) >= minCountOfTopSites) &&
      (minAccessOfTopSites === undefined || (site.get('lastAccessedTime') || 0) >= minAccessOfTopSites)
    )
    .sort(sortCountDescending)
    .slice(0, aboutNewTabMaxEntries)
    .map((site, key) => {
      const bookmarkKey = bookmarkLocationCache.getCacheKey(state, site.get('location'))

      site = site.set('bookmarked', !bookmarkKey.isEmpty())
      site = site.set('key', key)
      return site
    })
    .toList()

  for (let i = 0; i < sites.size; i++) {
    const count = sites.getIn([i, 'count'], 0)
    const access = sites.getIn([i, 'lastAccessedTime'], 0)
    if (minCountOfTopSites === undefined || count < minCountOfTopSites) {
      minCountOfTopSites = count
    }
    if (minAccessOfTopSites === undefined || access < minAccessOfTopSites) {
      minAccessOfTopSites = access
    }
  }

  if (sites.size < 18) {
    const preDefined = staticData
      .filter((site) => {
        return !isPinned(state, site.get('key')) && !isIgnored(state, site.get('key'))
      })
      .map(site => {
        const bookmarkKey = bookmarkLocationCache.getCacheKey(state, site.get('location'))
        return site.set('bookmarked', !bookmarkKey.isEmpty())
      })
    sites = sites.concat(preDefined)
  }

  appActions.topSiteDataAvailable(sites)
}

/**
 * TopSites are defined by users for the new tab page. Pinned sites are attached to their positions
 * in the grid, and the non pinned indexes are populated with newly accessed sites
 */
const debouncedGetTopSiteData = debounce(() => getTopSiteData(), 5 * 1000)

const clearTopSiteCacheData = () => {
  minCountOfTopSites = undefined
  minAccessOfTopSites = undefined
}

module.exports = {
  calculateTopSites,
  clearTopSiteCacheData,
  aboutNewTabMaxEntries
}
