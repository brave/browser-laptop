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

const settings = require('../../../js/constants/settings')
const getSetting = require('../../../js/settings').getSetting

// Utils
const {makeImmutable, makeJS, isMap} = require('../../common/state/immutableUtil')
const urlUtil = require('../../../js/lib/urlutil')

const maxRowsInPageScoreHistory = 5
const maxRowsInAdsShownHistory = 99

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isMap(state.get('userModel')), 'state must contain an Immutable.Map of userModel')
  return state
}

const unixTimeNowSeconds = function () {
  return Math.round(+new Date() / 1000)
}

const historyRespectsRollingTimeConstraint = function (history, secondsWindow, allowableAdCount) {
  let n = history.size
  let now = unixTimeNowSeconds()
  let recentCount = 0

  for (let i = 0; i < n; i++) {
    let timeOfAd = history.get(i)
    let delta = now - timeOfAd
    if (delta < secondsWindow) {
      recentCount++
    }
  }

  if (recentCount > allowableAdCount) {
    return false
  }

  return true
}

const appendToRingBufferUnderKey = (state, key, item, maxRows) => {
  state = validateState(state)

  let previous = state.getIn(key)

  if (!Immutable.List.isList(previous)) {
    console.warn('Previously stored page score history is not a List.')
    previous = Immutable.List()
  }

  let ringbuf = previous.push(item)

  let n = ringbuf.size

  // this is the "rolling window"
  // in general, this is triggered w/ probability 1
  if (n > maxRows) {
    let diff = n - maxRows
    ringbuf = ringbuf.slice(diff)
  }

  state = state.setIn(key, ringbuf)

  return state
}

const getUserSurveyQueue = (state) => {
  return state.getIn(['userModel', 'userSurveyQueue']) || Immutable.List()
}

const setUserSurveyQueue = (state, queue) => {
  return state.setIn(['userModel', 'userSurveyQueue'], queue)
}

const getReportingEventQueue = (state) => {
  return state.getIn(['userModel', 'reportingEventQueue']) || Immutable.List()
}

const setReportingEventQueue = (state, queue) => {
  return state.setIn(['userModel', 'reportingEventQueue'], queue)
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
    const stateKey = ['userModel', 'pageScoreHistory']
    const wrappedScore = Immutable.List(pageScore)
    return appendToRingBufferUnderKey(state, stateKey, wrappedScore, maxRowsInPageScoreHistory)
  },

  appendAdShownToAdHistory: (state) => {
    const stateKey = ['userModel', 'adsShownHistory']
    var unixTime = unixTimeNowSeconds()
    return appendToRingBufferUnderKey(state, stateKey, unixTime, maxRowsInAdsShownHistory)
  },

  allowedToShowAdBasedOnHistory: (state) => {
    const history = state.getIn(['userModel', 'adsShownHistory']) || []

    const hourWindow = 60 * 60
    const dayWindow = 24 * hourWindow

    const hourAllowed = getSetting(settings.ADS_PER_HOUR, state.settings)
    const dayAllowed = getSetting(settings.ADS_PER_DAY, state.settings)

    const respectsHourLimit = historyRespectsRollingTimeConstraint(history, hourWindow, hourAllowed)
    const respectsDayLimit = historyRespectsRollingTimeConstraint(history, dayWindow, dayAllowed)
    if (!respectsHourLimit || !respectsDayLimit) {
      return false
    }

    return true
  },

  getPageScoreHistory: (state, mutable = false) => {
    state = validateState(state)
    let history = state.getIn(['userModel', 'pageScoreHistory']) || []

    if (!mutable) {
      return makeImmutable(history) // immutable version
    }

    return makeJS(history) // mutable version
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
  },

  setSSID: (state, value) => {
    if (!value || value.length === 0) {
      value = 'unknown'
    }
    const current = userModelState.getSSID(state)
    state = state.setIn(['userModel', 'currentSSID'], value)

    if (current !== value) {
      const place = userModelState.getAdPlace(state)
      let newValue = 'UNDISCLOSED'
      if (place) {
        newValue = place
      }
      state = state.setIn(['settings', settings.ADS_PLACE], newValue)
    }

    return state
  },

  getSSID: (state) => {
    return state.getIn(['userModel', 'currentSSID']) || null
  },

  getAdPlace: (state) => {
    const ssid = userModelState.getSSID(state)
    const places = state.getIn(['userModel', 'places'])
    if (!places || !ssid || !isMap(places)) {
      return null
    }

    return places.get(ssid) || null
  },

  setAdPlace: (state, place) => {
    const ssid = userModelState.getSSID(state)
    if (!ssid) {
      return state
    }

    return state.setIn(['userModel', 'places', ssid], place)
  },

  getAdEnabledValue: (state) => {
    return state.getIn(['settings', settings.ADS_ENABLED])
  },

  getAdUUID: (state) => {
    // returns string or undefined
    return state.getIn(['userModel', 'adUUID'])
  },

  setAdUUID: (state, uuid) => {
    return state.setIn(['userModel', 'adUUID'], uuid)
  },

  appendToUserSurveyQueue: (state, survey) => {
    let q = getUserSurveyQueue(state)

    if (!Immutable.List.isList(q)) q = Immutable.List()

    return setUserSurveyQueue(state, q.push(Immutable.Map(survey)))
  },

  getUserSurveyQueue: getUserSurveyQueue,

  setUserSurveyQueue: setUserSurveyQueue,

  appendToReportingEventQueue: (state, event) => {
    let q = getReportingEventQueue(state)

    if (!Immutable.List.isList(q)) q = Immutable.List()

    return setReportingEventQueue(state, q.push(Immutable.Map(event)))
  },

  flushReportingEventQueue: (state) => {
    return setReportingEventQueue(state, [])
  },

  getReportingEventQueue: getReportingEventQueue,

  setReportingEventQueue: setReportingEventQueue

}

module.exports = userModelState
