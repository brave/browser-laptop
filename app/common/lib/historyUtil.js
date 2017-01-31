/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const {makeImmutable} = require('../state/immutableUtil')
const siteUtil = require('../../../js/state/siteUtil')
const aboutHistoryMaxEntries = 500

module.exports.maxEntries = aboutHistoryMaxEntries

const sortTimeDescending = (left, right) => {
  if (left.get('lastAccessedTime') < right.get('lastAccessedTime')) return 1
  if (left.get('lastAccessedTime') > right.get('lastAccessedTime')) return -1
  return 0
}

module.exports.getHistory = (sites) => {
  sites = makeImmutable(sites) ? makeImmutable(sites).toList() : new Immutable.List()
  return sites.filter((site) => siteUtil.isHistoryEntry(site))
      .sort(sortTimeDescending)
      .slice(0, aboutHistoryMaxEntries)
}

const getDayString = (entry, locale) => {
  const lastAccessedTime = entry.get('lastAccessedTime')
  return lastAccessedTime
    ? new Date(lastAccessedTime).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : ''
}

module.exports.groupEntriesByDay = (history, locale) => {
  const reduced = history.reduce((previousValue, currentValue, currentIndex, array) => {
    const result = currentIndex === 1 ? [] : previousValue
    if (currentIndex === 1) {
      const firstDate = getDayString(previousValue, locale)
      result.push({date: firstDate, entries: [previousValue]})
    }
    const date = getDayString(currentValue, locale)
    const dateIndex = result.findIndex((entryByDate) => entryByDate.date === date)
    if (dateIndex !== -1) {
      result[dateIndex].entries.push(currentValue)
    } else {
      result.push({date: date, entries: [currentValue]})
    }
    return result
  })
  if (reduced) {
    return Immutable.fromJS(
      Array.isArray(reduced)
        ? reduced
        : [{date: getDayString(reduced, locale), entries: [reduced]}]
    )
  }
  return Immutable.fromJS([])
}

/**
 * Return an array with ALL entries.
 * Format is expected to be array containing one array per day.
 */
module.exports.totalEntries = (entriesByDay) => {
  entriesByDay = makeImmutable(entriesByDay) || new Immutable.List()

  let result = new Immutable.List()
  entriesByDay.forEach((entry) => {
    result = result.push(entry.get('entries'))
  })
  return result
}
