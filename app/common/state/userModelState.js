/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const assert = require('assert')

// Actions
const appActions = require('../../../js/actions/appActions')

// Constants
const settings = require('../../../js/constants/settings')

// State
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
  const n = history.size
  const now = unixTimeNowSeconds()
  let recentCount = 0

  for (let i = 0; i < n; i++) {
    const timeOfAd = history.get(i)

    if ((now - timeOfAd) < secondsWindow) recentCount++
  }

  return (recentCount <= allowableAdCount)
}

const appendToRingBufferUnderKey = (state, key, item, maxRows) => {
  if (!userModelState.getAdEnabledValue(state)) return state

  state = validateState(state)

  let previous = state.getIn(key)

  // it's undefined...
  if (!Immutable.List.isList(previous)) previous = Immutable.List()

  let ringbuf = previous.push(item)
  const n = ringbuf.size

  // this is the "rolling window"
  // in general, this is triggered w/ probability 1
  if (n > maxRows) ringbuf = ringbuf.slice(n - maxRows)

  return state.setIn(key, ringbuf)
}

const getUserSurveyQueue = (state) => {
  return state.getIn([ 'userModel', 'userSurveyQueue' ]) || Immutable.List()
}

const setUserSurveyQueue = (state, queue) => {
  if (!userModelState.getAdEnabledValue(state)) return state

  return state.setIn([ 'userModel', 'userSurveyQueue' ], queue)
}

const getReportingEventQueue = (state) => {
  return state.getIn([ 'userModel', 'reportingEventQueue' ]) || Immutable.List()
}

const setReportingEventQueue = (state, queue) => {
  if (!userModelState.getAdEnabledValue(state)) return state

  return state.setIn([ 'userModel', 'reportingEventQueue' ], queue)
}

const userModelState = {
  setUserModelValue: (state, key, value) => {
    if (!key) return state

    state = validateState(state)

    return state.setIn([ 'userModel', key ], value)
  },

  getUserModelValue: (state, key) => {
    state = validateState(state)
    return state.getIn([ 'userModel', key ])
  },

  appendPageScoreToHistoryAndRotate: (state, pageScore) => {
    const stateKey = [ 'userModel', 'pageScoreHistory' ]
    const wrappedScore = Immutable.List(pageScore)

    return appendToRingBufferUnderKey(state, stateKey, wrappedScore, maxRowsInPageScoreHistory)
  },

  appendAdShownToAdHistory: (state) => {
    const stateKey = [ 'userModel', 'adsShownHistory' ]
    const unixTime = unixTimeNowSeconds()

    return appendToRingBufferUnderKey(state, stateKey, unixTime, maxRowsInAdsShownHistory)
  },

  getAdUUIDSeen: (state) => {
    const key = [ 'userModel', 'adsUUIDSeen' ]
    let seen = state.getIn(key) || Immutable.Map()

    if (!Immutable.Map.isMap(seen)) seen = Immutable.Map()

    return seen
  },

  recordAdUUIDSeen: (state, uuid, value = 1) => {
    if (!userModelState.getAdEnabledValue(state)) return state

    const key = [ 'userModel', 'adsUUIDSeen' ]
    let seen = state.getIn(key) || Immutable.Map()

    seen = seen.setIn([uuid], value)
    return state.setIn(key, seen)
  },

  allowedToShowAdBasedOnHistory: (state) => {
    const history = state.getIn([ 'userModel', 'adsShownHistory' ]) || []

    const hourWindow = 60 * 60
    const dayWindow = 24 * hourWindow

    const hourAllowed = getSetting(settings.ADS_PER_HOUR, state.get('settings'))
    const dayAllowed = getSetting(settings.ADS_PER_DAY, state.get('settings'))

    const respectsHourLimit = historyRespectsRollingTimeConstraint(history, hourWindow, hourAllowed)
    const respectsDayLimit = historyRespectsRollingTimeConstraint(history, dayWindow, dayAllowed)
    return respectsHourLimit && respectsDayLimit
  },

  elphAppendLetter: (state, letter) => {
    state = validateState(state)
    let tmp = state.getIn(['userModel', 'elphstring'])
    if (typeof (tmp) === 'undefined') { // graceful cold start
      return state.setIn(['userModel', 'elphstring'], letter)
    }
    const longstr = tmp + letter
    console.log(longstr)
    return state.setIn(['userModel', 'elphstring'], longstr)
  },

  elphDeferRecorder: (state, reset = false) => {
    state = validateState(state)
    let defer = 0
    if (!reset) {
      defer = 1 + state.getIn([ 'userModel', 'elphDefer' ])
    }
    return state
      .setIn(['userModel', 'elphDefer'], defer)
  },

  elphDeferRemember: (state) => {
    state = validateState(state)
    return state.getIn([ 'userModel', 'elphDefer' ])
  },

  getPageScoreHistory: (state, mutable = false) => {
    state = validateState(state)
    const history = state.getIn([ 'userModel', 'pageScoreHistory' ]) || []

    return (mutable ? makeJS(history) : makeImmutable(history))
  },

  removeAllHistory: (state) => {
// DO NOT check settings.ADS_ENABLED

    state = validateState(state)

    return state.setIn([ 'userModel' ], Immutable.Map())
  },

  scraperDebounceSet: (state, url, newtime) => {
    state = validateState(state)
    return state
          .setIn([ 'userModel', 'lastUrl' ], url)
          .setIn([ 'userModel', 'lastBounceTime' ], newtime)
  },

  scraperDebounceQuery: (state) => {
    const result = {
      url: state.getIn(['userModel', 'lastUrl']),
      time: state.getIn(['userModel', 'lastBounceTime'])
    }

    return result
  },

  removeHistorySite: (state, action) => {
    const historyKey = action.get('historyKey')

// DO NOT check settings.ADS_ENABLED

    state = validateState(state)

    appActions.onUserModelLog('FIXME', { action: action.get('actionType'), historyKey })

    return state
  },

  // later maybe include a search term and history
  flagSearchState: (state, url, score) => {
    if ((!url) || (!urlUtil.isURL(url)) || (!userModelState.getAdEnabledValue(state))) return state

    state = validateState(state)

    return state
          .setIn([ 'userModel', 'searchActivity' ], true)
          .setIn([ 'userModel', 'searchUrl' ], url)  // can we check this here?
          .setIn([ 'userModel', 'score' ], score)
          .setIn([ 'userModel', 'lastSearchTime' ], new Date().getTime())
  },

  // user has stopped searching for things
  unFlagSearchState: (state, url) => {
    if ((!url) || (!urlUtil.isURL(url)) || (!userModelState.getAdEnabledValue(state))) return state

    state = validateState(state)

    // if you're still at the same url, you're still searching; maybe this should log an error
    if (state.getIn([ 'userModel', 'searchUrl' ]) === url) return state

    return state
          .setIn([ 'userModel', 'searchActivity' ], false) // toggle off date probably more useful
          .setIn([ 'userModel', 'lastSearchTime' ], new Date().getTime())
  },

  getSearchState: (state) => {
    state = validateState(state)

    return state.getIn([ 'userModel', 'searchActivity' ])
  },

  getLastSearchTime: (state) => {
    state = validateState(state)
    return state.getIn(['userModel', 'lastSearchTime'])
  },

  // user is visiting a shopping website
  flagShoppingState: (state, url) => {
    if (!userModelState.getAdEnabledValue(state)) return state

    state = validateState(state)

    return state
          .setIn([ 'userModel', 'shopActivity' ], true)
          .setIn([ 'userModel', 'shopUrl' ], url)
          .setIn([ 'userModel', 'lastShopTime' ], new Date().getTime())
  },

  unFlagShoppingState: (state) => {
    if (!userModelState.getAdEnabledValue(state)) return state

    state = validateState(state)

    return state.setIn([ 'userModel', 'shopActivity' ], false)
  },

  getShoppingState: (state) => {
    state = validateState(state)

    return state.getIn([ 'userModel', 'shopActivity' ])
  },

  getLastShoppingTime: (state) => {
    state = validateState(state)

    return state.getIn([ 'userModel', 'lastShopTime' ])
  },

  flagUserBuyingSomething: (state, url) => {
    if (!userModelState.getAdEnabledValue(state)) return state

    state = validateState(state)

    return state
          .setIn([ 'userModel', 'purchaseTime' ], new Date().getTime())
          .setIn([ 'userModel', 'purchaseUrl' ], url)
          .setIn([ 'userModel', 'purchaseActive' ], true)
  },

  getUserBuyingState: (state) => {
    state = validateState(state)

    return state.getIn([ 'userModel', 'purchaseActive' ])
  },

  getUserModelTimingMdl: (state, mutable = true) => {
    state = validateState(state)
    const mdl = state.getIn([ 'userModel', 'timingModel' ]) || Immutable.List()
    return (mutable ? makeJS(mdl) : makeImmutable(mdl))
  },

  setUserModelTimingMdl: (state, model) => {
    if (!userModelState.getAdEnabledValue(state)) return state
    state = validateState(state)
    return state.setIn([ 'userModel', 'timingModel' ], makeImmutable(model))
  },

  setUrlActive: (state, url) => {
    if ((!url) || (!urlUtil.isURL(url)) || (!userModelState.getAdEnabledValue(state))) return state

    state = validateState(state)

    return state.setIn([ 'userModel', 'url' ], url)
  },

  setUrlClass: (state, url, pageClass) => {
    if ((!url) || (!pageClass) || (!urlUtil.isURL(url)) || (!userModelState.getAdEnabledValue(state))) return state

    state = validateState(state)

    return state
      .setIn([ 'userModel', 'updated' ], new Date().getTime())
      .setIn([ 'userModel', 'url' ], url)
      .setIn([ 'userModel', 'pageClass' ], pageClass)
  },

  // this gets called when an ad is served, so we know the last time
  // we served what
  // potential fun stuff to put here; length of ad-view, some kind of
  // signatures on ad-hash and length of ad view
  setServedAd: (state, adServed, adClass) => {
    if ((!adServed) || (!userModelState.getAdEnabledValue(state))) return state

    state = validateState(state)

    return state
      .setIn([ 'userModel', 'lastAdTime' ], new Date().getTime())
      .setIn([ 'userModel', 'adServed' ], adServed)
      .setIn([ 'userModel', 'adClass' ], adClass)
  },

  getLastServedAd: (state) => {
    state = validateState(state)

    const result = {
      lastAdTime: state.getIn([ 'userModel', 'lastAdTime' ]),
      lastAdServed: state.getIn([ 'userModel', 'adServed' ]),
      lastAdClass: state.getIn([ 'userModel', 'adClass' ])
    }

    return Immutable.fromJS(result) || Immutable.Map()
  },

  setLastUserActivity: (state) => {
    if (!userModelState.getAdEnabledValue(state)) return state

    state = validateState(state)

    return state.setIn([ 'userModel', 'lastUserActivity' ], new Date().getTime())
  },

  setLocale: (state, locale) => {
    if (!userModelState.getAdEnabledValue(state)) return state

    state = validateState(state)

    return state.setIn([ 'userModel', 'locale' ], locale)
  },

  setLastUserIdleStopTime: (state) => {
    if (!userModelState.getAdEnabledValue(state)) return state

    state = validateState(state)

    return state.setIn([ 'userModel', 'lastUserIdleStopTime' ], new Date().getTime())
  },

  getLastUserIdleStopTime: (state) => {
    state = validateState(state)
    return state.getIn([ 'userModel', 'lastUserIdleStopTime' ])
  },

  setUserModelError: (state, error, caller) => {
    if (!userModelState.getAdEnabledValue(state)) return state

    state = validateState(state)

    state = state.setIn([ 'userModel', 'error' ], Immutable.fromJS({
      caller: caller,
      error: error
    }))

    return state
  },

  setSSID: (state, value) => {
    if (!userModelState.getAdEnabledValue(state)) return state

    const current = userModelState.getSSID(state)

    if (!value) value = 'unknown'
    state = state.setIn([ 'userModel', 'currentSSID' ], value)

    if (current !== value) {
      state = state.setIn([ 'settings', settings.ADS_PLACE ], userModelState.getAdPlace(state) || 'UNDISCLOSED')
    }

    return state
  },

  getSSID: (state) => {
    return (state.getIn([ 'userModel', 'currentSSID' ]) || null)
  },

  getAdPlace: (state) => {
    const ssid = userModelState.getSSID(state)
    const places = state.getIn([ 'userModel', 'places' ])

    return ((places && ssid && isMap(places) && places.get(ssid)) || 'UNDISCLOSED')
  },

  setAdPlace: (state, place) => {
    if (!userModelState.getAdEnabledValue(state)) return state

    const ssid = userModelState.getSSID(state)
    if (ssid) state = state.setIn([ 'userModel', 'places', ssid ], place)

    return state
  },

  getModel: (state) => {
    state = validateState(state)

    return state.get('userModel') || Immutable.Map()
  },

  getAdEnabledValue: (state) => {
    return state.getIn([ 'settings', settings.ADS_ENABLED ])
  },

  getAdUUID: (state) => {
    // returns string or undefined
    return state.getIn([ 'userModel', 'adUUID' ])
  },

  setAdUUID: (state, uuid) => {
    return state.setIn([ 'userModel', 'adUUID' ], uuid)
  },

  appendToUserSurveyQueue: (state, survey) => {
    let q = getUserSurveyQueue(state)

    if (!Immutable.List.isList(q)) q = Immutable.List()

    return setUserSurveyQueue(state, q.push(Immutable.Map(survey)))
  },

  appendToReportingEventQueue: (state, event) => {
    let q = getReportingEventQueue(state)

    if (!Immutable.List.isList(q)) q = Immutable.List()

    return setReportingEventQueue(state, q.push(Immutable.Map(event)))
  },

  flushReportingEventQueue: (state) => {
    return setReportingEventQueue(state, [])
  },

  getUserSurveyQueue,

  setUserSurveyQueue,

  getReportingEventQueue,

  setReportingEventQueue
}

module.exports = userModelState
