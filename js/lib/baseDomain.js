/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const punycode = require('punycode')
const publicSuffixes = require('./psl')

/**
 * Returns base domain for specified host based on Public Suffix List.
 * @param {string} hostname The name of the host to get the base domain for
 */
module.exports.getBaseDomain = function (hostname) {
  // decode punycode if exists
  if (hostname.indexOf('xn--') >= 0) {
    hostname = punycode.toUnicode(hostname)
  }

  // search through PSL
  var prevDomains = []
  var curDomain = hostname
  var nextDot = curDomain.indexOf('.')
  var tld = 0
  var suffix

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

  return curDomain
}
