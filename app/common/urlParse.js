/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const LRUCache = require('lru-cache')
const urlParse = require('url').parse
const config = require('../../js/constants/config')
let cachedUrlParse = new LRUCache(config.cache.urlParse)

module.exports = (url, ...args) => {
  let parsedUrl = cachedUrlParse.get(url)
  if (parsedUrl) {
    // make a copy so we don't alter the cached object with any changes
    return Object.assign({}, parsedUrl)
  }

  parsedUrl = urlParse(url, ...args)
  cachedUrlParse.set(url, parsedUrl)
  return parsedUrl
}
