/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const punycode = require('punycode/')
const publicSuffixes = require('./psl')

const LRUCache = require('lru-cache')

let cachedBaseDomain = new LRUCache(50)

const checkASCII = function (str) {
  if (typeof str !== 'string') {
    return false
  }
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127) {
      return false
    }
  }
  return true
}

/**
 * Returns base domain for specified host based on Public Suffix List.
 * Derived from Privacy Badger Chrome <https://github.com/EFForg/privacybadger>,
 * Copyright (C) 2015 Electronic Frontier Foundation and other contributors
 * TODO: Consider refactoring this into isThirdPartyHost since it's only used
 *   for that.
 * @param {string} hostname The name of the host to get the base domain for.
 *   The caller must validate that this is a valid, non-IP hostname string!!
 */

module.exports.getBaseDomain = function (hostname) {
  // decode punycode if exists
  if (hostname.indexOf('xn--') >= 0 &&
    checkASCII(hostname)) {
    try {
      hostname = punycode.toUnicode(hostname)
    } catch (e) {
      console.error('punnycode.toUnicode() failure:', e)
    }
  }

  let baseDomain = cachedBaseDomain.get(hostname)
  if (baseDomain) {
    return baseDomain
  }

  // If the hostname is a TLD, return '' for the base domain
  if (hostname in publicSuffixes) {
    return ''
  }

  // search through PSL
  const prevDomains = []
  let curDomain = hostname
  let nextDot = curDomain.indexOf('.')
  let tld = 0
  let suffix

  while (true) {
    suffix = publicSuffixes[curDomain]
    if (typeof suffix !== 'undefined') {
      tld = suffix
      break
    }

    if (nextDot < 0) {
      tld = 1
      break
    }

    prevDomains.push(curDomain.substring(0, nextDot))
    curDomain = curDomain.substring(nextDot + 1)
    nextDot = curDomain.indexOf('.')
  }

  while (tld > 0 && prevDomains.length > 0) {
    curDomain = prevDomains.pop() + '.' + curDomain
    tld--
  }

  cachedBaseDomain.set(curDomain)

  return curDomain
}
