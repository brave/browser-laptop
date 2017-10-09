/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const moment = require('moment')
const BigNumber = require('bignumber.js')

// State
const siteSettingsState = require('../state/siteSettingsState')
const ledgerState = require('../state/ledgerState')

// Constants
const settings = require('../../../js/constants/settings')

// Utils
const {responseHasContent} = require('./httpUtil')
const urlUtil = require('../../../js/lib/urlutil')
const {makeImmutable} = require('../state/immutableUtil')
const getSetting = require('../../../js/settings').getSetting

/**
 * Is page an actual page being viewed by the user? (not an error page, etc)
 * If the page is invalid, we don't want to collect usage info.
 * @param {Map} view - an entry from ['pageData', 'view']
 * @param {List} responseList - full ['pageData', 'load'] List
 * @return {boolean} true if page should have usage collected, false if not
 */
const shouldTrackView = (view, responseList) => {
  if (view == null) {
    return false
  }

  view = makeImmutable(view)
  const tabId = view.get('tabId')
  const url = view.get('url')

  if (!url || !tabId) {
    return false
  }

  responseList = makeImmutable(responseList)
  if (!responseList || responseList.size === 0) {
    return false
  }

  for (let i = (responseList.size - 1); i > -1; i--) {
    const response = responseList.get(i)

    if (!response) {
      continue
    }

    const responseUrl = response.getIn(['details', 'newURL'], null)

    if (url === responseUrl && response.get('tabId') === tabId) {
      return responseHasContent(response.getIn(['details', 'httpResponseCode']))
    }
  }

  return false
}

const batToCurrencyString = (bat, ledgerData) => {
  const balance = Number(bat || 0)
  const currency = (ledgerData && ledgerData.get('currency')) || 'USD'

  if (balance === 0 || ledgerData == null) {
    return `0 ${currency}`
  }

  const rate = ledgerData.get('currentRate') || 0
  const converted = new BigNumber(new BigNumber(rate.toString())).times(balance).toFixed(2)
  return `${converted} ${currency}`
}

const formatCurrentBalance = (ledgerData) => {
  let currency = 'USD'
  let balance = 0
  let converted = 0
  let hasRate = false

  if (ledgerData != null) {
    currency = ledgerData.get('currency') || 'USD'
    balance = Number(ledgerData.get('balance') || 0)
    converted = Number.parseFloat(ledgerData.get('converted')) || 0
    hasRate = ledgerData.has('currentRate')
  }

  balance = balance.toFixed(2)
  converted = converted.toFixed(2)

  return `${balance} BAT${hasRate ? ` (${converted} ${currency})` : ''}`
}

const formattedTimeFromNow = (timestamp) => {
  moment.locale(navigator.language)
  return moment(new Date(timestamp)).fromNow()
}

const formattedDateFromTimestamp = (timestamp, format) => {
  moment.locale(navigator.language)
  return moment(new Date(timestamp)).format(format)
}

const walletStatus = (ledgerData) => {
  let status = {}

  if (ledgerData.get('error')) {
    status.id = 'statusOnError'
  } else if (ledgerData.get('created')) {
    const transactions = ledgerData.get('transactions')
    const pendingFunds = Number(ledgerData.get('unconfirmed') || 0).toFixed(2)

    if (pendingFunds + Number(ledgerData.get('balance') || 0) <
      0.9 * Number(ledgerData.get('bat') || 0)) {
      status.id = 'insufficientFundsStatus'
    } else if (pendingFunds > 0) {
      status.id = 'pendingFundsStatus'
      status.args = {funds: `${pendingFunds} BAT (${batToCurrencyString(pendingFunds, ledgerData)})`}
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

  const publisherOptions = publisher.get('options', Immutable.Map())
  const onlyVerified = !showOnlyVerified

  // Publisher Options
  const deletedByUser = blockedP(state, publisherKey)
  const eligibleByStats = eligibleP(state, publisherKey) // num of visits and time spent
  const verifiedPublisher = publisherOptions.get('verified')

  return (
      eligibleByStats &&
      (
        (onlyVerified && verifiedPublisher) ||
        !onlyVerified
      )
    ) &&
    !deletedByUser
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

module.exports = {
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
  formatCurrentBalance
}
