/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const {makeImmutable} = require('./immutableUtil')
const siteUtil = require('../../../js/state/siteUtil')

const excludeSiteDetail = (siteDetail) => {
  return !siteUtil.isBookmark(siteDetail) && !siteUtil.isHistoryEntry(siteDetail)
}

const aboutNewTabState = {
  mergeDetails: (state, props) => {
    state = makeImmutable(state)
    if (!props) {
      return state
    }

    state = state.mergeIn(['about', 'newtab'], props.newTabPageDetail)
    return state.setIn(['about', 'newtab', 'updatedStamp'], new Date().getTime())
  },

  addSite: (state, props) => {
    state = makeImmutable(state)
    if (!props) {
      return state
    }

    // Add timestamp if missing (ex: this is a visit, not a bookmark)
    let siteDetail = makeImmutable(props.siteDetail)
    siteDetail = siteDetail.set('lastAccessedTime', siteDetail.get('lastAccessedTime') || new Date().getTime())

    // Only bookmarks and history items should be considered
    if (excludeSiteDetail(siteDetail)) {
      return state
    }

    // Keep track of the last 18 visited sites
    let sites = state.getIn(['about', 'newtab', 'sites']) || new Immutable.Map()
    sites = sites.take(18)
    // TODO(cezaraugusto): Sort should respect unshift and don't prioritize bookmarks
    // |
    // V
    // .sort(suggestion.sortByAccessCountWithAgeDecay)
    sites = siteUtil.addSite(sites, siteDetail, props.tag, props.originalSiteDetail)
    state = state.setIn(['about', 'newtab', 'sites'], sites)
    return state.setIn(['about', 'newtab', 'updatedStamp'], new Date().getTime())
  },

  removeSite: (state, props) => {
    state = makeImmutable(state)
    if (!props) {
      return state
    }

    // Only bookmarks and history items should be considered
    let siteDetail = makeImmutable(props.siteDetail)
    if (excludeSiteDetail(siteDetail)) {
      return state
    }

    // Remove tags if this is a history item.
    // NOTE: siteUtil.removeSite won't delete the entry unless tags are missing
    if (siteDetail.get('tags') && siteDetail.get('tags').size === 0) {
      siteDetail = siteDetail.delete('tags')
    }

    const sites = state.getIn(['about', 'newtab', 'sites'])
    state = state.setIn(['about', 'newtab', 'sites'], siteUtil.removeSite(sites, siteDetail, undefined))
    return state.setIn(['about', 'newtab', 'updatedStamp'], new Date().getTime())
  },

  updateSiteFavicon: (state, props) => {
    state = makeImmutable(state)
    props = makeImmutable(props)
    if (!props || !props.get('frameProps') || !props.getIn(['frameProps', 'location'])) {
      return state
    }

    const sites = state.getIn(['about', 'newtab', 'sites'])
    const sitesWithFavicon = siteUtil.updateSiteFavicon(sites, props.getIn(['frameProps', 'location']), props.get('favicon'))
    state = state.setIn(['about', 'newtab', 'sites'], sitesWithFavicon)
    return state.setIn(['about', 'newtab', 'updatedStamp'], new Date().getTime())
  }
}

module.exports = aboutNewTabState
