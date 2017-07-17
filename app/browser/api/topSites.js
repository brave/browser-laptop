/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const appActions = require('../../../js/actions/appActions')
const debounce = require('../../../js/lib/debounce')
const siteUtil = require('../../../js/state/siteUtil')
const {isSourceAboutUrl} = require('../../../js/lib/appUrlUtil')
const aboutNewTabMaxEntries = 100
let appStore

let minCountOfTopSites
let minAccessOfTopSites

const compareSites = (site1, site2) => {
  if (!site1 || !site2) return false
  return site1.get('location') === site2.get('location') &&
    site1.get('partitionNumber') === site2.get('partitionNumber')
}

const pinnedTopSites = (state) => {
  return (state.getIn(['about', 'newtab', 'pinnedTopSites']) || Immutable.List()).setSize(18)
}

const ignoredTopSites = (state) => {
  return state.getIn(['about', 'newtab', 'ignoredTopSites']) || Immutable.List()
}

const isPinned = (state, siteProps) => {
  return pinnedTopSites(state).filter((site) => compareSites(site, siteProps)).size > 0
}

const isIgnored = (state, siteProps) => {
  return ignoredTopSites(state).filter((site) => compareSites(site, siteProps)).size > 0
}

const sortCountDescending = (left, right) => {
  const leftCount = left.get('count') || 0
  const rightCount = right.get('count') || 0
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

const removeDuplicateDomains = (list) => {
  const siteDomains = new Set()
  return list.filter((site) => {
    if (!site.get('location')) {
      return false
    }
    try {
      const hostname = require('../../common/urlParse')(site.get('location')).hostname
      if (!siteDomains.has(hostname)) {
        siteDomains.add(hostname)
        return true
      }
    } catch (e) {
      console.log('Error parsing hostname: ', e)
    }
    return false
  })
}

const calculateTopSites = (clearCache) => {
  if (clearCache) {
    clearTopSiteCacheData()
  }
  startCalculatingTopSiteData()
}

/**
 * TopSites are defined by users for the new tab page. Pinned sites are attached to their positions
 * in the grid, and the non pinned indexes are populated with newly accessed sites
 */
const startCalculatingTopSiteData = debounce(() => {
  if (!appStore) {
    appStore = require('../../../js/stores/appStore')
  }
  const state = appStore.getState()
  // remove folders; sort by visit count; enforce a max limit
  const sites = (state.get('sites') ? state.get('sites').toList() : new Immutable.List())
    .filter((site) => !siteUtil.isFolder(site) &&
      !siteUtil.isImportedBookmark(site) &&
      !isSourceAboutUrl(site.get('location')) &&
      (minCountOfTopSites === undefined || (site.get('count') || 0) >= minCountOfTopSites) &&
      (minAccessOfTopSites === undefined || (site.get('lastAccessedTime') || 0) >= minAccessOfTopSites))
    .sort(sortCountDescending)
    .slice(0, aboutNewTabMaxEntries)

  for (let i = 0; i < sites.size; i++) {
    const count = sites.getIn([i, 'count']) || 0
    const access = sites.getIn([i, 'lastAccessedTime']) || 0
    if (minCountOfTopSites === undefined || count < minCountOfTopSites) {
      minCountOfTopSites = count
    }
    if (minAccessOfTopSites === undefined || access < minAccessOfTopSites) {
      minAccessOfTopSites = access
    }
  }

  // Filter out pinned and ignored sites
  let unpinnedSites = sites.filter((site) => !(isPinned(state, site) || isIgnored(state, site)))
  unpinnedSites = removeDuplicateDomains(unpinnedSites)

  // Merge the pinned and unpinned lists together
  // Pinned items have priority because the position is important
  let gridSites = pinnedTopSites(state).map((pinnedSite) => {
    // Fetch latest siteDetail objects from appState.sites using location/partition
    if (pinnedSite) {
      const matches = sites.filter((site) => compareSites(site, pinnedSite))
      if (matches.size > 0) return matches.first()
    }
    // Default to unpinned items
    const firstSite = unpinnedSites.first()
    unpinnedSites = unpinnedSites.shift()
    return firstSite
  })

  // Include up to [aboutNewTabMaxEntries] entries so that folks
  // can ignore sites and have new items fill those empty spaces
  if (unpinnedSites.size > 0) {
    gridSites = gridSites.concat(unpinnedSites)
  }

  const finalData = gridSites.filter((site) => site != null)
  appActions.topSiteDataAvailable(finalData)
}, 5 * 1000)

const clearTopSiteCacheData = () => {
  minCountOfTopSites = undefined
  minAccessOfTopSites = undefined
}

module.exports = {
  calculateTopSites,
  clearTopSiteCacheData,
  aboutNewTabMaxEntries
}
