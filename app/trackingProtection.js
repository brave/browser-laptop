/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const URL = require('url')
const TrackingProtection = require('tracking-protection').CTPParser
const DataFile = require('./dataFile')
const Filtering = require('./filtering')
const resourceName = 'trackingProtection'

let trackingProtection

let cachedFirstPartyCount = 0
let cachedFirstParty = {}

const isThirdPartyHost = (baseContextHost, testHost) => {
  if (!testHost.endsWith(baseContextHost)) {
    return true
  }

  let c = testHost[testHost.length - baseContextHost.length - 1]
  return c !== '.' && c !== undefined
}

const startTrackingProtection = (wnd) => {
  // Aftre every 50 first party hosts, just
  // re-get the first party host list
  if (cachedFirstPartyCount > 50) {
    cachedFirstPartyCount = 0
    cachedFirstParty = {}
  }

  Filtering.register(wnd, (details) => {
    const firstPartyUrl = URL.parse(details.firstPartyUrl)
    let firstPartyUrlHost = firstPartyUrl.host || ''
    if (firstPartyUrlHost.startsWith('www.')) {
      firstPartyUrlHost = firstPartyUrlHost.substring(4)
    }
    if (firstPartyUrl.protocol && firstPartyUrl.protocol.startsWith('http')) {
      if (!cachedFirstParty[firstPartyUrlHost]) {
        let firstPartyHosts = trackingProtection.findFirstPartyHosts(firstPartyUrlHost)
        cachedFirstParty[firstPartyUrlHost] =
          firstPartyHosts && firstPartyHosts.split(',') || []
        ++cachedFirstPartyCount
      }
    }
    const urlHost = URL.parse(details.url).host
    const shouldBlock = firstPartyUrl.protocol &&
      firstPartyUrl.protocol.startsWith('http') &&
      cachedFirstParty[firstPartyUrlHost] &&
      trackingProtection.matchesTracker(urlHost) &&
      urlHost !== firstPartyUrlHost &&
      !cachedFirstParty[firstPartyUrlHost].find((baseHost) =>
        !isThirdPartyHost(baseHost, urlHost))

    DataFile.debug(resourceName, details, shouldBlock)
    return shouldBlock
  })
}

module.exports.init = (wnd) => {
  const first = !trackingProtection
  const wnds = []
  trackingProtection = new TrackingProtection()
  DataFile.init(wnd, resourceName, startTrackingProtection, trackingProtection, first, wnds)
}
