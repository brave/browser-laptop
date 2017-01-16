/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const {makeImmutable} = require('./immutableUtil')
const siteUtil = require('../../../js/state/siteUtil')
const {isSourceAboutUrl} = require('../../../js/lib/appUrlUtil')
const aboutNewTabMaxEntries = 100

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
      const hostname = require('url').parse(site.get('location')).hostname
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
/**
 * topSites are defined by users. Pinned sites are attached to their positions
 * in the grid, and the non pinned indexes are populated with newly accessed sites
 */
const getTopSites = (state) => {
  // remove folders; sort by visit count; enforce a max limit
  const sites = (state.get('sites') || new Immutable.List())
    .filter((site) => !siteUtil.isFolder(site))
    .filter((site) => !siteUtil.isImportedBookmark(site))
    .filter((site) => !isSourceAboutUrl(site.get('location')))
    .sort(sortCountDescending)
    .slice(0, aboutNewTabMaxEntries)

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

  return gridSites.filter((site) => site != null)
}

const aboutNewTabState = {
  maxSites: aboutNewTabMaxEntries,

  getSites: (state) => {
    return state.getIn(['about', 'newtab', 'sites'])
  },

  mergeDetails: (state, props) => {
    state = makeImmutable(state)
    if (!props) {
      return state
    }

    state = state.mergeIn(['about', 'newtab'], props.newTabPageDetail)
    return state.setIn(['about', 'newtab', 'updatedStamp'], new Date().getTime())
  },

  setSites: (state) => {
    state = makeImmutable(state)

    // return a filtered version of the sites array
    state = state.setIn(['about', 'newtab', 'sites'], getTopSites(state))
    return state.setIn(['about', 'newtab', 'updatedStamp'], new Date().getTime())
  }
}

module.exports = aboutNewTabState
