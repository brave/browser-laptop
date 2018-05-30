/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const um = require('@brave-intl/bat-usermodel')
const path = require('path')
const getSSID = require('detect-ssid')
const underscore = require('underscore')
const url = require('url')
const uuidv4 = require('uuid/v4')

const app = require('electron').app
const os = require('os')

// Actions
const appActions = require('../../../js/actions/appActions')

// State
const userModelState = require('../../common/state/userModelState')
const settings = require('../../../js/constants/settings')
const getSetting = require('../../../js/settings').getSetting
const Immutable = require('immutable')

// Constants
const notificationTypes = require('../../common/constants/notificationTypes')
const searchProviders = require('../../../js/data/searchProviders').providers

// Utils
const urlUtil = require('../../../js/lib/urlutil')
const urlParse = require('../../common/urlParse')
const roundtrip = require('./ledger').roundtrip

let foregroundP

let matrixData
let priorData
let sampleAdFeed

let lastSingleClassification

const generateAdReportingEvent = (state, eventType, action) => {
  let map = {}

  map.type = eventType
  map.stamp = new Date().toISOString()

  // additional event data
  switch (eventType) {
    case 'notify':
      {
        const eventName = action.get('eventName')
        const data = action.get('data')

        switch (eventName) {
          case notificationTypes.AD_SHOWN:
            {
              const classification = data.get('hierarchy')
              map.notificationType = 'generated'
              map.notificationClassification = classification
              map.notificationCatalog = 'unspecified-catalog'
              map.notificationUrl = data.get('notificationUrl')
              break
            }
          case notificationTypes.NOTIFICATION_RESULT:
            {
              const result = data.get('result')
              const translate = { 'clicked': 'clicked', 'closed': 'dismissed', 'ignored': 'timeout' }
              map.notificationType = translate[result] || result
              break
            }
          case notificationTypes.NOTIFICATION_CLICK:
          case notificationTypes.NOTIFICATION_TIMEOUT:
            {
              // handling these in the other event, currently. 2018.05.23
              return state
            }
          default:
            {
              // not an event we want to process
              return state
            }
        }

        // must follow the switch statement, so we return from bogus events we don't want to capture, which won't have this
        map.notificationId = data.get('uuid')

        break
      }
    case 'load':
      {
        const tabValue = action.get('tabValue')
        const tabUrl = tabValue.get('url')

        if (!tabUrl.startsWith('http://') && !tabUrl.startsWith('https://')) return state

        map.tabId = String(tabValue.get('tabId'))
        map.tabType = 'click'

        const searchState = userModelState.getSearchState(state)

        if (searchState) map.tabType = 'search'
        map.tabUrl = tabUrl

        let classification = lastSingleClassification || []

        if (!Array.isArray(classification)) classification = classification.toArray()
        map.tabClassification = classification

        break
      }
    case 'blur':
      {
        map.tabId = String(action.get('tabValue').get('tabId'))
        break
      }
    case 'focus':
      {
        map.tabId = String(action.get('tabId'))
        break
      }
    case 'settings':
      {
        let config = {}
        config.operatingMode = getSetting(settings.ADS_OPERATING_MODE, state.settings) ? 'B' : 'A'
        config.adsPerHour = getSetting(settings.ADS_PER_HOUR, state.settings)
        config.adsPerDay = getSetting(settings.ADS_PER_DAY, state.settings)

        map.settings = config
        break
      }
    case 'foreground':
    case 'restart':
    default:
      {
        map.place = userModelState.getAdPlace(state) || 'unspecified'
        break
      }
  }

  let last = userModelState.getReportingEventQueue(state).last()
  if (last) {
    last = last.toJS()
    last.stamp = map.stamp
    if (underscore.isEqual(last, map)) return state
  }
  state = userModelState.appendToReportingEventQueue(state, map)

  // let q = userModelState.getReportingEventQueue(state)
  // console.log("q: ", q)
  // state = userModelState.flushReportingEventQueue(state)

  appActions.onUserModelLog('Event logged', map)

  return state
}

const initialize = (state, adEnabled) => {
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

  retrieveSSID()

  state = confirmAdUUIDIfAdEnabled(state)

  return state
}

const appFocused = (state, focusP) => {
  foregroundP = focusP

  return state
}

const tabUpdate = (state, action) => {
  // nothing but update the ums for now
  state = userModelState.setLastUserActivity(state)

  return state
}

/* presently unused but maybe needed
const userAction = (state) => {
  state = userModelState.setUserActivity()

  return state
}
 */

const removeHistorySite = (state, action) => {
  // check to see how ledger removes history
  // first need to establish site classification DB in userModelState

  // blow it all away for now
  state = userModelState.removeAllHistory(state)

  return state
}

const removeAllHistory = (state) => {
  state = userModelState.removeAllHistory(state)
  state = confirmAdUUIDIfAdEnabled(state)

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
  const href = urlParse(url).href
  const lastSearchState = userModelState.getSearchState(state)

  // eventually this may be more sophisticated...
  for (let provider of searchProviders) {
    const prefix = provider.search
    const x = prefix.indexOf('{')

    if ((x <= 0) || (href.indexOf(prefix.substr(0, x)) !== 0)) continue

    state = userModelState.flagSearchState(state, url, 1.0)
    return state
  }

  if (lastSearchState) state = userModelState.unFlagSearchState(state, url)

  return state
}

const recordUnIdle = (state) => {
  state = userModelState.setLastUserIdleStopTime(state)

  return state
}

function cleanLines (x) {
  if (x == null) return []

  return x
    .map(x => x.split(/\s+/)) // split each: ['the quick', 'when in'] -> [['the', 'quick'], ['when', 'in']]
    .reduce((x, y) => x.concat(y), []) // flatten: [[a,b], [c,d]] -> [a, b, c, d]
    .map(x => x.toLowerCase().trim())
}

function randomKey (dictionary) {
  const keys = Object.keys(dictionary)
  return keys[keys.length * Math.random() << 0]
}

const goAheadAndShowTheAd = (windowId, notificationTitle, notificationText, notificationUrl, uuid, notificationId) => {
  appActions.nativeNotificationCreate(
    windowId,
    {
      title: notificationTitle,
      message: notificationText,
      icon: path.join(__dirname, '../../../img/BAT_icon.png'),
      sound: true,
      timeout: 60,
      wait: true,
      uuid: uuid,
      data: {
        windowId,
        notificationUrl,
        notificationId: notificationId || notificationTypes.ADS
      }
    }
  )
}

const classifyPage = (state, action, windowId) => {
  // console.log('data in', action)// run NB on the code

  let headers = action.getIn(['scrapedData', 'headers'])
  let body = action.getIn(['scrapedData', 'body'])
  let url = action.getIn(['scrapedData', 'url'])

  if (!headers) return state

  headers = cleanLines(headers)
  body = cleanLines(body)

  let words = headers.concat(body) // combine

  if (words.length < um.minimumWordsToClassify) return state

  if (words.length > um.maximumWordsToClassify) words = words.slice(0, um.maximumWordsToClassify)

  // don't do anything until our files have loaded in the background
  if (!matrixData || !priorData) return state

  const pageScore = um.NBWordVec(words, matrixData, priorData)

  state = userModelState.appendPageScoreToHistoryAndRotate(state, pageScore)

  let catNames = priorData['names']

  let immediateMax = um.vectorIndexOfMax(pageScore)
  let immediateWinner = catNames[immediateMax].split('-')

  lastSingleClassification = immediateWinner

  let mutable = true
  let history = userModelState.getPageScoreHistory(state, mutable)

  let scores = um.deriveCategoryScores(history)
  let indexOfMax = um.vectorIndexOfMax(scores)
  let winnerOverTime = catNames[indexOfMax].split('-')

  appActions.onUserModelLog('Site visited', {url, immediateWinner, winnerOverTime})

  return state
}

const basicCheckReadyAdServe = (state, windowId) => {
// since this is called on APP_IDLE_STATE_CHANGE, not a good idea to log here...
  if (!priorData) return state

  if (!foregroundP) {
    appActions.onUserModelLog('not in foreground')
    return state
  }

  if (!userModelState.allowedToShowAdBasedOnHistory(state)) {
    appActions.onUserModelLog('Ad throttled')
    return state
  }

  const surveys = userModelState.getUserSurveyQueue(state).toJS()
  const survey = underscore.findWhere(surveys, { status: 'available' })
  if (survey) {
    survey.status = 'display'
    survey.status_at = new Date().toISOString()
    state = userModelState.setUserSurveyQueue(state, Immutable.fromJS(surveys))

    goAheadAndShowTheAd(windowId, survey.title, survey.description, survey.url, generateAdUUIDString(),
                        notificationTypes.SURVEYS)
    appActions.onUserModelLog(notificationTypes.SURVEY_SHOWN, survey)

    return state
  }

  const bundle = sampleAdFeed
  if (!bundle) {
    appActions.onUserModelLog('No ad catalog')

    return state
  }

  const catNames = priorData['names']
  const mutable = true
  const history = userModelState.getPageScoreHistory(state, mutable)
  const scores = um.deriveCategoryScores(history)
  const indexOfMax = um.vectorIndexOfMax(scores)
  const category = catNames[indexOfMax]
  if (!category) {
    appActions.onUserModelLog('No category at offset indexOfMax', {indexOfMax})

    return state
  }

// given 'sports-rugby-rugby world cup': try that, then 'sports-rugby', then 'sports'
  const hierarchy = category.split('-')
  let winnerOverTime, result
  for (let level in hierarchy) {
    winnerOverTime = hierarchy.slice(0, hierarchy.length - level).join('-')
    result = bundle['categories'][winnerOverTime]
    if (result) break
  }
  if (!result) {
    appActions.onUserModelLog('No ads for category', {category})

    return state
  }

  const arbitraryKey = randomKey(result)
  const payload = result[arbitraryKey]
  if (!payload) {
    appActions.onUserModelLog('No ad at offset for winnerOverTime', {category, winnerOverTime, arbitraryKey})

    return state
  }

  const notificationText = payload['notificationText']
  const notificationUrl = payload['notificationURL']
  const advertiser = payload['advertiser']
  if (!notificationText || !notificationUrl || !advertiser) {
    appActions.onUserModelLog('Incomplete ad information',
                              {category, winnerOverTime, arbitraryKey, notificationUrl, notificationText, advertiser})
    return state
  }

  const uuid = generateAdUUIDString()

  goAheadAndShowTheAd(windowId, advertiser, notificationText, notificationUrl, uuid)
  appActions.onUserModelLog(notificationTypes.AD_SHOWN, {category, winnerOverTime, arbitraryKey, notificationUrl, notificationText, advertiser, uuid, hierarchy})
  state = userModelState.appendAdShownToAdHistory(state)

  return state
}

/* presently unused but maybe needed
const checkReadyAdServe = (state) => {
  const lastAd = userModelState.getLastServedAd(state)
  const prevAdServ = lastAd.lastadtime
  const prevAdId = lastAd.lastadserved
  const date = new Date().getTime()
  const timeSinceLastAd = date - prevAdServ
// make sure you're not serving one too quickly or the same one as last time
  const shopping = userModelState.getShoppingState(state)
// is the user shopping (this needs to be recency thing) define ad by the running average class
  const ad = 1

  if (shopping && (ad !== prevAdId) && (timeSinceLastAd > ledgerUtil.milliseconds.hour)) serveAdNow(state, ad)
}

const serveAdNow = (state, ad) => {
}
 */

/* frequency a float meaning ads per day */
const changeAdFrequency = (state, freq) => {
  state = userModelState.setAdFrequency(state, freq)

  return state
}

const retrieveSSID = () => {
  // i am consistently amazed by the lack of decent network reporting in node.js
  // os.networkInterfaces() is useless for most things
  // the module below has to run an OS-specific system utility to get the SSID
  // and if we're not on WiFi, there is no reliable way to determine the actual interface in use

  getSSID((err, ssid) => {
    if (err) return appActions.onUserModelLog('SSID unavailble', { reason: err.toString() })

    appActions.onSSIDReceived(ssid)
  })
}

const generateAdUUIDString = () => {
  return uuidv4()
}

const generateAndSetAdUUIDRegardless = (state) => {
  let uuid = generateAdUUIDString()

  state = userModelState.setAdUUID(state, uuid)

  return state
}

const generateAndSetAdUUIDButOnlyIfDNE = (state) => {
  let uuid = userModelState.getAdUUID(state)

  if (typeof uuid === 'undefined') state = generateAndSetAdUUIDRegardless(state)

  return state
}

const confirmAdUUIDIfAdEnabled = (state) => {
  let adEnabled = userModelState.getAdEnabledValue(state)

  if (adEnabled) state = generateAndSetAdUUIDButOnlyIfDNE(state)
  state = collectActivityAsNeeded(state, adEnabled)

  return state
}

let collectActivityId

let testingP = (process.env.NODE_ENV === 'test') || (process.env.LEDGER_VERBOSE === 'true')
const oneDay = (testingP ? 600 : 86400) * 1000
const oneHour = (testingP ? 25 : 3600) * 1000
const roundTripOptions = {
  debugP: false,
  loggingP: false,
  verboseP: process.env.LEDGER_VERBOSE === 'true',
  server: url.parse('https://' + (testingP ? 'collector-staging.brave.com' : 'collector.brave.com'))
}

const collectActivityAsNeeded = (state, adEnabled) => {
  if (!adEnabled) {
    if (collectActivityId) {
      clearTimeout(collectActivityId)
      collectActivityId = undefined
    }

    return state
  }

  if (collectActivityId) return state

  const mark = underscore.last(userModelState.getReportingEventQueue(state).toJS())

  let retryIn = oneHour
  if (mark) {
    const now = underscore.now()

    retryIn = now - (new Date(mark.stamp).getTime())
    if (retryIn > oneHour) retryIn = oneHour
  }

  collectActivityId = setTimeout(appActions.onUserModelCollectActivity, retryIn)

  return state
}

const collectActivity = (state) => {
  const path = '/v1/reports/' + userModelState.getAdUUID(state)
  const events = userModelState.getReportingEventQueue(state).toJS()
  const mark = underscore.last(events)
  let stamp

  if (!mark) {
    appActions.onUserModelUploadLogs(null, oneDay)

    return state
  }
  stamp = mark.stamp
  if (!mark.uuid) {
    mark.uuid = uuidv4()
    state = userModelState.setReportingEventQueue(state, Immutable.fromJS(events))
  }

  roundtrip({
    method: 'PUT',
    path: path,
    payload: {
      braveVersion: app.getVersion(),
      platform: { darwin: 'mac', win32: os.arch() === 'x32' ? 'winia32' : 'winx64' }[os.platform()] || 'linux',
      reportId: mark.uuid,
      reportStamp: new Date().toISOString(),
      events: events
    }
  }, roundTripOptions, (err, response, result) => {
    if (err) {
      appActions.onUserModelLog('Event upload failed', {
        method: 'PUT',
        server: url.format(roundTripOptions.server),
        path: path,
        reason: err.toString()
      })

      if (response.statusCode !== 400) stamp = null
    }

    appActions.onUserModelUploadLogs(stamp, err ? oneHour : oneDay)
  })

  return state
}

const uploadLogs = (state, stamp, retryIn) => {
  const events = userModelState.getReportingEventQueue(state)
  const path = '/v1/surveys/reporter/' + userModelState.getAdUUID(state) + '?product=ads-test'

  if (stamp) {
    const data = events.some(entry => entry.stamp > stamp)

    state = userModelState.setReportingEventQueue(state, data)
    appActions.onUserModelLog('Events uploaded', { previous: state.size, current: data.size })
  }

  if (collectActivityId) collectActivityId = setTimeout(appActions.onUserModelCollectActivity, retryIn)

  roundtrip({
    method: 'GET',
    path: path
  }, roundTripOptions, (err, response, entries) => {
    if (!err) return appActions.onUserModelDownloadSurveys(entries)

    appActions.onUserModelLog('Survey download failed', {
      method: 'GET',
      server: url.format(roundTripOptions.server),
      path: path,
      reason: err.toString()
    })
  })

  return state
}

const downloadSurveys = (state, entries) => {
  const surveys = userModelState.getUserSurveyQueue(state)

  entries.forEach((entry) => {
    if (surveys.some(survey => survey.id === entry.id)) return

    entry = entry.toJSON()
    if (!entry.title || !entry.description || !entry.url) {
      return appActions.onUserModelLog('Incomplete survey information', entry)
    }

    state = userModelState.appendToUserSurveyQueue(state, entry)
    appActions.onUserModelLog('Downloaded survey information', entry)
  })

  return state
}

const privateTest = () => {
  return 1
}

const getMethods = () => {
  const publicMethods = {
    initialize,
    generateAdReportingEvent,
    appFocused,
    tabUpdate,
    removeHistorySite,
    removeAllHistory,
    confirmAdUUIDIfAdEnabled,
    testShoppingData,
    testSearchState,
    recordUnIdle,
    basicCheckReadyAdServe,
    classifyPage,
    saveCachedInfo,
    changeAdFrequency,
    collectActivity,
    uploadLogs,
    downloadSurveys,
    retrieveSSID
/*
    checkReadyAdServe,
    serveAdNow,
    goAheadAndShowTheAd,
    lastSingleClassification,
    userAction
 */
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
