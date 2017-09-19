/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const moment = require('moment')

// Utils
const {responseHasContent} = require('./httpUtil')
const {makeImmutable} = require('../../common/state/immutableUtil')

/**
 * Is page an actual page being viewed by the user? (not an error page, etc)
 * If the page is invalid, we don't want to collect usage info.
 * @param {Map} view - an entry from ['pageData', 'view']
 * @param {List} responseList - full ['pageData', 'load'] List
 * @return {boolean} true if page should have usage collected, false if not
 */
const shouldTrackView = (view, responseList) => {
  view = makeImmutable(view)

  if (view == null) {
    return false
  }

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

const btcToCurrencyString = (btc, ledgerData) => {
  const balance = Number(btc || 0)
  const currency = ledgerData.get('currency') || 'USD'

  if (balance === 0) {
    return `0 ${currency}`
  }

  if (ledgerData.get('btc') && typeof ledgerData.get('amount') === 'number') {
    const btcValue = ledgerData.get('btc') / ledgerData.get('amount')
    const fiatValue = (balance / btcValue).toFixed(2)
    let roundedValue = Math.floor(fiatValue)
    const diff = fiatValue - roundedValue

    if (diff > 0.74) {
      roundedValue += 0.75
    } else if (diff > 0.49) {
      roundedValue += 0.50
    } else if (diff > 0.24) {
      roundedValue += 0.25
    }

    return `${roundedValue.toFixed(2)} ${currency}`
  }

  return `${balance} BTC`
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
    const pendingFunds = Number(ledgerData.get('unconfirmed') || 0)

    if (pendingFunds + Number(ledgerData.get('balance') || 0) <
      0.9 * Number(ledgerData.get('btc') || 0)) {
      status.id = 'insufficientFundsStatus'
    } else if (pendingFunds > 0) {
      status.id = 'pendingFundsStatus'
      status.args = {funds: btcToCurrencyString(pendingFunds, ledgerData)}
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

module.exports = {
  shouldTrackView,
  btcToCurrencyString,
  formattedTimeFromNow,
  formattedDateFromTimestamp,
  walletStatus
}
