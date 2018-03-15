/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const um = require('@brave-intl/bat-usermodel')

// Actions
const appActions = require('../../../js/actions/appActions')
const windowActions = require('../../../js/actions/windowActions')

// State
const userModelState = require('../../common/state/userModelState')

// Constants
const notificationTypes = require('../../common/constants/notificationTypes')

// Utils
const urlUtil = require('../../../js/lib/urlutil')
const ledgerUtil = require('../../common/lib/ledgerUtil')

const truncateUrl = require('truncate-url')

let matrixData
let priorData
let sampleAdFeed

const initialize = (state) => {
  // TODO turn back on?
  // state = userModelState.setAdFrequency(state, 15)

  // after the app has initialized, load the big files we need
  // this could be done however slowly in the background
  // on the other side, return early until these are populated
  setImmediate(function () {
    matrixData = um.getMatrixDataSync()
    priorData = um.getPriorDataSync()
    sampleAdFeed = um.getSampleAdFeed()
  })

  return state
}

const tabUpdate = (state, action) => {
  // nothing but update the ums for now
  state = userModelState.setLastUserActivity(state)
  return state
}

/* these two are pretty similar, userAction presently unused but maybe needed */
const userAction = (state) => {
  state = userModelState.setUserActivity()
  return state
}

const removeHistorySite = (state, action) => {
  // check to see how ledger removes history
  // first need to establish site classification DB in userModelState

  // blow it all away for now
  state = userModelState.removeAllHistory(state)
  return state
}

const removeAllHistory = (state) => {
  state = userModelState.removeAllHistory(state)
  return state
}

const saveCachedInfo = (state) => {
  // writes stuff to leveldb
  return state
}

const testShoppingData = (state, url) => {
  const hostname = urlUtil.getHostname(url)
  const lastShopState = userModelState.getSearchState(state)

  if (hostname === 'amazon.com') {
    const score = 1.0   // eventually this will be more sophisticated than if(), but amazon is always a shopping destination
    state = userModelState.flagShoppingState(state, url, score)
  } else if (hostname !== 'amazon.com' && lastShopState) {
    state = userModelState.unFlagShoppingState(state)
  }
  return state
}

const testSearchState = (state, url) => {
  const hostname = urlUtil.getHostname(url)
  const lastSearchState = userModelState.getSearchState(state)
  if (hostname === 'google.com') {
    const score = 1.0  // eventually this will be more sophisticated than if(), but google is always a search destination
    state = userModelState.flagSearchState(state, url, score)
  } else if (hostname !== 'google.com' && lastSearchState) {
    state = userModelState.unFlagSearchState(state, url)
  }
  return state
}

const recordUnIdle = (state) => {
  state = userModelState.setLastUserIdleStopTime(state)
  return state
}

function cleanLines (x) {
  if (x == null) {
    return []
  }

  return x
    .map(x => x.split(/\s+/)) // split each: ['the quick', 'when in'] -> [['the', 'quick'], ['when', 'in']]
    .reduce((x, y) => x.concat(y), []) // flatten: [[a,b], [c,d]] -> [a, b, c, d]
    .map(x => x.toLowerCase().trim())
}

function randomKey (dictionary) {
  const keys = Object.keys(dictionary)
  return keys[keys.length * Math.random() << 0]
}

const goAheadAndShowTheAd = (windowId, categoryName, notificationText, notificationUrl) => {
  appActions.onUserModelDemoValue(`Ads shown: ${categoryName}`)
  windowActions.onNativeNotificationOpen(
      windowId,
      `Brave Ad: ${categoryName}`,
    {
      body: notificationText,
      data: {
        notificationUrl,
        notificationId: notificationTypes.ADS
      }
    }
    )
}

const classifyPage = (state, action, windowId) => {
  // console.log('data in', action)// run NB on the code

  let headers = action.getIn(['scrapedData', 'headers'])
  let body = action.getIn(['scrapedData', 'body'])
  let url = action.getIn(['scrapedData', 'url'])

  if (!headers) {
    return state
  }

  headers = cleanLines(headers)
  body = cleanLines(body)

  let words = headers.concat(body) // combine

  if (words.length < um.minimumWordsToClassify) {
    return state
  }

  if (words.length > um.maximumWordsToClassify) {
    words = words.slice(0, um.maximumWordsToClassify)
  }

  // don't do anything until our files have loaded in the background
  if (!matrixData || !priorData) {
    return state
  }

  const pageScore = um.NBWordVec(words, matrixData, priorData)

  state = userModelState.appendPageScoreToHistoryAndRotate(state, pageScore)

  let catNames = priorData['names']

  let immediateMax = um.vectorIndexOfMax(pageScore)
  let immediateWinner = catNames[immediateMax]

  let mutable = true
  let history = userModelState.getPageScoreHistory(state, mutable)

  let scores = um.deriveCategoryScores(history)
  let indexOfMax = um.vectorIndexOfMax(scores)

  let winnerOverTime = catNames[indexOfMax]
  let maxLength = 40

  let shortUrl = truncateUrl(url, maxLength)
  let logString = 'Current Page [' + shortUrl + '] Class: ' + immediateWinner + ' Moving Average of Classes: ' + winnerOverTime
  console.log(logString)
  appActions.onUserModelDemoValue(['log item: ', logString])

  return state
}

const basicCheckReadyAdServe = (state, windowId) => {
  if (!priorData) {
    return state
  }

  let catNames = priorData['names']
  /// ////////////////////////////////

  let mutable = true
  let history = userModelState.getPageScoreHistory(state, mutable)

  let scores = um.deriveCategoryScores(history)
  let indexOfMax = um.vectorIndexOfMax(scores)
  let winnerOverTime = catNames[indexOfMax]

  let bundle = sampleAdFeed
  let arbitraryKey
  let notificationText
  let notificationUrl

  let allGood = true

  if (bundle) {
    const result = bundle['categories'][winnerOverTime]
    arbitraryKey = randomKey(result)

    const payload = result[arbitraryKey]

    if (payload) {
      notificationText = payload['notificationText']
      notificationUrl = payload['notificationURL']
    } else {
      console.warn('BAT Ads: Could not read ad data for display.')
    }
  }

  if (!notificationText || !notificationUrl) {
    allGood = false
  }

  if (!userModelState.allowedToShowAdBasedOnHistory(state)) {
    allGood = false
    appActions.onUserModelDemoValue(['log item: ', 'prevented from showing ad based on history'])
  }

  if (allGood) {
    goAheadAndShowTheAd(windowId, winnerOverTime, notificationText, notificationUrl)
    appActions.onUserModelDemoValue(['log item: ', 'ad shown', winnerOverTime, notificationText, notificationUrl])
    state = userModelState.appendAdShownToAdHistory(state)
  }

  return state
}

// this needs a place where it can be called from in the reducer. when to check?
const checkReadyAdServe = (state) => {
  const lastAd = userModelState.getLastServedAd(state)
  const prevAdServ = lastAd.lastadtime
  const prevAdId = lastAd.lastadserved
  const date = new Date().getTime()
  const timeSinceLastAd = date - prevAdServ
  // make sure you're not serving one too quickly or the same one as last time
  const shopping = userModelState.getShoppingState(state)
  /* is the user shopping (this needs to be recency thing) define ad by the
   running average class */
  const ad = 1
  if (shopping && (ad !== prevAdId) && (timeSinceLastAd > ledgerUtil.milliseconds.hour)) {
    serveAdNow(state, ad)
  }
}

const serveAdNow = (state, ad) => {
  /* do stuff which pushes the ad */
}

/* frequency a float meaning ads per day */
const changeAdFrequency = (state, freq) => {
  state = userModelState.setAdFrequency(state, freq)
  return state
}

const privateTest = () => {
  return 1
}

const getMethods = () => {
  const publicMethods = {
    initialize,
    tabUpdate,
    userAction,
    removeHistorySite,
    removeAllHistory,
    testShoppingData,
    saveCachedInfo,
    testSearchState,
    classifyPage,
    basicCheckReadyAdServe,
    checkReadyAdServe,
    recordUnIdle,
    serveAdNow,
    changeAdFrequency

  }

  let privateMethods = {}

  if (process.env.NODE_ENV === 'test') {
    privateMethods = {
      privateTest
      // private if testing
    }
  }
  return Object.assign({}, publicMethods, privateMethods)
}
module.exports = getMethods()
