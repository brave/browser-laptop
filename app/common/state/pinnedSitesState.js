/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const Immutable = require('immutable')
const {STATE_SITES} = require('../../../js/constants/stateConstants')
const urlUtil = require('../../../js/lib/urlutil')
const {makeImmutable, isMap} = require('./immutableUtil')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isMap(state.get(STATE_SITES.PINNED_SITES)), 'state must contain an Immutable.Map of pinnedSites')
  return state
}

const reorderSite = (sites, order) => {
  sites = sites.map((site) => {
    const siteOrder = site.get('order')
    if (siteOrder > order) {
      return site.set('order', siteOrder - 1)
    }
    return site
  })
  return sites
}

const pinnedSiteState = {
  getSites: (state) => {
    state = validateState(state)
    return state.get(STATE_SITES.PINNED_SITES)
  },

  getSite: (state, key) => {
    state = validateState(state)
    return state.getIn([STATE_SITES.PINNED_SITES, key], Immutable.Map())
  },

  /**
   * Adds the specified siteDetail in appState.pinnedSites.
   * @param {Immutable.Map} state The application state Immutable map
   * @param {Immutable.Map} site The siteDetail that we want to add
   */
  addPinnedSite: (state, site) => {
    state = validateState(state)
    const pinnedSitesUtil = require('../lib/pinnedSitesUtil')
    const sites = pinnedSiteState.getSites(state) || Immutable.Map()
    let location
    if (site.has('location')) {
      location = urlUtil.getLocationIfPDF(site.get('location'))
      site = site.set('location', location)
    }

    site = site.set('order', sites.size)

    const key = pinnedSitesUtil.getKey(site)
    // check if key is valid
    // or if key already exists so we do not mutate state unneccessarily
    if (key === null || state.hasIn([STATE_SITES.PINNED_SITES, key])) {
      return state
    }

    if (state.hasIn([STATE_SITES.PINNED_SITES, key])) {
      return state
    }

    state = state.setIn([STATE_SITES.PINNED_SITES, key], site)
    return state
  },

  /**
   * Removes the given pinned site from the pinnedSites
   *
   * @param {Immutable.Map} state The application state Immutable map
   * @param {Immutable.Map} siteDetail The siteDetail to be removed
   * @return {Immutable.Map} The new state Immutable object
   */
  removePinnedSite: (state, siteDetail) => {
    state = validateState(state)
    const pinnedSitesUtil = require('../lib/pinnedSitesUtil')
    const key = pinnedSitesUtil.getKey(siteDetail)
    if (!key) {
      return state
    }

    const stateKey = [STATE_SITES.PINNED_SITES, key]
    let site = state.getIn(stateKey)
    if (!site) {
      return state
    }

    if (siteDetail.get('order') != null) {
      state = state.set(STATE_SITES.PINNED_SITES, reorderSite(pinnedSiteState.getSites(state), siteDetail.get('order')))
    }

    return state.deleteIn(stateKey, site)
  },

  /**
   * Moves the specified pinned site from one position to another
   *
  * @param state The application state Immutable map
   * @param sourceKey The site key to move
   * @param newOrder The new position to move to
   * @return The new state Immutable object
   */
  moveSiteToNewOrder: (state, sourceKey, newOrder, shouldDebug = false) => {
    const sites = state.get(STATE_SITES.PINNED_SITES)
    if (shouldDebug) {
      console.log('moveSiteToNewOrder pinnedSites before', sites.toJS())
    }
    let sourceSite = sites.get(sourceKey, Immutable.Map())
    if (sourceSite.isEmpty() || sourceSite.get('order') === newOrder) {
      if (shouldDebug) {
        console.log('NO CHANGE')
      }
      return state
    }
    const sourceSiteOrder = sourceSite.get('order')
    state = state.set(STATE_SITES.PINNED_SITES, sites.map((site, index) => {
      const siteOrder = site.get('order')
      if (index === sourceKey && siteOrder !== newOrder) {
        return site.set('order', newOrder)
      }
      if (siteOrder >= newOrder && siteOrder < sourceSiteOrder) {
        return site.set('order', siteOrder + 1)
      } else if (siteOrder <= newOrder && siteOrder > sourceSiteOrder) {
        return site.set('order', siteOrder - 1)
      }
      return site
    }))
    if (shouldDebug) {
      console.log('moveSiteToNewOrder pinnedSites after', state.get(STATE_SITES.PINNED_SITES).toJS())
    }
    return state
  }
}

module.exports = pinnedSiteState
