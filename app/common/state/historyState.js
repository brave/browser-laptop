/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const Immutable = require('immutable')
const {STATE_SITES} = require('../../../js/constants/stateConstants')
const historyUtil = require('../lib/historyUtil')
const urlUtil = require('../../../js/lib/urlutil')
const {makeImmutable, isMap} = require('./immutableUtil')
const shouldLogWarnings = process.env.NODE_ENV !== 'production'

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isMap(state.get(STATE_SITES.HISTORY_SITES)), 'state must contain an Immutable.Map of historySites')
  return state
}

const historyState = {
  getSites: (state) => {
    state = validateState(state)
    return state.get(STATE_SITES.HISTORY_SITES, Immutable.Map())
  },

  getSite: (state, key) => {
    state = validateState(state)
    return state.getIn([STATE_SITES.HISTORY_SITES, key], Immutable.Map())
  },

  hasSite: (state, key) => {
    state = validateState(state)
    return state.hasIn([STATE_SITES.HISTORY_SITES, key], Immutable.Map())
  },

  addSite: (state, siteDetail) => {
    if (!siteDetail) {
      if (shouldLogWarnings) {
        console.error('historyState:addSite siteDetail was null')
      }
      return state
    }
    let sites = historyState.getSites(state)
    let siteKey = historyUtil.getKey(siteDetail)
    if (!siteKey) {
      if (shouldLogWarnings) {
        console.log('historyState:addSite siteKey was null for siteDetail:', (siteDetail && siteDetail.toJS) ? siteDetail.toJS() : siteDetail)
      }
      return state
    }
    siteDetail = makeImmutable(siteDetail)

    const oldSite = sites.get(siteKey)
    let site
    if (oldSite) {
      site = historyUtil.mergeSiteDetails(oldSite, siteDetail)
    } else {
      let location
      if (siteDetail.has('location')) {
        location = urlUtil.getLocationIfPDF(siteDetail.get('location'))
        siteDetail = siteDetail.set('location', location)
      }

      siteKey = historyUtil.getKey(siteDetail)
      site = historyUtil.prepareHistoryEntry(siteDetail)
    }

    state = state.setIn([STATE_SITES.HISTORY_SITES, siteKey], site)
    return state
  },

  removeSite: (state, siteKey) => {
    return state.deleteIn([STATE_SITES.HISTORY_SITES, siteKey])
  },

  clearSites: (state) => {
    return state.set(STATE_SITES.HISTORY_SITES, Immutable.Map())
  },

  updateFavicon: (state, siteDetails, favIcon) => {
    const historyKey = historyUtil.getKey(siteDetails)
    if (historyKey == null) {
      return state
    }

    let historyItem = historyState.getSite(state, historyKey)
    if (historyItem.isEmpty()) {
      return state
    }

    historyItem = historyItem.set('favicon', favIcon)

    return state.setIn([STATE_SITES.HISTORY_SITES, historyKey], historyItem)
  }
}

module.exports = historyState
