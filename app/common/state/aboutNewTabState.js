/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {makeImmutable} = require('./immutableUtil')

/**
 * topSites are defined by users. Pinned sites are attached to their positions
 * in the grid, and the non pinned indexes are populated with newly accessed sites
 */

const aboutNewTabState = {
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

  setSites: (state, topSites) => {
    if (!topSites) {
      return state
    }
    topSites = makeImmutable(topSites)
    state = state.setIn(['about', 'newtab', 'sites'], topSites)
    return state.setIn(['about', 'newtab', 'updatedStamp'], new Date().getTime())
  }
}

module.exports = aboutNewTabState
