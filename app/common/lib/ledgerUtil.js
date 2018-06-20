/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const format = require('date-fns/format')
const distanceInWordsToNow = require('date-fns/distance_in_words_to_now')
const BigNumber = require('bignumber.js')
const queryString = require('querystring')
const tldjs = require('tldjs')

// State
const siteSettingsState = require('../state/siteSettingsState')
const ledgerState = require('../state/ledgerState')
const ledgerVideoCache = require('../cache/ledgerVideoCache')

// Constants
const settings = require('../../../js/constants/settings')
const ledgerMediaProviders = require('../constants/ledgerMediaProviders')
const twitchEvents = require('../constants/twitchEvents')
const ledgerStatuses = require('../constants/ledgerStatuses')

// Utils
const {responseHasContent} = require('./httpUtil')
const urlUtil = require('../../../js/lib/urlutil')
const getSetting = require('../../../js/settings').getSetting
const urlParse = require('../urlParse')
const {makeImmutable} = require('../state/immutableUtil')

/**
 * Is page an actual page being viewed by the user? (not an error page, etc)
 * If the page is invalid, we don't want to collect usage info.
 * @param {Map} tabValue - data about provided tab
 * @return {boolean} true if page should have usage collected, false if not
 */
const shouldTrackView = (tabValue) => {
  if (tabValue == null) {
    return false
  }

  const aboutError = tabValue.has('aboutDetails')
  const activeEntry = tabValue.getIn(['navigationState', 'activeEntry']) || {}
  const response = activeEntry.httpStatusCode === 0 || responseHasContent(activeEntry.httpStatusCode)

  return !aboutError && response
}

const batToCurrencyString = (bat, ledgerData) => {
  const balance = Number(bat || 0)
  const currency = 'USD'

  if (balance === 0) {
    return `0.00 ${currency}`
  }

  const hasBeenUpgraded = ledgerData && ledgerData.hasIn(['rates', 'BTC'])
  if (ledgerData == null || !hasBeenUpgraded) {
    return ''
  }

  const rate = ledgerData.get('currentRate') || 0
  const converted = new BigNumber(new BigNumber(rate.toString())).times(balance).toFixed(2)
  return `${converted} ${currency}`
}

const formatCurrentBalance = (ledgerData, amount, showAlt = true) => {
  let currency = 'USD'
  let balance = 0
  let converted = 0
  let hasRate = false

  if (ledgerData != null) {
    balance = Number(amount || 0)
    converted = Number.parseFloat(ledgerData.get('converted')) || 0
    hasRate = showAlt ? ledgerData.has('currentRate') && ledgerData.hasIn(['rates', 'BTC']) : false
  }

  balance = balance.toFixed(2)

  if (converted > 0 && converted < 0.01) {
    converted = '< 0.01'
  } else {
    converted = converted.toFixed(2)
  }

  return `${balance} BAT${hasRate ? ` (${converted} ${currency})` : ''}`
}

const formattedTimeFromNow = (timestamp) => {
  return distanceInWordsToNow(new Date(timestamp), {locale: navigator.language})
}

const formattedDateFromTimestamp = (timestamp, dateFormat) => {
  return format(new Date(timestamp), dateFormat, {locale: navigator.language})
}

const walletStatus = (ledgerData, settings) => {
  let status = {}

  switch (ledgerData.get('status')) {
    case ledgerStatuses.FUZZING:
      {
        return {
          id: 'ledgerFuzzed'
        }
      }
  }

  if (ledgerData == null) {
    return {
      id: 'createWalletStatus'
    }
  }

  if (ledgerData.get('error')) {
    status.id = 'statusOnError'
  } else if (ledgerData.get('created')) {
    const transactions = ledgerData.get('transactions')
    const pendingFunds = Number(ledgerData.get('unconfirmed') || 0)
    const balance = Number(ledgerData.get('balance') || 0)
    const minBalance = ledgerState.getContributionAmount(null, ledgerData.get('contributionAmount'), settings) * 0.9

    if (pendingFunds + balance < minBalance) {
      status.id = 'insufficientFundsStatus'
    } else if (pendingFunds > 0) {
      const converted = batToCurrencyString(pendingFunds, ledgerData)
      status.id = 'pendingFundsStatus'
      status.args = {
        funds: `${pendingFunds.toFixed(2)} BAT${converted ? ` (${converted})` : ''}`
      }
    } else if (transactions && transactions.size > 0) {
      status.id = 'defaultWalletStatus'
    } else {
      status.id = 'createdWalletStatus'
    }
  } else if (ledgerData.get('creating')) {
    status.id = 'creatingWalletStatus'
  } else {
    status.id = 'createWalletStatus'
  }

  return status
}

const shouldShowMenuOption = (state, location) => {
  if (location == null) {
    return false
  }

  const publisherKey = tldjs.tldExists(location) && tldjs.getDomain(location)
  const validUrl = urlUtil.isURL(location) && urlParse(location).protocol !== undefined

  if (!publisherKey || !validUrl) {
    return false
  }

  const isVisible = visibleP(state, publisherKey)
  const isBlocked = blockedP(state, publisherKey)

  return (!isVisible && !isBlocked)
}

// TODO rename function
const blockedP = (state, publisherKey) => {
  const pattern = urlUtil.getHostPattern(publisherKey)
  const ledgerPaymentsShown = siteSettingsState.getSettingsProp(state, pattern, 'ledgerPaymentsShown')

  return ledgerPaymentsShown === false
}

// TODO rename
const contributeP = (state, publisherKey) => {
  const publisher = ledgerState.getPublisher(state, publisherKey)
  return (
    (stickyP(state, publisherKey) || publisher.getIn(['options', 'exclude']) !== true) &&
    eligibleP(state, publisherKey) &&
    !blockedP(state, publisherKey)
  )
}

// TODO rename function
const visibleP = (state, publisherKey) => {
  const publisher = ledgerState.getPublisher(state, publisherKey)
  let showOnlyVerified = ledgerState.getSynopsisOption(state, 'showOnlyVerified')

  if (showOnlyVerified == null) {
    showOnlyVerified = getSetting(settings.PAYMENTS_ALLOW_NON_VERIFIED)
    state = ledgerState.setSynopsisOption(state, 'showOnlyVerified', showOnlyVerified)
  }

  const pinPercentage = publisher.get('pinPercentage')
  const publisherOptions = publisher.get('options', Immutable.Map())
  const onlyVerified = !showOnlyVerified

  // Publisher Options
  const deletedByUser = blockedP(state, publisherKey)
  const eligibleByStats = eligibleP(state, publisherKey) // num of visits and time spent
  const verifiedPublisher = publisherOptions.get('verified')
  const isPinned = pinPercentage && pinPercentage > 0

  return ((
      eligibleByStats &&
      (
        (onlyVerified && verifiedPublisher) ||
        !onlyVerified
      )
    ) &&
    !deletedByUser) ||
    isPinned
}

// TODO rename function
const eligibleP = (state, publisherKey) => {
  const scorekeeper = ledgerState.getSynopsisOption(state, 'scorekeeper')
  const minPublisherDuration = ledgerState.getSynopsisOption(state, 'minPublisherDuration')
  const minPublisherVisits = ledgerState.getSynopsisOption(state, 'minPublisherVisits')
  const publisher = ledgerState.getPublisher(state, publisherKey)
  return (
    publisher.getIn(['scores', scorekeeper]) > 0 &&
    publisher.get('duration') >= minPublisherDuration &&
    publisher.get('visits') >= minPublisherVisits
  )
}

// TODO rename function
const stickyP = (state, publisherKey) => {
  const pattern = urlUtil.getHostPattern(publisherKey)
  let result = siteSettingsState.getSettingsProp(state, pattern, 'ledgerPayments')

  if (result == null) {
    const excluded = ledgerState.getPublisherOption(state, publisherKey, 'exclude')

    if (excluded != null) {
      result = !excluded
    }
  }

  return (result === undefined || result)
}

const getMediaId = (data, type) => {
  let id = null

  if (type == null || data == null) {
    return id
  }

  switch (type) {
    case ledgerMediaProviders.YOUTUBE:
      {
        id = data.docid
        break
      }
    case ledgerMediaProviders.TWITCH:
      {
        if (
          Object.values(twitchEvents).includes(data.event) &&
          data.properties
        ) {
          id = data.properties.channel
          let vod = data.properties.vod

          if (vod) {
            vod = vod.replace('v', '')
            id += `_vod_${vod}`
          }
        }
      }
  }

  return id
}

const getMediaKey = (id, type) => {
  if (id == null || type == null) {
    return null
  }

  return `${type.toLowerCase()}_${id}`
}

const getMediaData = (xhr, type, details) => {
  let result = null

  if (xhr == null || type == null) {
    return result
  }

  const parsedUrl = urlParse(xhr)
  const query = parsedUrl && parsedUrl.query

  if (!parsedUrl) {
    return null
  }

  switch (type) {
    case ledgerMediaProviders.YOUTUBE:
      {
        if (!query) {
          return null
        }

        result = queryString.parse(query)
        break
      }
    case ledgerMediaProviders.TWITCH:
      {
        const uploadData = details.get('uploadData') || Immutable.List()

        if (uploadData.size === 0) {
          result = null
          break
        }

        let params = uploadData.reduce((old, item) => {
          const bytes = item.get('bytes')
          let data = ''
          if (bytes) {
            data = Buffer.from(bytes).toString('utf8') || ''
          }
          return old + data
        }, '')

        if (!params || params.length === 0) {
          result = null
          break
        }

        const paramQuery = queryString.parse(params)

        if (!paramQuery || !paramQuery.data) {
          result = null
          break
        }

        let obj = Buffer.from(paramQuery.data, 'base64').toString('utf8')
        if (obj == null) {
          result = null
          break
        }

        let parsed
        try {
          parsed = JSON.parse(obj)
        } catch (error) {
          result = null
          console.error(error.toString(), obj)
          break
        }

        result = parsed
        break
      }
  }

  return result
}

const getMediaDuration = (state, data, mediaKey, type) => {
  let duration = 0

  if (data == null) {
    return duration
  }

  switch (type) {
    case ledgerMediaProviders.YOUTUBE:
      {
        duration = getYouTubeDuration(data)
        break
      }
    case ledgerMediaProviders.TWITCH:
      {
        duration = getTwitchDuration(state, data, mediaKey)
        break
      }
  }

  return duration
}

const generateMediaCacheData = (state, parsed, type, mediaKey) => {
  let data = Immutable.Map()

  if (parsed == null) {
    return data
  }

  switch (type) {
    case ledgerMediaProviders.TWITCH:
      {
        data = generateTwitchCacheData(state, parsed, mediaKey)
        break
      }
  }

  return data
}

const generateTwitchCacheData = (state, parsed, mediaKey) => {
  if (parsed == null) {
    return Immutable.Map()
  }

  const statusConst = {
    playing: 'playing',
    paused: 'paused'
  }

  const previousData = ledgerVideoCache.getDataByVideoId(state, mediaKey)
  let status = statusConst.playing

  if (
    (
      parsed.event === twitchEvents.PLAY_PAUSE &&
      previousData.get('event') !== twitchEvents.PLAY_PAUSE
    ) || // user clicked pause (we need to exclude seeking while paused)
    (
      parsed.event === twitchEvents.PLAY_PAUSE &&
      previousData.get('event') === twitchEvents.PLAY_PAUSE &&
      previousData.get('status') === statusConst.playing
    ) || // user clicked pause as soon as he clicked played
    (
      parsed.event === twitchEvents.SEEK &&
      previousData.get('status') === statusConst.paused
    ) // seeking video while it is paused
  ) {
    status = statusConst.paused
  }

  // User pauses a video, then seek it and play it again
  if (
    parsed.event === twitchEvents.PLAY_PAUSE &&
    previousData.get('event') === twitchEvents.SEEK &&
    previousData.get('status') === statusConst.paused
  ) {
    status = statusConst.playing
  }

  if (parsed.properties) {
    return Immutable.fromJS({
      event: parsed.event,
      time: parsed.properties.time,
      status
    })
  }

  return Immutable.fromJS({
    event: parsed.event,
    status
  })
}

const getDefaultMediaFavicon = (providerName) => {
  let image = null

  if (!providerName) {
    return image
  }

  providerName = providerName.toLowerCase()

  switch (providerName) {
    case ledgerMediaProviders.YOUTUBE:
      {
        image = require('../../../img/mediaProviders/youtube.png')
        break
      }
    case ledgerMediaProviders.TWITCH:
      {
        image = require('../../../img/mediaProviders/twitch.svg')
        break
      }
  }

  return image
}

const getTwitchDuration = (state, data, mediaKey) => {
  if (data == null || mediaKey == null || !data.properties) {
    return 0
  }

  const previousData = ledgerVideoCache.getDataByVideoId(state, mediaKey)

  // remove duplicate events
  if (
    previousData.get('event') === data.event &&
    previousData.get('time') === data.properties.time
  ) {
    return null
  }

  const oldEvent = previousData.get('event')
  const twitchMinimumSeconds = 10

  if (data.event === twitchEvents.START && oldEvent === twitchEvents.START) {
    return 0
  }

  if (data.event === twitchEvents.START) {
    return twitchMinimumSeconds * milliseconds.second
  }

  let time = 0
  const currentTime = parseFloat(data.properties.time)
  const oldTime = parseFloat(previousData.get('time'))
  const currentEvent = data.event

  if (oldEvent === twitchEvents.START) {
    // From video play event to x event
    time = currentTime - oldTime - twitchMinimumSeconds
  } else if (
    currentEvent === twitchEvents.MINUTE_WATCHED || // Minute watched
    currentEvent === twitchEvents.BUFFER_EMPTY || // Run out of buffer
    currentEvent === twitchEvents.VIDEO_ERROR || // Video has some problems
    currentEvent === twitchEvents.END || // Video ended
    (currentEvent === twitchEvents.SEEK && previousData.get('status') !== 'paused') || // Vod seek
    (
      currentEvent === twitchEvents.PLAY_PAUSE &&
      (
        (
          oldEvent !== twitchEvents.PLAY_PAUSE &&
          oldEvent !== twitchEvents.SEEK
        ) ||
        previousData.get('status') === 'playing'
      )
    ) // User paused a video
  ) {
    time = currentTime - oldTime
  }

  if (isNaN(time)) {
    return 0
  }

  if (time < 0) {
    return 0
  }

  if (time > 120) {
    time = 120 // 2 minutes
  }

  // we get seconds back, so we need to convert it into ms
  time = time * milliseconds.second

  return time
}

const getYouTubeDuration = (data) => {
  let time = 0

  if (data == null || data.st == null || data.et == null) {
    return time
  }

  const startTime = data.st.split(',')
  const endTime = data.et.split(',')

  if (startTime.length !== endTime.length) {
    return time
  }

  for (let i = 0; i < startTime.length; i++) {
    time += parseFloat(endTime[i]) - parseFloat(startTime[i])
  }

  // we get seconds back, so we need to convert it into ms
  time = time * 1000

  return parseInt(time)
}

const getMediaProvider = (url, firstPartyUrl, referrer) => {
  let provider = null

  if (url == null) {
    return provider
  }

  // Youtube
  if (url.startsWith('https://www.youtube.com/api/stats/watchtime?')) {
    return ledgerMediaProviders.YOUTUBE
  }

  // Twitch
  if (
    (
      (firstPartyUrl && firstPartyUrl.startsWith('https://www.twitch.tv/')) ||
      (referrer && referrer.startsWith('https://player.twitch.tv/'))
    ) &&
    (
      url.includes('.ttvnw.net/v1/segment/') ||
      url.includes('https://ttvnw.net/v1/segment/')
    )
  ) {
    return ledgerMediaProviders.TWITCH
  }

  return provider
}

const hasRequiredVisits = (state, publisherKey) => {
  if (!publisherKey) {
    return false
  }

  state = makeImmutable(state) || Immutable.Map()

  const minimumVisits = parseInt(getSetting(settings.PAYMENTS_MINIMUM_VISITS))

  if (minimumVisits === 1) {
    return true
  }

  const publisher = ledgerState.getPublisher(state, publisherKey)
  const publisherVisits = publisher.get('visits')

  if (typeof publisherVisits !== 'number') {
    return minimumVisits === 1
  }

  const visitDifference = minimumVisits - publisherVisits

  return (visitDifference === 1)
}

const getRemainingRequiredTime = (state, publisherKey) => {
  state = makeImmutable(state) || Immutable.Map()
  const minimumVisitTime = parseInt(getSetting(settings.PAYMENTS_MINIMUM_VISIT_TIME))

  if (!publisherKey) {
    return minimumVisitTime
  }

  const publisher = ledgerState.getPublisher(state, publisherKey)
  const publisherDuration = publisher.get('duration')

  if (
    typeof publisherDuration !== 'number' ||
    publisherDuration >= minimumVisitTime
  ) {
    return minimumVisitTime
  }

  return (minimumVisitTime - publisherDuration)
}

const probiToFormat = (amount) => {
  if (!amount) {
    return 0
  }

  try {
    return new BigNumber(amount.toString()).dividedBy('1e18').toNumber()
  } catch (e) {
    return 0
  }
}

const defaultMonthlyAmounts = Immutable.List([5.0, 7.5, 10.0, 17.5, 25.0, 50.0, 75.0, 100.0])

const milliseconds = {
  year: 365 * 24 * 60 * 60 * 1000,
  month: (365 * 24 * 60 * 60 * 1000) / 12,
  week: 7 * 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000
}

const getMethods = () => {
  const publicMethods = {
    shouldTrackView,
    batToCurrencyString,
    formattedTimeFromNow,
    formattedDateFromTimestamp,
    walletStatus,
    blockedP,
    contributeP,
    visibleP,
    eligibleP,
    stickyP,
    formatCurrentBalance,
    getMediaId,
    getMediaDuration,
    getMediaProvider,
    getMediaData,
    getMediaKey,
    milliseconds,
    defaultMonthlyAmounts,
    getDefaultMediaFavicon,
    generateMediaCacheData,
    shouldShowMenuOption,
    hasRequiredVisits,
    getRemainingRequiredTime,
    probiToFormat
  }

  let privateMethods = {}

  if (process.env.NODE_ENV === 'test') {
    privateMethods = {
      getYouTubeDuration,
      getTwitchDuration,
      generateTwitchCacheData
    }
  }

  return Object.assign({}, publicMethods, privateMethods)
}

module.exports = getMethods()
