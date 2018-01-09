/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// load utilities
// const path = require('path')
// const os = require('os')
// const levelUp = require('level')
// const historyUtil = require('../../common/lib/historyUtil')
const urlUtil = require('../../../js/lib/urlutil')
const um = require('@brave-intl/bat-usermodel')
const notifier = require('node-notifier')

let matrixData
let priorData
let sampleAdFeed

// Actions
const appActions = require('../../../js/actions/appActions')

// State
const userModelState = require('../../common/state/userModelState')

// Definitions
const miliseconds = {
  year: 365 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000
}

/* do things */
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
  // console.log('testShoppingdata:', [url, lastShopState])
  if (hostname === 'amazon.com') {
    const score = 1.0   // eventually this will be more sophisticated than if(), but amazon is always a shopping destination
    state = userModelState.flagShoppingState(state, url, score)
  } else if (hostname !== 'amazon.com' && lastShopState) {
    state = userModelState.unflagShoppingState(state)
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
    state = userModelState.unflagSearchState(state, url)
  }
  return state
}

const recordUnidle = (state) => {
  state = userModelState.setLastUserIdleStopTime(state)
  return state
}

function cleanLines (x) {
  // split each: ['the quick', 'when in'] -> [['the', 'quick'], ['when', 'in']]
  x = x.map(x => x.split(/\s+/))
  // flatten: [[a,b], [c,d]] -> [a, b, c, d]
  x = x.reduce((x, y) => x.concat(y), [])
  // lowecase each
  x = x.map(x => x.toLowerCase())
  x = x.map(x => x.trim())
  return x
}

function randomKey (dictionary) {
  var keys = Object.keys(dictionary)
  return keys[keys.length * Math.random() << 0]
}

const classifyPage = (state, action) => {
  // console.log('data in', action)// run NB on the code

  let headers = action.get('scrapedData').get('headers')
  let body = action.get('scrapedData').get('body')

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
  let catNames = priorData['names']

  let immediateMax = um.vectorIndexOfMax(pageScore)
  let immediateWinner = catNames[immediateMax]

  state = userModelState.appendPageScoreToHistoryAndRotate(state, pageScore)

  let mutable = true
  let history = userModelState.getPageScoreHistory(state, mutable)

  let scores = um.deriveCategoryScores(history)
  let indexOfMax = um.vectorIndexOfMax(scores)

  let winnerOverTime = catNames[indexOfMax]

  console.log('Current Page Class: ', immediateWinner, ' Moving Average of Classes: ', winnerOverTime)

  let samples = um.getSampleAdFiles()

  let bundle = sampleAdFeed

  let arbitraryKey
  let notificationText
  let notificationUrl

  let allgood = true

  if (bundle) {
    let result = bundle['categories'][immediateWinner]
    arbitraryKey = randomKey(result)

    let entry = result[arbitraryKey]
    // let payload = entry[0]
    let payload = entry

    if (payload) {
      notificationText = payload['notificationText']
      notificationUrl = payload['notificationURL']
    }
    else {
      console.warn('BAT Ads: Couldn\'t read ad data for display.')
    }
  }

  if (!notificationText) {
    allgood = false
  }

  if (!notificationUrl) {
    allgood = false
  }

  notifier.on('click', function (notifierObject, options) {
    // Triggers if `wait: true` and user clicks notification
    // console.log('notifierObject: ', notifierObject)
    // console.log('click options: ', options, '\n')
  })

  notifier.on('timeout', function (notifierObject, options) {
    // Triggers if `wait: true` and notification closes
    // console.log('notifierObject: ', notifierObject)
    // console.log('timeout options: ', options, '\n')
  })

  let details = {
    title: 'Brave Ad: ' + immediateWinner,
    // subtitle: 'Current cat: ' + immediateWinner + ' : ' + arbitraryKey,
    message: notificationText,
    open: notificationUrl, // 'https://brave.com?ad_origin=' + winnerOverTime,
    sound: true,
    wait: true,
    timeout: 25,
    closeLabel: 'BraveClose',
    actions: ['Action1', 'Action2'],
    dropdownLabel: 'Brave Actions',
    // icon: 'Terminal Icon', // Absolute Path to Triggering Icon
    // icon: samples[1],
    // contentImage: samples[2]
    // appIcon: //appears in macOS sample but not parent doc. doesn't seem to do anything
  }

  let cb = function (err, response, metadata) {
    if (err) {
        // console.log('BAT Ad Notification Error: ', err)
    }

    if (response) {
        // it seemed like we get 'closed' for `closed`
        // and 'activate' for `action1`, `action2`, and `clicked body`
        // console.log('BAT Ad Notification Response: ', response)
    }

    if (metadata) {
        // console.log('BAT Ad Notification Metadata: ', metadata)
    }
  }

  // Object
  if (allgood) {
    appActions.onUserModelDemoValue('Add shown')
    notifier.notify(details, cb)
  }

  return state
}

const dummyLog = (state) => {
  console.log('boing')
  return state
}
// this needs a place where it can be called from in the reducer. when to check?
const checkReadyAdServe = (state) => {
  const lastAd = userModelState.getLastServedAd(state)
  const prevadserv = lastAd.lastadtime
  const prevadid = lastAd.lastadserved
  const date = new Date().getTime()
  const timeSinceLastAd = date - prevadserv
  // make sure you're not serving one too quickly or the same one as last time
  const shoppingp = userModelState.getShoppingState(state)
  /* is the user shopping (this needs to be recency thing) define ad by the
   running average class */
  const ad = 1
  if (shoppingp && (ad !== prevadid) && (timeSinceLastAd > miliseconds.hour)) {
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
    checkReadyAdServe,
    recordUnidle,
    serveAdNow,
    changeAdFrequency,
    dummyLog
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
