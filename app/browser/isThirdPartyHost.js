/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const getBaseDomain = require('../../js/lib/baseDomain').getBaseDomain
const ip = require('ip')

/**
 * Checks if two hosts are third party. Subdomains count as first-party to the
 * parent domain. Uses hostname (no port).
 * @param {host1} string - First hostname to compare
 * @param {host2} string - Second hostname to compare
 */
const isThirdPartyHost = (host1, host2) => {
  if (!host1 || !host2) {
    return true
  }
  if (host1 === host2) {
    return false
  }

  if (ip.isV4Format(host1) || ip.isV4Format(host2)) {
    // '127.0.0.1' and '::7f00:1' are actually equal, but ignore such cases for now
    return host1 !== host2
  }

  return getBaseDomain(host1) !== getBaseDomain(host2)
}

module.exports = isThirdPartyHost
