/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const {makeImmutable, removeDuplicatedEntriesFromList} = require('./immutableUtil')
const topSites = require('../../browser/api/topSites')
const newTabData = require('../../../js/data/newTabData')
/**
 * topSites are defined by users. Pinned sites are attached to their positions
 * in the grid, and the non pinned indexes are populated with newly accessed sites
 */
const defaultPinnedSite = Immutable.fromJS(newTabData.pinnedTopSites)
const aboutNewTabState = {
  getSites: (state) => {
    return state.getIn(['about', 'newtab', 'sites'])
  },

  getPinnedTopSites: (state) => {
    // add same number as fallback to avoid race condition on startup
    const maxEntries = topSites.aboutNewTabMaxEntries || 100

    // we need null spaces in order to proper pin a topSite in the right position.
    // so let's set it to the same number as max new tab entries.
    return state
      .getIn(['about', 'newtab', 'pinnedTopSites'], Immutable.List())
      .setSize(maxEntries)
  },

  getIgnoredTopSites: (state) => {
    return state.getIn(['about', 'newtab', 'ignoredTopSites'], Immutable.List())
  },

  mergeDetails: (state, props) => {
    state = makeImmutable(state)
    if (!props) {
      return state
    }
    if (state.getIn(['about', 'newtab', 'pinnedTopSites']).isEmpty()) {
      // list is only empty if there's no pinning interaction.
      // in this case we include the default pinned top sites list
      state = state.setIn(['about', 'newtab', 'pinnedTopSites'], defaultPinnedSite)
    } else {
      // if list is not empty there's a considerable chance that
      // due to a bug in previous versions (see #12941) the user
      // is not able to use topSites as there are duplicated pinned sites.
      // in this case, dedupe them all
      const pinnedTopSites = aboutNewTabState.getPinnedTopSites(state)
      state = state.setIn(
        ['about', 'newtab', 'pinnedTopSites'],
        removeDuplicatedEntriesFromList(pinnedTopSites, 'location', true)
      )
    }
    state = state.mergeIn(['about', 'newtab'], props.newTabPageDetail)
    return state.setIn(['about', 'newtab', 'updatedStamp'], new Date().getTime())
  },

  setSites: (state, topSites) => {
    if (!topSites) {
      return state
    }
    topSites = makeImmutable(topSites)
    state = state.setIn(['about', 'newtab', 'sites'], topSites)
    return state.setIn(['about', 'newtab', 'updatedStamp'], new Date().getTime())
  },

  clearTopSites: (state) => {
    state = makeImmutable(state)

    state = state.setIn(['about', 'newtab', 'sites'], makeImmutable([]))
    return state.setIn(['about', 'newtab', 'updatedStamp'], new Date().getTime())
  },

  getData: (state) => {
    return state.getIn(['about', 'newtab'], Immutable.Map())
  }
}

module.exports = aboutNewTabState
