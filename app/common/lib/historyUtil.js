/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const UrlUtil = require('../../../js/lib/urlutil')
const {makeImmutable} = require('../state/immutableUtil')
const aboutHistoryMaxEntries = 500

const sortTimeDescending = (left, right) => {
  if (left.get('lastAccessedTime') < right.get('lastAccessedTime')) return 1
  if (left.get('lastAccessedTime') > right.get('lastAccessedTime')) return -1
  return 0
}

const getHistory = (sites) => {
  sites = makeImmutable(sites) ? makeImmutable(sites).toList() : new Immutable.List()
  return sites
      .sort(sortTimeDescending)
      .slice(0, aboutHistoryMaxEntries)
}

const getDayString = (entry, locale) => {
  const lastAccessedTime = entry.get('lastAccessedTime')
  return lastAccessedTime
    ? new Date(lastAccessedTime).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : ''
}

const groupEntriesByDay = (history, locale) => {
  const reduced = history.reduce((previousValue, currentValue, currentIndex) => {
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
const totalEntries = (entriesByDay) => {
  entriesByDay = makeImmutable(entriesByDay) || new Immutable.List()

  let result = new Immutable.List()
  entriesByDay.forEach((entry) => {
    result = result.push(entry.get('entries'))
  })
  return result
}

const prepareHistoryEntry = (siteDetail) => {
  const time = siteDetail.has('lastAccessedTime')
    ? siteDetail.get('lastAccessedTime')
    : new Date().getTime()

  return makeImmutable({
    lastAccessedTime: time,
    objectId: siteDetail.get('objectId', null),
    title: siteDetail.get('title'),
    location: siteDetail.get('location'),
    partitionNumber: ~~siteDetail.get('partitionNumber', 0),
    count: 1,
    themeColor: siteDetail.get('themeColor'),
    favicon: siteDetail.get('favicon', siteDetail.get('icon')),
    key: getKey(siteDetail),
    skipSync: siteDetail.get('skipSync', null)
  })
}

const mergeSiteDetails = (oldDetail, newDetail) => {
  const objectId = newDetail.has('objectId') ? newDetail.get('objectId') : oldDetail.get('objectId', undefined)
  const time = newDetail.has('lastAccessedTime')
    ? newDetail.get('lastAccessedTime')
    : new Date().getTime()

  let site = makeImmutable({
    lastAccessedTime: time,
    objectId,
    title: newDetail.get('title'),
    location: newDetail.get('location'),
    partitionNumber: ~~newDetail.get('partitionNumber', 0),
    count: ~~oldDetail.get('count', 0) + 1
  })

  const themeColor = newDetail.has('themeColor') ? newDetail.get('themeColor') : oldDetail.get('themeColor')
  if (themeColor) {
    site = site.set('themeColor', themeColor)
  }

  // we need to have a fallback to icon, because frame has icon for it
  const favicon = (newDetail.has('favicon') || newDetail.has('icon'))
    ? newDetail.get('favicon', newDetail.get('icon'))
    : oldDetail.get('favicon')
  if (favicon) {
    site = site.set('favicon', favicon)
  }

  site = site.set('key', getKey(site))

  return site
}

const getDetailFromFrame = (frame) => {
  return makeImmutable({
    location: frame.get('location'),
    title: frame.get('title'),
    partitionNumber: frame.get('partitionNumber'),
    favicon: frame.get('icon'),
    themeColor: frame.get('themeColor') || frame.get('computedThemeColor')
  })
}

const getKey = (siteDetail) => {
  if (!siteDetail) {
    return null
  }

  let location = siteDetail.get('location')

  if (location) {
    location = UrlUtil.getLocationIfPDF(location)
    return location + '|' +
      (siteDetail.get('partitionNumber') || 0)
  }
  return null
}

module.exports = {
  maxEntries: aboutHistoryMaxEntries,
  getHistory,
  groupEntriesByDay,
  totalEntries,
  prepareHistoryEntry,
  mergeSiteDetails,
  getDetailFromFrame,
  getKey
}
