/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const base64Encode = require('../../../js/lib/base64').encode
const underscore = require('underscore')
const moment = require('moment')

/**
 * Generates a contribution breakdown by publisher as a CSV data URL from an array of one or more transactions
 * @param {Object[]} transactions - array of transactions
 */
module.exports.transactionsToCSVDataURL = (transactions) => {
  const csvText = module.exports.getTransactionCSVText(transactions, null, true)
  return 'data:text/csv;base64,' + base64Encode(csvText)
}

/**
 * Filter an array of transactions by an array of viewingIds
 * @example
 * txUtil.getTransactionsByViewingIds(state.transactions, '0ef3a02d-ffdd-41f1-a074-7a7eb1e8c332')
 * // [ { viewingId: '0ef3a02d-ffdd-41f1-a074-7a7eb1e8c332',
 * //     surveyorId: 'DQfCj8PHdIEJOZp9/L+FZcozgvYoIVSjPSdwqRYQDr0',
 * //     contribution: { fiat: [Object], rates: [Object], satoshis: 813916, fee: 8858 },
 * //    ...
 * //    }]
 *
 * @param {Object[]} transactions - array of one or more ledger transactions objects (see `client.state.transactions` entries)
 * @param {string[]=} viewingIds - OPTIONAL array of one or more viewingIds to filter transactions (single string viewingId supported too)
 *                            if null or undefined, all transactions are returned
 */
module.exports.getTransactionsByViewingIds = (transactions, viewingIds) => {
  if (!transactions) {
    return []
  }
  if (!underscore.isArray(transactions)) {
    if (!underscore.isObject(transactions)) {
      return []
    }
    transactions = [transactions]
  }

  if (!viewingIds) {
    return transactions
  }

  if (viewingIds && typeof (viewingIds) === 'string') {
    viewingIds = [viewingIds]
  }
  if (viewingIds && !viewingIds.length) {
    viewingIds = null
  }

  if (!viewingIds) {
    return []
  }

  transactions = transactions.filter(function (tx) {
    return tx && tx.viewingId && (viewingIds.indexOf(tx.viewingId) > -1)
  })

  return transactions
}

/**
 * Gives a contribution summary for an array of one or more transactions
 * @example
 * txUtil.getTotalContribution(client.state.transactions)
 * // { satoshis: 1627832, fiat: { amount: 10, currency: 'USD' }, fee: 19900 }
 *
 * @param {Object[]} transactions - array of one or more ledger transactions objects (see `client.state.transactions` entries)
 * @param {string[]} viewingIds - OPTIONAL array/string containing one or more viewingIds to filter by
 *                            if null or undefined, all transactions are used
 */
module.exports.getTotalContribution = (transactions, viewingIds) => {
  const txs = module.exports.getTransactionsByViewingIds(transactions, viewingIds)

  const totalContribution = {
    satoshis: 0,
    fiat: { amount: 0, currency: null },
    fee: 0
  }

  for (let i = txs.length - 1; i >= 0; i--) {
    const tx = txs[i] || {}
    const txContribution = tx.contribution || {}

    totalContribution.satoshis += 0 || txContribution.satoshis

    if (txContribution.fiat) {
      if (!totalContribution.fiat.currency && txContribution.fiat.currency) {
        totalContribution.fiat.currency = txContribution.fiat.currency
      }

      if (totalContribution.fiat.currency === txContribution.fiat.currency) {
        totalContribution.fiat.amount += 0 || (txContribution.fiat && txContribution.fiat.amount)
      } else {
        throw new Error('ledgerUtil.totalContribution cannot handle multiple fiat currencies')
      }
    }

    totalContribution.fee += 0 || txContribution.fee
  }

  return totalContribution
}

/**
 * Gives a summary of votes/contributions by Publisher from an array of one or more transactions
 * @example
 * txUtil.getPublisherVoteData(client.state.transactions)
 * // {
 * //  'chronicle.com':
 * //     { votes: 2,
 * //       fraction: 0.04081632653061224,
 * //       contribution: { satoshis: 33221, fiat: 0.2040816326530612, currency: 'USD' } },
 * //  'waitbutwhy.com':
 * //     { votes: 3,
 * //       fraction: 0.061224489795918366,
 * //       contribution: { satoshis: 49832, fiat: 0.30612244897959184, currency: 'USD' } },
 * //  'archlinux.org':
 * //     { votes: 1,
 * //       fraction: 0.02040816326530612,
 * //       contribution: { satoshis: 16611, fiat: 0.1020408163265306, currency: 'USD' } },
 * //    /.../
 * // }
 *
 * @param {Object[]} transactions - array of transactions
 * @param {string[]=} viewingIds - OPTIONAL array/string with one or more viewingIds to filter transactions by (if empty, uses all tx)
 **/
module.exports.getPublisherVoteData = (transactions, viewingIds) => {
  transactions = module.exports.getTransactionsByViewingIds(transactions, viewingIds)

  const publishersWithVotes = {}
  let totalVotes = 0

  for (let i = transactions.length - 1; i >= 0; i--) {
    var tx = transactions[i]
    var ballots = tx.ballots

    if (!ballots) {
      continue
    }

    var publishersOnBallot = underscore.keys(ballots)

    for (var j = publishersOnBallot.length - 1; j >= 0; j--) {
      let publisher = publishersOnBallot[j]

      let voteDataForPublisher = publishersWithVotes[publisher] || {}

      let voteCount = ballots[publisher]
      let publisherVotes = (voteDataForPublisher.votes || 0) + voteCount
      totalVotes += voteCount

      voteDataForPublisher.votes = publisherVotes
      publishersWithVotes[publisher] = voteDataForPublisher
    }
  }

  var totalContributionAmountSatoshis = null
  var totalContributionAmountFiat = null
  var currency = null

  const totalContribution = module.exports.getTotalContribution(transactions)

  if (totalContribution) {
    totalContributionAmountSatoshis = totalContributionAmountSatoshis || totalContribution.satoshis
    totalContributionAmountFiat = totalContributionAmountFiat || (totalContribution.fiat && totalContribution.fiat.amount)
    currency = currency || (totalContribution.fiat && totalContribution.fiat.currency)
  }

  for (let publisher in publishersWithVotes) {
    const voteDataForPublisher = publishersWithVotes[publisher]
    let fraction = voteDataForPublisher.fraction = voteDataForPublisher.votes / totalVotes

    let contribution = voteDataForPublisher.contribution || {}
    if (totalContributionAmountSatoshis) {
      contribution.satoshis = Math.round(totalContributionAmountSatoshis * fraction)
    }
    if (totalContributionAmountFiat) {
      contribution.fiat = totalContributionAmountFiat * fraction
    }
    if (currency) {
      contribution.currency = currency
    }

    voteDataForPublisher.contribution = contribution

    publishersWithVotes[publisher] = voteDataForPublisher
  }

  return publishersWithVotes
}

/**
 * Generates a contribution breakdown by publisher in an array of CSV rows from an array of transactions
 * @example
 * txUtil.getTransactionCSVRows(client.state.transactions)
 * // [ ['Publisher,Votes,Fraction,BTC,USD'],
 * //   ['chronicle.com,2,0.04081632653061224,0.0000033221,0.20 USD'],
 * //   ['waitbutwhy.com,3,0.061224489795918366,0.0000049832,0.31 USD'],
 * //   ['archlinux.org,1,0.02040816326530612,0.0000016611,0.10 USD'],
 * //   /.../
 * // ]
 *
 * @param {Object[]} transactions - array of transactions
 * @param {string[]=} viewingIds - OPTIONAL array/string with one or more viewingIds to filter transactions by (if empty, uses all tx)
 * @param {boolean=} addTotalRow - OPTIONAL boolean indicating whether to add a TOTALS row (defaults false)
 **/
module.exports.getTransactionCSVRows = (transactions, viewingIds, addTotalRow, sortByContribution) => {
  let txContribData = module.exports.getPublisherVoteData(transactions, viewingIds)
  var publishers = (underscore.keys(txContribData) || [])

  let publisherSortFunction

  if (sortByContribution) {
    // sort publishers by contribution
    publisherSortFunction = function (a, b) {
      var getVotes = function (pubStr) {
        return (pubStr && typeof pubStr === 'string' && txContribData[pubStr] && txContribData[pubStr].votes ? parseInt(txContribData[pubStr].votes) : 0)
      }
      return (getVotes(a) > getVotes(b) ? -1 : 1)
    }
  } else {
    // sort publishers alphabetically by default (per spec)
    // TODO: take locale argument and pass to localeCompare below
    publisherSortFunction = function (a, b) {
      return (a && typeof a === 'string' ? a : '').localeCompare(b && typeof b === 'string' ? b : '')
    }
  }

  publishers = publishers.sort(publisherSortFunction)

  const currency = (publishers.length ? txContribData[publishers[0]].contribution.currency : 'USD')

  const headerRow = ['Publisher', 'Votes', 'Fraction', 'BTC', currency].join(',')

  var totalsRow = {
    label: 'TOTAL',
    votes: 0,
    fraction: 0,
    btc: 0,
    fiat: 0
  }

  var rows = [headerRow]

  rows = rows.concat(publishers.map(function (pub) {
    var pubRow = txContribData[pub]

    let rowBTC = pubRow.contribution.satoshis / Math.pow(10, 10)
    totalsRow.votes += pubRow.votes
    totalsRow.fraction += pubRow.fraction
    totalsRow.btc += rowBTC

    if (pubRow.contribution.currency === currency) {
      totalsRow.fiat += parseFloat(pubRow.contribution.fiat || '0')
    } else {
      throw new Error('ledgerExportUtil#getTransactionCSVRows does not support mixed currency data (yet)!')
    }

    return [
      pub,
      pubRow.votes,
      pubRow.fraction,
      rowBTC,
      pubRow.contribution.fiat.toFixed(2) + ' ' + pubRow.contribution.currency
    ].join(',')
  }))

  // note: do NOT add a total row if only header row is present (no data case)
  if (addTotalRow && rows.length > 1) {
    rows.push([
      totalsRow.label,
      totalsRow.votes,
      totalsRow.fraction,
      totalsRow.btc,
      totalsRow.fiat.toFixed(2) + ' ' + currency
    ].join(','))
  }

  return rows
}

/**
 * Generates a contribution breakdown by publisher in an array of CSV rows from an array of transactions
 * @example
 * txUtil.getTransactionCSVText(state.transactions)
 * // 'Publisher,Votes,Fraction,BTC,USD\nchronicle.com,2,0.04081632653061224,0.0000033221,0.20 USD\nwaitbutwhy.com,3,0.061224489795918366,0.0000049832,0.31 USD\narchlinux.org,1,0.02040816326530612,0.0000016611,0.10 USD /.../'
 *
 * @param {Object[]} transactions - array of transactions
 * @param {string[]=} viewingIds - OPTIONAL array/string with one or more viewingIds to filter transactions by (if empty, uses all tx)
 * @param {boolean=} addTotalRow - OPTIONAL boolean indicating whether to add a TOTALS row (defaults false)
 *
 * returns a CSV with only a header row if input is empty or invalid
 **/
module.exports.getTransactionCSVText = (transactions, viewingIds, addTotalRow) => {
  return module.exports.getTransactionCSVRows(transactions, viewingIds, addTotalRow).join('\n')
}

/**
 * Adds an `exportFilenamePrefix` field to the provided transaction(s)
 * of form `Brave_Payments_${YYYY-MM-DD}`, with "_<n>" added for the nth time a date occurs (n > 1)
 *
 * @param {Object[]} transactions - an array of transaction(s) or single transaction object
 *
 * @returns {Object[]} transactions (with each element having an added field `exportFilenamePrefix`)
 */
module.exports.addExportFilenamePrefixToTransactions = (transactions) => {
  transactions = transactions || []

  if (!underscore.isArray(transactions)) {
    transactions = [transactions]
  }

  if (!transactions.length) {
    return transactions
  }

  const dateCountMap = {}

  return transactions.map(function (transaction) {
    const timestamp = transaction.submissionStamp

    let numericDateStr = moment(new Date(timestamp)).format('YYYY-MM-DD')

    let dateCount = (dateCountMap[numericDateStr] ? dateCountMap[numericDateStr] : 1)
    dateCountMap[numericDateStr] = dateCount + 1

    if (dateCount > 1) {
      numericDateStr = `${numericDateStr}_${dateCount}`
    }

    transaction.exportFilenamePrefix = `Brave_Payments_${numericDateStr}`

    return transaction
  })
}
