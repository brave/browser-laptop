/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const siteUtil = require('../../../js/state/siteUtil')
const SortedSet = require('redis-sorted-set')
let siteKeys = new SortedSet()

/**
 * Add siteKey to cache if it's a history site. Note the cache is process-
 * specific.
 * @param siteKey {string}
 * @param site {Immutable.Map} siteDetail from app state sites
 */
module.exports.addSiteKey = (siteKey, site) => {
  if (!siteUtil.isHistoryEntry(site)) {
    return false
  }
  // Sort most recent at index 0
  const score = -1 * site.get('lastAccessedTime')
  return siteKeys.set(siteKey, score)
}

/**
 * Remove siteKey from cache.
 * @param siteKey {string}
 */
module.exports.removeSiteKey = (siteKey) => {
  return siteKeys.del(siteKey)
}

/**
 * Get history siteKeys, sorted by lastAccessedTime descending.
 * @param limit {number}
 * @returns {Array.<string>} siteDetail from app state sites
 */
module.exports.getSiteKeys = (limit) => {
  const indexEnd = limit ? (limit - 1) : -1
  if (indexEnd <= -2) { throw new Error('Invalid siteKey limit') }
  return siteKeys.range(0, indexEnd)
}

/**
 * Reset the cache. Useful for testing.
 */
module.exports.reset = () => {
  siteKeys = new SortedSet()
}
