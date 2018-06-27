/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const um = require('@brave-intl/bat-usermodel')
const elph = require('@brave-intl/bat-elph')
const notifier = require('brave-ads-notifier')
const path = require('path')
const getSSID = require('detect-ssid')
const underscore = require('underscore')
const urlFormat = require('url').format
const uuidv4 = require('uuid/v4')

const app = require('electron').app
const os = require('os')

// Actions
const appActions = require('../../../js/actions/appActions')

// Constants
const notificationTypes = require('../../common/constants/notificationTypes')
// const searchProviders = require('../../../js/data/searchProviders').providers // apparently busted
const settings = require('../../../js/constants/settings')

// State
const windows = require('../windows')
const userModelState = require('../../common/state/userModelState')
const getSetting = require('../../../js/settings').getSetting
const Immutable = require('immutable')

// Utils
const urlParse = require('../../common/urlParse')
const roundtrip = require('./ledger').roundtrip

const debugP = (process.env.NODE_ENV === 'test') || (process.env.LEDGER_VERBOSE === 'true')
const testingP = true
let nextEasterEgg = 0

let initP
let foregroundP
let onceP

let matrixData
let priorData
let sampleAdFeed

let lastSingleClassification

const noop = (state) => {
// IF [ we haven't initialized yet OR we're not enabled ], RETURN state

  return (((!matrixData) || (!priorData) || (!userModelState.getAdEnabledValue(state))) && state)
}

const generateAdReportingEvent = (state, eventType, action) => {
  if (noop(state)) return state

  if (!onceP) {
    onceP = true

    state = generateAdReportingEvent(state, 'restart', action)
  }

  const map = { type: eventType, stamp: new Date().toISOString() }

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
              const uuid = data.get('uuid')
              const result = data.get('result')
              const translate = { 'clicked': 'clicked', 'closed': 'dismissed', 'ignored': 'timeout' }
              map.notificationType = translate[result] || result

              if (map.notificationType === 'clicked' || map.notificationType === 'dismissed') {
                state = userModelState.recordAdUUIDSeen(state, uuid)
              }
//              uncomment testing SCL
//              if (map.notificationType === 'clicked' || map.notificationType === 'dismissed' || map.notificationType === 'timeout') {
//                const translateElph = { 'clicked': 'z', 'dismissed': 'y', 'timeout': 'y' } // refers to elph alphabetizer
//                state = updateTimingModel(state, translateElph[map.notificationType])
//              }

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

        if ((!tabValue) || (tabValue.get('incognito'))) return state

        const tabUrl = tabValue.get('url')

        if (!tabUrl.startsWith('http://') && !tabUrl.startsWith('https://')) return state

        const events = userModelState.getReportingEventQueue(state)
        if (events.some(entry => (entry.get('type') === 'notify') && (entry.get('notificationUrl') === tabUrl))) return state

        map.tabId = String(tabValue.get('tabId'))
        map.tabType = 'click'

        const searchState = userModelState.getSearchState(state)

        if (searchState) map.tabType = 'search'
        map.tabUrl = tabUrl

        let classification = lastSingleClassification || []

        if (!Array.isArray(classification)) classification = classification.toArray()
        map.tabClassification = classification

        const now = underscore.now()
        if ((testingP) && (tabUrl === 'https://www.iab.com/') && (nextEasterEgg < now)) {
          nextEasterEgg = now + (30 * 1000)

          state = checkReadyAdServe(state, windows.getActiveWindowId())
        }
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
        const key = action.get('key')
        const mapping = underscore.invert({
          enabled: settings.ADS_ENABLED,
          locale: settings.ADS_LOCALE,
          adsPerDay: settings.ADS_PER_DAY,
          adsPerHour: settings.ADS_PER_HOUR,
          operatingMode: settings.ADS_OPERATING_MODE
        })

        if (!mapping[key]) return state

        map.settings = {
          notifications: {
            configured: userModelState.getUserModelValue(state, 'configured'),
            allowed: userModelState.getUserModelValue(state, 'allowed')
          }
        }
        const stateSettings = state.get('settings')
        underscore.keys(mapping).forEach((k) => {
          const v = mapping[k]

          map.settings[v] = k !== key ? getSetting(k, stateSettings) : action.get('value')
          if (k === settings.ADS_OPERATING_MODE) map.settings[v] = map.settings[v] ? 'B' : 'A'
        })
        delete map.settings.enabled
        break
      }

    case 'foreground':
    case 'background':
    case 'restart':
    default:
      {
        map.place = userModelState.getAdPlace(state)
        break
      }
  }

  let last = userModelState.getReportingEventQueue(state).last()
  if (last) {
    last = last.toJS()
    last.stamp = map.stamp
    if (underscore.isEqual(last, map)) return state
  }
  appActions.onUserModelLog('Event logged', map)

  return userModelState.appendToReportingEventQueue(state, map)
}

const processLocales = (state, result) => {
  if (result == null || !Array.isArray(result) || (result.length === 0)) return state

  state = userModelState.setUserModelValue(state, 'locales', result)

  let locale = getSetting(settings.ADS_LOCALE, state.get('settings'))

  if (locale) {
    try { locale = um.setLocaleSync(locale) } catch (ex) {
      appActions.onUserModelLog('Locale error', { locale: locale, reason: ex.toString(), stack: ex.stack })
      locale = ''
    }
  }

  if (result.indexOf(locale) === -1) appActions.changeSetting(settings.ADS_LOCALE, result[0])

  return state
}

const initialize = (state, adEnabled) => {
  if (!adEnabled || initP) return state

  initP = true

  // check if notifications are available
  if (!notifier.available()) {
    appActions.changeSetting(settings.ADS_ENABLED, false)
    state = userModelState.setUserModelValue(state, 'available', false)
  } else {
    state = userModelState.setUserModelValue(state, 'available', true)
  }

  // check if notifications are configured correctly and currently allowed
  appActions.onNativeNotificationConfigurationCheck()
  appActions.onNativeNotificationAllowedCheck(false)

  // after the app has initialized, load the big files we need
  // this could be done however slowly in the background
  // on the other side, return early until these are populated
  setImmediate(function () {
    matrixData = um.getMatrixDataSync()
    priorData = um.getPriorDataSync()
    sampleAdFeed = um.getSampleAdFeed()
  })

  retrieveSSID()

  state = processLocales(state, um.getLocalesSync())

  return confirmAdUUIDIfAdEnabled(state, adEnabled)
}

const appFocused = (state, focusP) => {
  foregroundP = focusP

  return state
}

const tabUpdate = (state, action) => {
  // nothing but update the ums for now

  return userModelState.setLastUserActivity(state)
}

const removeHistorySite = (state, action) => {
  // check to see how ledger removes history
  // first need to establish site classification DB in userModelState
  // blow it all away for now

  return userModelState.removeAllHistory(state)
}

const removeAllHistory = (state) => {
  state = userModelState.removeAllHistory(state)

  return confirmAdUUIDIfAdEnabled(state)
}

const saveCachedInfo = (state) => {
  return state
}

// begin timing related pieces
const updateTimingModel = (state, special = 'invalid') => {
  if (noop(state)) return state
  let letter
  if (special === 'invalid') {
    letter = stateToLetterStd(state)
  } else if (special.length === 1) {
    letter = special
  } // anything else is an error
  let mdl = userModelState.getUserModelTimingMdl(state, true)
  if (mdl.length === 0) {
    mdl = elph.initOnlineELPH() // next init with useful Hspace
    mdl = elph.setBulkELPH('48485&########$##z($99999A//1111y11000000000./100#####z(y4885&#####$##z($999A//1111y110000000./10####z', mdl)
    mdl = elph.setBulkELPH('z(y88z84yy11..@zA/', mdl)
  }
  mdl = elph.updateOnlineELPH(letter, mdl)
  console.log('letter is ' + letter)
  state = userModelState.elphAppendLetter(state, letter)
  return userModelState.setUserModelTimingMdl(state, mdl)
}

const stateToLetterStd = (state) => {
  let tvar = topicVariance(state)
  let sch = userModelState.getSearchState(state)
  let shp = userModelState.getShoppingState(state)
//  let buy = shp || userModelState.getUserBuyingState(state) // this is broken
  let rec = recencyCalc(state)
  let freq = frequencyCalc(state)
//  console.log('calc rec  ' + rec + ', search= ' + sch + ', tvar = ' + tvar + ', shop ' + shp + ', since search ' + freq)
  let letter = elph.alphabetizer(tvar, sch, shp, false, false, freq, rec) // one more for buy perhaps, or xor
  return letter
}

const elphSaysGo = (state) => {
  let mdl = userModelState.getUserModelTimingMdl(state)
//  let defers = userModelState.elphDeferRemember(state)
  let out = false
  // magic number needs accounting for -SCL
  let value = elph.predictOnlineELPH(mdl)
//    console.log('elph predicts ' + value)
  let pred = elph.dealphabet(value)
  switch (pred) {
    case 'servead' :
      out = true
      break
    case 'clickad':
      out = true
      break
    default :
      out = false
      break
  }

  return out
}

// the following fixes a problem with "text available" in the reducer firing multiple times on one page load
// in principle we might check for corner cases which change state as time passes, but main thing is to
// avoid updating timing model too many times for one page load. First noticed at smothsonian website
// delay .... 1.5 maybe too long, but at least it smooths out for slow networks
const debouncedTimingUpdate = (state, url, delay = 1.5) => {
  let bounce = userModelState.scraperDebounceQuery(state)
  let now = new Date().getTime()
  let diff = (now - bounce.time) / 1000
  if (bounce.url === url && diff < delay) { // houston we have a problem; do not update
    state = userModelState.scraperDebounceSet(state, url, now)
    return state
  } else {
    state = userModelState.scraperDebounceSet(state, url, now)
    state = updateTimingModel(state)        // otherwise update as normal
    let canwe = userModelState.allowedToShowAdBasedOnHistory(state)
    if (canwe) {
//      console.log('what does elph say')
      elphSaysGo(state)
    }
    return state
  }
}

const topicVariance = (state) => { // this is a fairly random function; would have preferred something else
  let history = userModelState.getPageScoreHistory(state, true)
  let nback = history.length
  let scores = um.deriveCategoryScores(history)
  let indexOfMax = um.vectorIndexOfMax(scores)
  let varval = nback / scores[indexOfMax]
  return valueToLowHigh(varval, 2.5) // 2.5 needs to be changed for ANY algo change here
}

const recencyCalc = (state) => { // was using unidle time here; switched to last shopping time
  let now = new Date().getTime()
  let diff = (now - userModelState.getLastShoppingTime(state)) / 1000 // milliseconds
  return valueToLowHigh(diff, 600) // shorter than 10 minutes from idle
}

const frequencyCalc = (state) => {
  let now = new Date().getTime()
  let diff = (now - userModelState.getLastSearchTime(state)) / 1000 // milliseconds
  return valueToLowHigh(diff, 180) // 3 minutes from search
}

const valueToLowHigh = (x, thresh) => {
  let out = (x < thresh) ? 'low' : 'high'
  return out
}
// end timing related pieces

const testShoppingData = (state, url) => {
  if (noop(state)) return state
  const hostname = urlParse(url).hostname
  const lastShopState = userModelState.getShoppingState(state)
  if (hostname === 'www.amazon.com') {
    const score = 1.0   // eventually this will be more sophisticated than if(), but amazon is always a shopping destination
    state = userModelState.flagShoppingState(state, url, score)
  } else if (hostname !== 'www.amazon.com' && lastShopState) { // do we need lastShopState? assumes amazon queries hostname changes
    state = userModelState.unFlagShoppingState(state)
  }
  return state
}

const testSearchState = (state, url) => {
  if (noop(state)) return state

  const hostname = urlParse(url).hostname
  const lastSearchState = userModelState.getSearchState(state)
  if (hostname === 'www.google.com') {
    state = userModelState.flagSearchState(state, url, 1.0)
  } else if (hostname !== 'www.google.com' && lastSearchState) {
    state = userModelState.unFlagSearchState(state, url)
  }
    // do this broken thing that only works on 2nd page of search
    // const href = urlParse(url).href
    // for (let provider of searchProviders) {
    // const prefix = provider.search
    // const x = prefix.indexOf('{')
    // if ((x <= 0) || (href.indexOf(prefix.substr(0, x)) !== 0)) continue
    // return userModelState.flagSearchState(state, url, 1.0)
    // if (lastSearchState) state = userModelState.unFlagSearchState(state, url)
    // return state
  return state
}

const recordUnIdle = (state) => {
  return userModelState.setLastUserIdleStopTime(state)
}

function cleanLines (x) {
  if (x == null) return []

  return x
    .map(x => x.split(/\s+/)) // split each: [ 'the quick', 'when in' ] -> [[ 'the', 'quick' ], [ 'when', 'in' ]]
    .reduce((x, y) => x.concat(y), []) // flatten: [[ a, b ], [ c,d ]] -> [ a, b, c, d ]
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
  if (noop(state)) return state

  const url = action.getIn([ 'scrapedData', 'url' ])
  let headers = action.getIn([ 'scrapedData', 'headers' ])
  let body = action.getIn([ 'scrapedData', 'body' ])

  if (!headers) return state

  headers = cleanLines(headers)
  body = cleanLines(body)

  let words = headers.concat(body)

  if (words.length < um.minimumWordsToClassify) return state

  if (words.length > um.maximumWordsToClassify) words = words.slice(0, um.maximumWordsToClassify)

  const pageScore = um.NBWordVec(words, matrixData, priorData)

  state = userModelState.appendPageScoreToHistoryAndRotate(state, pageScore)

  const catNames = priorData.names

  const immediateMax = um.vectorIndexOfMax(pageScore)
  const immediateWinner = catNames[immediateMax].split('-')

  lastSingleClassification = immediateWinner

  const mutable = true
  const history = userModelState.getPageScoreHistory(state, mutable)

  const scores = um.deriveCategoryScores(history)
  const indexOfMax = um.vectorIndexOfMax(scores)
  const winnerOverTime = catNames[indexOfMax].split('-')
  appActions.onUserModelLog('Site visited', { url, immediateWinner, winnerOverTime })

  return state
}

const checkReadyAdServe = (state, windowId) => {  // around here is where you will check in with elph
  if (noop(state)) return state

  if (!foregroundP) { // foregroundP is sensible but questionable -SCL
    appActions.onUserModelLog('Ad not served', { reason: 'not in foreground' })

    return state
  }

  if (!userModelState.allowedToShowAdBasedOnHistory(state)) {
    appActions.onUserModelLog('Ad not served', { reason: 'not allowed based on history' })

    return state
  }

  // SCL uncomment when ready
  // let whatnext = elphSaysGo(state)
  // if (!whatnext) {
  //   appActions.onUserModelLog('Ad not served', { reason: 'elph says user unlikely to click' })
  //   state = userModelState.elphDeferRecorder(state)
  //   return state
  // }
  // let reset = true
  // state = userModelState.elphDeferRecorder(state, reset) // reset deferral counter

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
    appActions.onUserModelLog('Ad not served', { reason: 'no ad catalog' })

    return state
  }

  const catNames = priorData.names
  const mutable = true
  const history = userModelState.getPageScoreHistory(state, mutable)
  const scores = um.deriveCategoryScores(history)
  const indexOfMax = um.vectorIndexOfMax(scores)
  const category = catNames[indexOfMax]
  if (!category) {
    appActions.onUserModelLog('Ad not served', { reason: 'no category at offset indexOfMax', indexOfMax })

    return state
  }

// given 'sports-rugby-rugby world cup': try that, then 'sports-rugby', then 'sports'
  const hierarchy = category.split('-')
  let winnerOverTime, result

  for (let level in hierarchy) {
    winnerOverTime = hierarchy.slice(0, hierarchy.length - level).join('-')
    result = bundle.categories[winnerOverTime]
    if (result) break
  }
  if (!result) {
    appActions.onUserModelLog('Ad not served', { reason: 'no ads for category', category })

    return state
  }

  const seen = userModelState.getAdUUIDSeen(state)

  const adsSeen = result.filter(x => seen.get(x.uuid))
  let adsNotSeen = result.filter(x => !seen.get(x.uuid))
  const allSeen = (adsNotSeen.length <= 0)

  if (allSeen) {
    appActions.onUserModelLog('Ad round-robin', { category, adsSeen, adsNotSeen })
    // unmark all
    for (let i = 0; i < result.length; i++) state = userModelState.recordAdUUIDSeen(state, result[i].uuid, 0)
    adsNotSeen = adsSeen
  } // else - recordAdUUIDSeen - this actually only happens in click-or-close event capture in generateAdReportingEvent in this file

  // select an ad that isn't seen
  const arbitraryKey = randomKey(adsNotSeen)
  const payload = adsNotSeen[arbitraryKey]

  if (!payload) {
    appActions.onUserModelLog('Ad not served',
                              { reason: 'no ad for winnerOverTime', category, winnerOverTime, arbitraryKey })

    return state
  }

  const notificationText = payload.notificationText
  const notificationUrl = payload.notificationURL
  const advertiser = payload.advertiser
  if (!notificationText || !notificationUrl || !advertiser) {
    appActions.onUserModelLog('Ad not served',
                              { reason: 'incomplete ad information', category, winnerOverTime, arbitraryKey, notificationUrl, notificationText, advertiser })

    return state
  }

  const uuid = payload.uuid

  goAheadAndShowTheAd(windowId, advertiser, notificationText, notificationUrl, uuid)
  appActions.onUserModelLog(notificationTypes.AD_SHOWN,
                            {category, winnerOverTime, arbitraryKey, notificationUrl, notificationText, advertiser, uuid, hierarchy})

  return userModelState.appendAdShownToAdHistory(state)
}

const changeLocale = (state, locale) => {
  if (noop(state)) return state

  try { locale = um.setLocaleSync(locale) } catch (ex) {
    appActions.onUserModelLog('Locale error', { locale: locale, reason: ex.toString(), stack: ex.stack })

    return state
  }

  return userModelState.setLocale(state, locale)
}

const retrieveSSID = () => {
  // i am amazed by the lack of decent network reporting in node.js, as os.networkInterfaces() is useless for most things
  // the module below has to run an OS-specific system utility to get the SSID
  // and if we're not on WiFi, there is no reliable way to determine the actual interface in use

  getSSID((err, ssid) => {
    if (err) return appActions.onUserModelLog('SSID unavailable', { reason: err.toString() })

    appActions.onSSIDReceived(ssid)
  })
}

const generateAdUUIDString = () => {
  return uuidv4()
}

const generateAndSetAdUUIDRegardless = (state) => {
  return userModelState.setAdUUID(state, generateAdUUIDString())
}

const generateAndSetAdUUIDButOnlyIfDNE = (state) => {
  if (userModelState.getAdUUID(state) === undefined) state = generateAndSetAdUUIDRegardless(state)

  return state
}

const confirmAdUUIDIfAdEnabled = (state, adEnabled) => {
  if (adEnabled === undefined) adEnabled = userModelState.getAdEnabledValue(state)

  if (adEnabled) state = generateAndSetAdUUIDButOnlyIfDNE(state)

  return collectActivityAsNeeded(state, adEnabled)
}

let collectActivityId

const oneDay = (debugP ? 600 : 86400) * 1000
const oneHour = (debugP ? 25 : 3600) * 1000
const hackStagingOn = true
const roundTripOptions = {
  debugP: process.env.LEDGER_DEBUG === 'true',
  loggingP: process.env.LEDGER_LOGGING === 'true',
  verboseP: process.env.LEDGER_VERBOSE === 'true',
  server: urlParse('https://' + (hackStagingOn || testingP ? 'collector-staging.brave.com' : 'collector.brave.com'))
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
  if (noop(state)) return state

  const path = '/v1/reports/' + userModelState.getAdUUID(state)
  const events = userModelState.getReportingEventQueue(state).toJS()
  const mark = underscore.last(events)
  let stamp

  if (!mark) {
    appActions.onUserModelUploadLogs(null, oneDay, Immutable.Map())

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
        server: urlFormat(roundTripOptions.server),
        path: path,
        reason: err.toString()
      })

      if (response.statusCode !== 400) stamp = null
      result = { reason: err.toString() }
    }

    appActions.onUserModelUploadLogs(stamp, err ? oneHour : oneDay, result)
  })

  return state
}

const uploadLogs = (state, stamp, retryIn, result) => {
  if (noop(state)) return state

  const events = userModelState.getReportingEventQueue(state)
  const path = '/v1/surveys/reporter/' + userModelState.getAdUUID(state) + '?product=ads-test'
  let status = userModelState.getUserModelValue(state, 'status')
  const newState = result.getIn([ 'expirations', 'status' ])

  if (newState !== status) state = userModelState.setUserModelValue(state, 'status', status = newState)
  if (status === 'expired') appActions.onUserModelExpired()

  if (stamp) {
    const data = events.filter(entry => entry.get('stamp') > stamp)

    state = userModelState.setReportingEventQueue(state, data)
    appActions.onUserModelLog('Events uploaded', { result, events: { previous: state.size, current: data.size } })
  }

  if (collectActivityId) collectActivityId = setTimeout(appActions.onUserModelCollectActivity, retryIn)

  roundtrip({
    method: 'GET',
    path: path
  }, roundTripOptions, (err, response, surveys) => {
    if (!err) return appActions.onUserModelDownloadSurveys(surveys)

    appActions.onUserModelLog('Survey download failed', {
      method: 'GET',
      server: urlFormat(roundTripOptions.server),
      path: path,
      reason: err.toString()
    })
  })

  return state
}

const downloadSurveys = (state, surveys) => {
  if (noop(state)) return state

  appActions.onUserModelLog('Surveys downloaded', surveys)
  surveys = surveys.filter(survey => survey.get('status') === 'available')

  if (testingP) {
    const queue = userModelState.getUserSurveyQueue(state)

    surveys = surveys.filter(survey =>
                             !queue.some(entry => (survey.id === entry.id) && (entry.get('status') !== 'available')))
  }

  state = userModelState.setUserSurveyQueue(state, surveys)
  appActions.onUserModelLog('Surveys available', surveys)

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
    classifyPage,
    saveCachedInfo,
    changeLocale,
    collectActivity,
    uploadLogs,
    downloadSurveys,
    retrieveSSID,
    debouncedTimingUpdate,
    checkReadyAdServe
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
