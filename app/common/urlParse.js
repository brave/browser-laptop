/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const LRUCache = require('lru-cache')
const urlParse = require('fast-url-parser').parse
const config = require('../../js/constants/config')
let cachedUrlParse = new LRUCache(config.cache.urlParse)

module.exports = (url, ...args) => {
  let parsedUrl = cachedUrlParse.get(url)
  if (parsedUrl) {
    // make a copy so we don't alter the cached object with any changes
    return Object.assign({}, parsedUrl)
  }

  // In fast-url-parser href, port, prependSlash, protocol, and query
  // are lazy so access them.
  const raw = urlParse(url, ...args)
  parsedUrl = {
    auth: raw.auth,
    hash: raw.hash,
    host: raw.host,
    hostname: raw.hostname,
    href: raw.href,
    path: raw.path,
    pathname: raw.pathname,
    port: raw.port,
    protocol: raw.protocol,
    query: raw.query,
    search: raw.search,
    slashes: raw.slashes
  }
  cachedUrlParse.set(url, parsedUrl)
  return parsedUrl
}
