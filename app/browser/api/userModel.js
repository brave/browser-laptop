/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const um = require('@brave-intl/bat-usermodel')
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
const searchProviders = require('../../../js/data/searchProviders').providers
const settings = require('../../../js/constants/settings')

// State
const windows = require('../windows')
const appStore = require('../../../js/stores/appStore')
const userModelState = require('../../common/state/userModelState')
const getSetting = require('../../../js/settings').getSetting
const Immutable = require('immutable')
const tabState = require('../../common/state/tabState')

// Utils
const urlParse = require('../../common/urlParse')
const urlParse2 = require('url').parse
const roundtrip = require('./ledger').roundtrip

const debugP = (process.env.NODE_ENV === 'test') || (process.env.LEDGER_VERBOSE === 'true')
const testingP = true
let nextEasterEgg = 0

let initP
let foregroundP
let onceP
let userModelOptions = {}

let matrixData
let priorData
let sampleAdFeed

let lastSingleClassification
let pageScoreCache = {}

let adTabUrl

const noop = (state) => {
// IF [ we haven't initialized yet OR we're not enabled ], RETURN state

  return (((!matrixData) || (!priorData) || (!userModelState.getAdEnabledValue(state))) && state)
}

const generateAdReportingEvent = (state, eventType, action) => {
  if (noop(state)) return state

  if (!onceP) {
    onceP = true

    state = generateAdReportingEvent(state, 'restart', action)

    const revision = parseInt(underscore.last(app.getVersion().split('.')), 10)
    if (revision >= 3000) userModelOptions.noEventLogging = true
    appActions.onUserModelLog('Options', userModelOptions)
  }

  const map = { type: eventType, stamp: new Date().toISOString() }

  // additional event data
  switch (eventType) {
    case 'notify':
      {
        const eventName = action.get('eventName')
        const data = action.get('data')

        switch (eventName) {
          case notificationTypes.NOTIFICATION_SHOWN:
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

              if (map.notificationType === 'clicked') {
                let cb = (preservedState, adTabUrl) => {
                  const oldState = preservedState
                  const latestState = appStore.getState()

                  const oldTabValue = tabState.getByTabId(oldState, tabState.TAB_ID_ACTIVE)
                  // Note: if the app is backgrounded, this is undefined
                  const latestTabValue = tabState.getByTabId(latestState, tabState.TAB_ID_ACTIVE)

                  // some of these unused variables are present because we expect
                  // the stillViewingAd logic to change (and to use them)
                  let latestWindowId // eslint-disable-line no-unused-vars
                  let latestTabId    // eslint-disable-line no-unused-vars
                  let latestUrl

                  let oldWindowId    // eslint-disable-line no-unused-vars
                  let oldTabId       // eslint-disable-line no-unused-vars
                  let oldUrl         // eslint-disable-line no-unused-vars

                  if (latestTabValue) {
                    latestWindowId = latestTabValue.get('windowId')
                    latestTabId = latestTabValue.get('tabId')
                    latestUrl = latestTabValue.get('url')
                  }

                  if (oldTabValue) {
                    oldWindowId = oldTabValue.get('windowId')
                    oldTabId = oldTabValue.get('tabId')
                    oldUrl = oldTabValue.get('url')
                  }

                  // When the timer starts, the ad-tab hasn't opened, so we need to check the url,
                  // unless we wish to add a lot of logic to new ad-tabs.
                  // this fails on redirects of course
                  let stillViewingAd = (adTabUrl === latestUrl)

                  if (stillViewingAd) {
                    appActions.onUserModelSustainedAdInteraction({'uuid': uuid, 'url': latestUrl, 'tabId': latestTabId})
                  }
                }

                // see if the user is still viewing the ad-tab N seconds after opening via ad-click
                const delayMillis = 10 * 1000
                setTimeout(cb, delayMillis, state, adTabUrl)
              }
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

        const tabId = tabValue.get('tabId')
        map.tabId = String(tabId)
        map.tabType = 'click'

        const searchState = userModelState.getSearchState(state)

        if (searchState) map.tabType = 'search'
        map.tabUrl = tabUrl

        let classification = lastSingleClassification || []

        if (!Array.isArray(classification)) classification = classification.toArray()
        map.tabClassification = classification

        let cachedValue = pageScoreCache[tabId] || {}
        if (cachedValue.url === tabUrl) map.pageScore = cachedValue.pageScore

        const now = underscore.now()
        if ((testingP) && (tabUrl === 'https://www.iab.com/') && (nextEasterEgg < now)) {
          nextEasterEgg = now + (30 * 1000)

          state = checkReadyAdServe(state, windows.getActiveWindowId(), true)
        }
        break
      }

    case 'sustain':
      {
        const data = action.get('data')

        map.type = 'notify'
        map.notificationId = data.get('uuid')
        map.notificationType = 'viewed'
        break
      }

    case 'blur':
      {
        map.tabId = String(action.get('tabValue').get('tabId'))
        break
      }

    case 'destroy':
    case 'focus':
      {
        map.tabId = String(action.get('tabId'))
        break
      }

    case 'settings':
      {
        const key = action.get('key')
        const mapping = underscore.invert({
          place: settings.ADS_PLACE,
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
  // site history removal happens on legit issues like site fails to load.
  // removing All History absolutely can't happen here.
  // other than (possibly) the temporary logging facility, these sites are never
  // really logged in this state anyway -SCL
  return state
}

const removeAllHistory = (state) => {
  const locales = userModelState.getUserModelValue(state, 'locales')
  state = userModelState.removeAllHistory(state)
  state = processLocales(state, locales)
  return confirmAdUUIDIfAdEnabled(state)
}

const saveCachedInfo = (state) => {
  return state
}

const amazonSearchQueryFields = ['field-keywords', 'keywords']

const extractURLKeywordsByField = (url, queryFields) => {
  const parsed = urlParse2(url, true)
  const query = parsed.query

  let found = []

  for (let field of queryFields) {
    let sentence = query[field]

    if (!sentence) {
      continue
    }

    let words = sentence.split(' ')
    found = found.concat(words)
  }

  return found
}

const testShoppingData = (state, url) => {
  if (noop(state)) return state
  const hostname = urlParse(url).hostname
  const lastShopState = userModelState.getShoppingState(state)

  if (hostname === 'www.amazon.com') {
    const score = 1.0   // eventually this will be more sophisticated than if(), but amazon is always a shopping destination
    state = userModelState.flagShoppingState(state, url, score)
    const keywords = extractURLKeywordsByField(url, amazonSearchQueryFields)
    console.log('keywords: ', keywords)
  } else if (hostname !== 'www.amazon.com' && lastShopState) { // do we need lastShopState? assumes amazon queries hostname changes
    state = userModelState.unFlagShoppingState(state)
  }
  return state
}

const testSearchState = (state, url) => {
  if (noop(state)) return state

  const hostname = urlParse(url).hostname
  const lastSearchState = userModelState.getSearchState(state)

  let wasASearch = false
  const href = urlParse(url).href

  for (let provider of searchProviders) {
    const providerUrl = provider.base
    const providerHostname = urlParse(providerUrl).hostname

    const isSearchEngine = provider.anyVisitToBaseDomainIsSearch

    if (isSearchEngine && hostname === providerHostname) {
      wasASearch = true
      break
    }

    const prefix = provider.search
    const x = prefix.indexOf('{')

    if (x > 0 && href.indexOf(prefix.substr(0, x)) !== -1) {
      wasASearch = true
      break
    }
  }

  if (wasASearch) {
    state = userModelState.flagSearchState(state, url, 1.0)
  } else if (lastSearchState) {
    state = userModelState.unFlagSearchState(state, url)
  }

  return state
}

const recordUnIdle = (state) => {
  return userModelState.setLastUserIdleStopTime(state)
}

const mediaTabs = {}

const recordMediaPlaying = (state, active, tabId) => {
  if (active) mediaTabs[tabId] = true
  else delete mediaTabs[tabId]

  console.log('recordMediaPlaying: ' + underscore.size(mediaTabs) + ' active media tags')
  return state
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

const goAheadAndShowTheAd = (state, windowId, notificationTitle, notificationText, notificationUrl, uuid, notificationId) => {
  appActions.nativeNotificationCreate(
    windowId,
    {
      title: notificationTitle,
      message: notificationText,
      icon: process.env.NODE_ENV === 'development'
        ? path.join(__dirname, '../../extensions/brave/img/BAT_icon.png')
        : path.normalize(path.join(process.resourcesPath, 'extensions', 'brave', 'img', 'BAT_icon.png')),
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

  adTabUrl = notificationUrl
}

const classifyPage = (state, action, windowId) => {
  if (noop(state)) return state

  console.log('\n\nclassifyPage: ' + JSON.stringify(action, null, 2))
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
  appActions.onUserModelLog('Site visited', { url, immediateWinner, winnerOverTime, pageScore })

  pageScoreCache[action.get('tabId')] = { url, pageScore }

  return state
}

const checkReadyAdServe = (state, windowId, forceP) => {
  if (noop(state)) return state

  if (!forceP) {
    if (!foregroundP) { // foregroundP is sensible but questionable -SCL
      appActions.onUserModelLog('Notification not made', { reason: 'not in foreground' })

      return state
    }

    if (!userModelState.allowedToShowAdBasedOnHistory(state)) {
      appActions.onUserModelLog('Notification not made', { reason: 'not allowed based on history' })

      return state
    }

  // NB: temporary survey logic for beta
    const first = userModelState.getUserModelValue(state, 'firstContactTimestamp')
    const finale = userModelState.getUserModelValue(state, 'finalContactTimestamp')
    if (first && finale) {
      const surveys = userModelState.getUserSurveyQueue(state).toJS()
      const available = underscore.where(surveys, { status: 'available' }) || []
      const complete = underscore.where(surveys, { status: 'complete' }) || []
      const survey = underscore.first(available)
      const delta = (finale - first) - (2 * 86400 * 1000)
      const ratio = survey ? ((complete.length + 1) / (available.length + complete.length)) : 1
      const allowed = first + (ratio * delta)

      appActions.onUserModelLog('Survey calculation', {
        available: available.length, complete: complete.length, surveyP: !!survey, delta, ratio, allowed, now: underscore.now()
      })
      if ((survey) && (allowed <= underscore.now())) {
        survey.status = 'display'
        survey.status_at = new Date().toISOString()
        state = userModelState.setUserSurveyQueue(state, Immutable.fromJS(surveys))

        goAheadAndShowTheAd(state, windowId, survey.title, survey.description, survey.url, generateAdUUIDString(),
                            notificationTypes.SURVEYS)
        appActions.onUserModelLog(notificationTypes.SURVEY_SHOWN, survey)

        return state
      }
    }
  }

  const catNames = priorData.names
  const mutable = true
  const history = userModelState.getPageScoreHistory(state, mutable)
  const scores = um.deriveCategoryScores(history)
  const indexOfMax = um.vectorIndexOfMax(scores)
  const category = catNames[indexOfMax]
  if (!category) {
    appActions.onUserModelLog('Notification not made', { reason: 'no category at offset indexOfMax', indexOfMax })

    return state
  }

  return serveAdFromCategory(state, windowId, category)
}

const serveAdFromCategory = (state, windowId, category) => {
  const bundle = sampleAdFeed
  if (!bundle) {
    appActions.onUserModelLog('Notification not made', { reason: 'no ad catalog' })

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
    appActions.onUserModelLog('Notification not made', { reason: 'no ads for category', category })

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
    appActions.onUserModelLog('Notification not made',
                              { reason: 'no ad for winnerOverTime', category, winnerOverTime, arbitraryKey })

    return state
  }

  const notificationText = payload.notificationText
  const notificationUrl = payload.notificationURL
  const advertiser = payload.advertiser
  if (!notificationText || !notificationUrl || !advertiser) {
    appActions.onUserModelLog('Notification not made',
                              { reason: 'incomplete ad information', category, winnerOverTime, arbitraryKey, notificationUrl, notificationText, advertiser })

    return state
  }

  const uuid = payload.uuid

  goAheadAndShowTheAd(state, windowId, advertiser, notificationText, notificationUrl, uuid)
  appActions.onUserModelLog(notificationTypes.NOTIFICATION_SHOWN,
                            {category, winnerOverTime, arbitraryKey, notificationUrl, notificationText, advertiser, uuid, hierarchy})

  return userModelState.appendAdShownToAdHistory(state)
}

const serveSampleAd = (state, windowId) => {
  if (noop(state)) return state

  const catNames = priorData.names
  const indexOfCategory = (catNames.length * Math.random()) << 0
  const category = catNames[indexOfCategory]

  return serveAdFromCategory(state, windows.getActiveWindowId(), category)
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
const hackStagingOn = process.env.COLLECTOR_DEBUG === 'true'
const roundTripOptions = {
  debugP: process.env.LEDGER_DEBUG === 'true',
  loggingP: process.env.LEDGER_LOGGING === 'true',
  verboseP: process.env.LEDGER_VERBOSE === 'true',
  server: urlParse('https://' + (hackStagingOn ? 'collector-staging.brave.com'
                                 : testingP ? 'collector-testing.brave.com' : 'collector.brave.com'))
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
  const now = new Date()
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

  let offset = -new Date().getTimezoneOffset()
  const sign = offset < 0 ? '-' : '+'

  offset = Math.abs(offset)

  let hh = parseInt(offset / 60)
  if (hh < 9) hh = '0' + hh

  let mm = offset % 60
  if (mm < 9) mm = '0' + mm

  roundtrip({
    method: 'PUT',
    path: path,
    payload: {
      braveVersion: app.getVersion(),
      platform: { darwin: 'mac', win32: os.arch() === 'x32' ? 'winia32' : 'winx64' }[os.platform()] || 'linux',
      reportId: mark.uuid,
      reportStamp: now.toISOString(),
      reportTZO: sign + hh + ':' + mm,
      events: userModelOptions.noEventLogging ? [] : events
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

  if (newState) {
    if (newState !== status) state = userModelState.setUserModelValue(state, 'status', status = newState)
    if (status === 'expired') appActions.onUserModelExpired()
  }
  if (status === 'active') {
    let first = result.getIn([ 'expirations', 'first_contact_ts' ])
    let finale = result.getIn([ 'expirations', 'expires_at_ts' ])

    first = (new Date(first)).getTime()
    if (first) state = userModelState.setUserModelValue(state, 'firstContactTimestamp', first)
    finale = (new Date(finale)).getTime()
    if (finale) state = userModelState.setUserModelValue(state, 'finalContactTimestamp', finale)
  }

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
  surveys = surveys.sortBy(survey => survey.get('created_at'))
    .filter(survey => survey.get('status') === 'available' || survey.get('status') === 'complete')
  appActions.onUserModelLog('Surveys available', surveys)

  return userModelState.setUserSurveyQueue(state, surveys)
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
    recordMediaPlaying,
    classifyPage,
    saveCachedInfo,
    changeLocale,
    collectActivity,
    uploadLogs,
    downloadSurveys,
    retrieveSSID,
    checkReadyAdServe,
    serveSampleAd
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
