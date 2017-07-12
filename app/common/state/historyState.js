/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const Immutable = require('immutable')
const siteUtil = require('../../../js/state/siteUtil')
const historyUtil = require('../lib/historyUtil')
const urlUtil = require('../../../js/lib/urlutil')
const {makeImmutable, isMap} = require('./immutableUtil')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isMap(state.get('historySites')), 'state must contain an Immutable.Map of historySites')
  return state
}

const historyState = {
  getSites: (state) => {
    state = validateState(state)
    return state.get('historySites', Immutable.Map())
  },

  getSite: (state, key) => {
    state = validateState(state)
    return state.getIn(['historySites', key], Immutable.Map())
  },

  addSite: (state, siteDetail) => {
    let sites = historyState.getSites(state)
    let siteKey = siteUtil.getSiteKey(siteDetail)
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

      siteKey = siteUtil.getSiteKey(siteDetail)
      site = historyUtil.prepareHistoryEntry(siteDetail)
    }

    state = state.setIn(['historySites', siteKey], site)
    return state
  },

  removeSite: (state, siteKey) => {
    // TODO should we remove this only when a tab with this siteKey is not opened
    // if not, we are deleting data that is use for bookmarking
    return state.deleteIn(['historySites', siteKey])
  },

  clearSites: (state) => {
    return state.set('historySites', Immutable.Map())
  },

  updateFavicon: (state, siteDetails, favIcon) => {
    const historyKey = siteUtil.getSiteKey(siteDetails)
    if (historyKey == null) {
      return state
    }

    let historyItem = historyState.getSite(state, historyKey)
    if (historyItem.isEmpty()) {
      return state
    }

    historyItem = historyItem.set('favicon', favIcon)

    return state.setIn(['historySites', historyKey], historyItem)
  }
}

module.exports = historyState
