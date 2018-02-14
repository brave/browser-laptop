/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const underscore = require('underscore')
const format = require('date-fns/format')

/**
 * Filter an array of transactions by an array of viewingIds
 * @example
 * txUtil.getTransactionsByViewingIds(state.transactions, '0ef3a02d-ffdd-41f1-a074-7a7eb1e8c332')
 * // [ { viewingId: '0ef3a02d-ffdd-41f1-a074-7a7eb1e8c332',
 * //     surveyorId: 'DQfCj8PHdIEJOZp9/L+FZcozgvYoIVSjPSdwqRYQDr0',
 * //     contribution: { fiat: [Object], rates: [Object], fee: 8858 },
 * //    ...
 * //    }]
 *
 * @param {Object[]} transactions - array of one or more ledger transactions objects (see `client.state.transactions` entries)
 * @param {string[]=} viewingIds - OPTIONAL array of one or more viewingIds to filter transactions (single string viewingId supported too)
 *                            if null or undefined, all transactions are returned
 */
const getTransactionsByViewingIds = (transactions, viewingIds) => {
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

  if (typeof (viewingIds) === 'string') {
    viewingIds = [viewingIds]
  }
  if (!viewingIds.length) {
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
 * // { fiat: { amount: 10, currency: 'USD' }, fee: 19900 }
 *
 * @param {Object[]} transactions - array of one or more ledger transactions objects (see `client.state.transactions` entries)
 * @param {string[]} viewingIds - OPTIONAL array/string containing one or more viewingIds to filter by
 *                            if null or undefined, all transactions are used
 */
const getTotalContribution = (transactions, viewingIds) => {
  const txs = getTransactionsByViewingIds(transactions, viewingIds)

  const totalContribution = {
    fiat: { amount: 0, currency: null },
    fee: 0
  }

  for (let i = txs.length - 1; i >= 0; i--) {
    const tx = txs[i] || {}
    const txContribution = tx.contribution || {}

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
 * //       contribution: { fiat: 0.2040816326530612, currency: 'USD' } },
 * //  'waitbutwhy.com':
 * //     { votes: 3,
 * //       fraction: 0.061224489795918366,
 * //       contribution: { fiat: 0.30612244897959184, currency: 'USD' } },
 * //  'archlinux.org':
 * //     { votes: 1,
 * //       fraction: 0.02040816326530612,
 * //       contribution: { fiat: 0.1020408163265306, currency: 'USD' } },
 * //    /.../
 * // }
 *
 * @param {Object[]} transactions - array of transactions
 * @param {string[]=} viewingIds - OPTIONAL array/string with one or more viewingIds to filter transactions by (if empty, uses all tx)
 **/
const getPublisherVoteData = (transactions, viewingIds) => {
  transactions = getTransactionsByViewingIds(transactions, viewingIds)

  const publishersWithVotes = {}
  let totalVotes = 0

  for (let i = transactions.length - 1; i >= 0; i--) {
    const tx = transactions[i]
    const ballots = tx.ballots

    if (!ballots) {
      continue
    }

    const publishersOnBallot = underscore.keys(ballots)

    for (let j = publishersOnBallot.length - 1; j >= 0; j--) {
      let publisher = publishersOnBallot[j]

      let voteDataForPublisher = publishersWithVotes[publisher] || {}

      let voteCount = ballots[publisher]
      let publisherVotes = (voteDataForPublisher.votes || 0) + voteCount
      totalVotes += voteCount

      voteDataForPublisher.votes = publisherVotes
      publishersWithVotes[publisher] = voteDataForPublisher
    }
  }

  let totalContributionAmountFiat = null
  let currency = null

  const totalContribution = getTotalContribution(transactions)

  if (totalContribution) {
    totalContributionAmountFiat = totalContributionAmountFiat || (totalContribution.fiat && totalContribution.fiat.amount)
    currency = currency || (totalContribution.fiat && totalContribution.fiat.currency)
  }

  for (let publisher in publishersWithVotes) {
    const voteDataForPublisher = publishersWithVotes[publisher]
    let fraction = voteDataForPublisher.fraction = voteDataForPublisher.votes / totalVotes

    let contribution = voteDataForPublisher.contribution || {}
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
 * // [ ['Publisher,Votes,Fraction,USD'],
 * //   ['chronicle.com,2,0.04081632653061224,0.20 USD'],
 * //   ['waitbutwhy.com,3,0.061224489795918366,0.31 USD'],
 * //   ['archlinux.org,1,0.02040816326530612,0.10 USD'],
 * //   /.../
 * // ]
 *
 * @param {Object[]} transactions - array of transactions
 * @param {string[]=} viewingIds - OPTIONAL array/string with one or more viewingIds to filter transactions by (if empty, uses all tx)
 * @param {boolean=} addTotalRow - OPTIONAL boolean indicating whether to add a TOTALS row (defaults false)
 **/
const getTransactionCSVRows = (transactions, viewingIds, addTotalRow, sortByContribution) => {
  let txContribData = getPublisherVoteData(transactions, viewingIds)
  let publishers = (underscore.keys(txContribData) || [])

  let publisherSortFunction

  if (sortByContribution) {
    // sort publishers by contribution
    publisherSortFunction = function (a, b) {
      const getVotes = function (pubStr) {
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

  const headerRow = ['Publisher', 'Votes', 'Fraction', currency].join(',')

  let totalsRow = {
    label: 'TOTAL',
    votes: 0,
    fraction: 0,
    fiat: 0
  }

  let rows = [headerRow]

  rows = rows.concat(publishers.map(function (pub) {
    const pubRow = txContribData[pub]

    totalsRow.votes += pubRow.votes
    totalsRow.fraction += pubRow.fraction

    if (pubRow.contribution.currency === currency) {
      totalsRow.fiat += parseFloat(pubRow.contribution.fiat || '0')
    } else {
      throw new Error('ledgerExportUtil#getTransactionCSVRows does not support mixed currency data (yet)!')
    }

    return [
      pub,
      pubRow.votes,
      pubRow.fraction,
      pubRow.contribution.fiat.toFixed(2) + ' ' + pubRow.contribution.currency
    ].join(',')
  }))

  // note: do NOT add a total row if only header row is present (no data case)
  if (addTotalRow && rows.length > 1) {
    rows.push([
      totalsRow.label,
      totalsRow.votes,
      totalsRow.fraction,
      totalsRow.fiat.toFixed(2) + ' ' + currency
    ].join(','))
  }

  return rows
}

/**
 * Adds an `exportFilenamePrefix` field to the provided transaction(s)
 * of form `Brave_Payments_${YYYY-MM-DD}`, with "_<n>" added for the nth time a date occurs (n > 1)
 *
 * @param {Object[]} transactions - an array of transaction(s) or single transaction object
 *
 * @returns {Object[]} transactions (with each element having an added field `exportFilenamePrefix`)
 */
const addExportFilenamePrefixToTransactions = (transactions) => {
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

    let numericDateStr = format(new Date(timestamp), 'YYYY-MM-DD')

    let dateCount = (dateCountMap[numericDateStr] ? dateCountMap[numericDateStr] : 1)
    dateCountMap[numericDateStr] = dateCount + 1

    if (dateCount > 1) {
      numericDateStr = `${numericDateStr}_${dateCount}`
    }

    transaction.exportFilenamePrefix = `Brave_Payments_${numericDateStr}`

    return transaction
  })
}

const getMethods = () => {
  const publicMethods = {
    addExportFilenamePrefixToTransactions,
    getTransactionCSVRows
  }

  let privateMethods = {}

  if (process.env.NODE_ENV === 'test') {
    privateMethods = {
      getPublisherVoteData,
      getTotalContribution,
      getTransactionsByViewingIds
    }
  }

  return Object.assign({}, publicMethods, privateMethods)
}

module.exports = getMethods()
