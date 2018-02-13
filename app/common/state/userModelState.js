/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// -SCL COMMENTS BELOW
// This was written as "aspirational." Most has not been tested
// State should capture
// 1. searching state (url, score, search values, time) -note these are now hard coded to be score = 1 at google, 0 every other time
// 2. is user shopping now (url, score, search values, time) -same as searching except hard coded to be score = 1 at amazon, 0 every other url
// 3. ad served, time, value (3 month buffer)
// 4. error (something went wrong)
// 5. page classification scores, score, url, (time) (3 month buffer)
// 6. userModel unidle time (last time browser woke up)
// at present, searching and shopping states need to be initialized and properly set
// there is still missing something in the reducer which calls them at the right time,
// unless we want to just overload the APP_TEXT_SCRAPER_DATA_AVAILABLE section and test for all shoppiness there
// (I think this will work and is the right thing to do)
// TODO INCOMPLETES; something which logs the AUTOFILL events, page, date, moving average score up to that autofill, and previous AUTOFILL events/pages/score
// END SCL COMMENTS

'use strict'

const Immutable = require('immutable')
const assert = require('assert')

// utilities
const {makeImmutable, isMap} = require('../../common/state/immutableUtil')
const urlUtil = require('../../../js/lib/urlutil')

const maxRowsInPageScoreHistory = 5

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isMap(state.get('userModel')), 'state must contain an Immutable.Map of userModel')
  return state
}

const userModelState = {
  setUserModelValue: (state, key, value) => {
    state = validateState(state)
    if (key == null) {
      return state
    }

    return state.setIn(['userModel', key], value)
  },

  getUserModelValue: (state, key) => {
    state = validateState(state)
    return state.getIn(['userModel', key])
  },

  appendPageScoreToHistoryAndRotate: (state, pageScore) => {
    state = validateState(state)
    const stateKey = ['userModel', 'pageScoreHistory']

    let previous = state.getIn(stateKey)

    if (!Immutable.List.isList(previous)) {
      console.warn('Previously stored page score history is not a List.')
      previous = Immutable.List()
    }

    let ringbuf = previous.push(Immutable.List(pageScore))

    let n = ringbuf.size

    // this is the "rolling window"
    // in general, this is triggered w/ probability 1
    if (n > maxRowsInPageScoreHistory) {
      let diff = n - maxRowsInPageScoreHistory
      ringbuf = ringbuf.slice(diff)
    }

    state = state.setIn(stateKey, ringbuf)

    return state
  },

  getPageScoreHistory: (state, mutable = false) => {
    state = validateState(state)
    let history = state.getIn(['userModel', 'pageScoreHistory']) || []

    if (!mutable) {
      return history // immutable version
    }

    return history.toJS() // mutable version
  },

  removeAllHistory: (state) => {
    state = validateState(state)
    state = state.setIn(['userModel'], Immutable.Map())
    return state
  },

  // later maybe include a search term and history
  flagSearchState: (state, url, score) => {
    state = validateState(state)
    if (url == null || !urlUtil.isURL(url)) { // bum url; log this?
      return state
    }

    const date = new Date().getTime()
    state = state
      .setIn(['userModel', 'searchActivity'], true)
      .setIn(['userModel', 'searchUrl'], url)  // can we check this here?
      .setIn(['userModel', 'score'], score)
      .setIn(['userModel', 'lastSearchTime'], date)

    return state
  },

  // user has stopped searching for things
  unFlagSearchState: (state, url) => {
    state = validateState(state)
    if (url == null || !urlUtil.isURL(url)) { // bum url; log this?
      return state
    }

    // if you're still at the same url, you're still searching; maybe this should log an error
    if (state.getIn(['userModel', 'searchUrl']) === url) {
      return state
    }

    const date = new Date().getTime()
    state = state
      .setIn(['userModel', 'searchActivity'], false) // toggle off date probably more useful
      .setIn(['userModel', 'lastSearchTime'], date)

    return state
  },

  // user is visiting a shopping website
  flagShoppingState: (state, url) => {
    state = validateState(state)
    const date = new Date().getTime()

    state = state
      .setIn(['userModel', 'shopActivity'], true) // never hit; I think design is wrong
      .setIn(['userModel', 'shopUrl'], url)
      .setIn(['userModel', 'lastShopTime'], date)

    return state
  },

  getSearchState: (state) => {
    state = validateState(state)
    return state.getIn(['userModel', 'searchActivity'])
  },

  getShoppingState: (state) => {
    state = validateState(state)
    return state.getIn(['userModel', 'shopActivity'])
  },

  unFlagShoppingState: (state) => {
    state = validateState(state)
    state = state.setIn(['userModel', 'shopActivity'], false)
    return state
  },

  flagUserBuyingSomething: (state, url) => {
    state = validateState(state)
    const date = new Date().getTime()
    state = state
      .setIn(['userModel', 'purchaseTime'], date)
      .setIn(['userModel', 'purchaseUrl'], url)
      .setIn(['userModel', 'purchaseActive'], true)

    return state
  },

  setUrlActive: (state, url) => {
    state = validateState(state)
    if (url == null || !urlUtil.isURL(url)) { // bum url; log this?
      return state
    }

    return state.setIn(['userModel', 'url'], url)
  },

  setUrlClass: (state, url, pageClass) => {
    state = validateState(state)
    if (url == null || pageClass == null || !urlUtil.isURL(url)) { // bum url; log this?
      return state
    }

    const date = new Date().getTime()
    state = state
      .setIn(['userModel', 'updated'], date)
      .setIn(['userModel', 'url'], url)
      .setIn(['userModel', 'pageClass'], pageClass)

    return state
  },

  // this gets called when an ad is served, so we know the last time
  // we served what
  // potential fun stuff to put here; length of ad-view, some kind of
  // signatures on ad-hash and length of ad view
  setServedAd: (state, adServed, adClass) => {
    state = validateState(state)
    if (adServed == null) {
      return state
    }

    const date = new Date().getTime()
    state = state
      .setIn(['userModel', 'lastAdTime'], date)
      .setIn(['userModel', 'adServed'], adServed)
      .setIn(['userModel', 'adClass'], adClass)

    return state
  },

  getLastServedAd: (state) => {
    state = validateState(state)
    const result = {
      lastAdTime: state.getIn(['userModel', 'lastAdTime']),
      lastAdServed: state.getIn(['userModel', 'adServed']),
      lastAdClass: state.getIn(['userModel', 'adClass'])
    }

    return Immutable.fromJS(result) || Immutable.Map()
  },

  setLastUserActivity: (state) => {
    state = validateState(state)
    const date = new Date().getTime()
    state = state.setIn(['userModel', 'lastUserActivity'], date)
    return state
  },

  setAdFrequency: (state, freq) => {
    state = validateState(state)
    state = state.setIn(['userModel', 'adFrequency'], freq)
    return state
  },

  setLastUserIdleStopTime: (state) => {
    state = validateState(state)
    const date = new Date().getTime()
    state = state.setIn(['userModel', 'lastUserIdleStopTime'], date)
    return state
  },

  setUserModelError: (state, error, caller) => {
    state = validateState(state)

    state = state.setIn(['userModel', 'error'], Immutable.fromJS({
      caller: caller,
      error: error
    }))

    return state
  }
}

module.exports = userModelState
