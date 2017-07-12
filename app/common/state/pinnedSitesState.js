/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const Immutable = require('immutable')
const siteUtil = require('../../../js/state/siteUtil')
const urlUtil = require('../../../js/lib/urlutil')
const {makeImmutable, isMap} = require('./immutableUtil')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isMap(state.get('pinnedSites')), 'state must contain an Immutable.Map of pinnedSites')
  return state
}

const pinnedSiteState = {
  getSites: (state) => {
    state = validateState(state)
    return state.get('pinnedSites')
  },

  /**
   * Adds the specified siteDetail in appState.pinnedSites.
   * @param {Immutable.Map} state The application state Immutable map
   * @param {Immutable.Map} site The siteDetail that we want to add
   */
  addPinnedSite: (state, site) => {
    state = validateState(state)
    const sites = pinnedSiteState.getSites(state) || Immutable.Map()
    let location
    if (site.has('location')) {
      location = urlUtil.getLocationIfPDF(site.get('location'))
      site = site.set('location', location)
    }

    site = site.set('order', sites.size)

    const key = siteUtil.getSiteKey(site)
    if (key === null) {
      return state
    }

    state = state.setIn(['pinnedSites', key], site)
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
    const key = siteUtil.getSiteKey(siteDetail)
    if (!key) {
      return state
    }

    const stateKey = ['pinnedSites', key]
    let site = state.getIn(stateKey)
    if (!site) {
      return state
    }

    // TODO update order, so that is up to date

    return state.deleteIn(stateKey, site)
  },

  /**
   * Moves the specified pinned site from one location to another
   *
   * @param state The application state Immutable map
   * @param sourceKey The site key to move
   * @param destinationKey The site key to move to
   * @param prepend Whether the destination detail should be prepended or not
   * @return The new state Immutable object
   */
  reOrderSite: (state, sourceKey, destinationKey, prepend) => {
    state = validateState(state)
    let sites = state.get('pinnedSites')
    let sourceSite = sites.get(sourceKey, Immutable.Map())
    const destinationSite = sites.get(destinationKey, Immutable.Map())

    if (sourceSite.isEmpty()) {
      return state
    }

    const sourceSiteIndex = sourceSite.get('order')
    const destinationSiteIndex = destinationSite.get('order')
    let newIndex = destinationSiteIndex + (prepend ? 0 : 1)
    if (destinationSiteIndex > sourceSiteIndex) {
      --newIndex
    }

    state = state.set('pinnedSites', state.get('pinnedSites').map((site, index) => {
      const siteOrder = site.get('order')
      if (index === sourceKey) {
        return site
      }

      if (siteOrder >= newIndex && siteOrder < sourceSiteIndex) {
        return site.set('order', siteOrder + 1)
      } else if (siteOrder <= newIndex && siteOrder > sourceSiteIndex) {
        return site.set('order', siteOrder - 1)
      }

      return site
    }))

    sourceSite = sourceSite.set('order', newIndex)
    return state.setIn(['pinnedSites', sourceKey], sourceSite)
  }
}

module.exports = pinnedSiteState
