/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const {responseHasContent} = require('./httpUtil')
const moment = require('moment')

/**
 * Is page an actual page being viewed by the user? (not an error page, etc)
 * If the page is invalid, we don't want to collect usage info.
 * @param {Object} view - an entry from page_view (from EventStore)
 * @param {Object} responseList - full page_response array (from EventStore)
 * @return {boolean} true if page should have usage collected, false if not
 */
module.exports.shouldTrackView = (view, responseList) => {
  if (!view || !view.url || !view.tabId) {
    return false
  }
  if (!responseList || !Array.isArray(responseList) || !responseList.length) {
    return false
  }

  const tabId = view.tabId
  const url = view.url

  for (let i = responseList.length; i > -1; i--) {
    const response = responseList[i]

    if (!response) continue

    const responseUrl = response && response.details
      ? response.details.newURL
      : null

    if (url === responseUrl && response.tabId === tabId) {
      return responseHasContent(response.details.httpResponseCode)
    }
  }
  return false
}

module.exports.batToCurrencyString = (bat, ledgerData) => {
  const balance = Number(bat || 0)
  const currency = ledgerData.get('currency') || 'USD'

  if (balance === 0) {
    return `0 ${currency}`
  }

  const ledgerBat = ledgerData.get('bat')
  const amount = ledgerData.get('amount')

  if (ledgerBat && typeof amount === 'number') {
    const batValue = ledgerBat / amount
    const fiatValue = (balance / batValue).toFixed(2)
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

  return `${balance} BAT`
}

module.exports.formattedTimeFromNow = (timestamp) => {
  moment.locale(navigator.language)
  return moment(new Date(timestamp)).fromNow()
}

module.exports.formattedDateFromTimestamp = (timestamp, format) => {
  moment.locale(navigator.language)
  return moment(new Date(timestamp)).format(format)
}

module.exports.walletStatus = (ledgerData) => {
  let status = {}

  if (ledgerData.get('error')) {
    status.id = 'statusOnError'
  } else if (ledgerData.get('created')) {
    const transactions = ledgerData.get('transactions')
    const pendingFunds = Number(ledgerData.get('unconfirmed') || 0)

    if (pendingFunds + Number(ledgerData.get('balance') || 0) <
      0.9 * Number(ledgerData.get('bat') || 0)) {
      status.id = 'insufficientFundsStatus'
    } else if (pendingFunds > 0) {
      status.id = 'pendingFundsStatus'
      status.args = {funds: module.exports.batToCurrencyString(pendingFunds, ledgerData)}
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
