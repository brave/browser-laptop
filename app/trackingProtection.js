/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const URL = require('url')
const TrackingProtection = require('tracking-protection').CTPParser
const DataFile = require('./dataFile')
const Filtering = require('./filtering')

module.exports.resourceName = 'trackingProtection'

let trackingProtection

let cachedFirstPartyCount = 0
let cachedFirstParty = {}

// Temporary whitelist until we find a better solution
const whitelistHosts = ['connect.facebook.net', 'connect.facebook.com', 'staticxx.facebook.com', 'www.facebook.com']

const startTrackingProtection = (wnd) => {
  Filtering.registerBeforeSendHeadersFilteringCB((details) => {
    // After every 50 first party hosts, just
    // re-get the first party host list
    if (cachedFirstPartyCount > 50) {
      cachedFirstPartyCount = 0
      cachedFirstParty = {}
    }
    const firstPartyUrl = URL.parse(details.firstPartyUrl)
    let firstPartyUrlHost = firstPartyUrl.hostname || ''
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
    const urlHost = URL.parse(details.url).hostname
    const shouldBlock = firstPartyUrl.protocol &&
      details.resourceType !== 'mainFrame' &&
      firstPartyUrl.protocol.startsWith('http') &&
      !whitelistHosts.includes(urlHost) &&
      cachedFirstParty[firstPartyUrlHost] &&
      trackingProtection.matchesTracker(urlHost) &&
      urlHost !== firstPartyUrlHost &&
      !cachedFirstParty[firstPartyUrlHost].find((baseHost) =>
        !Filtering.isThirdPartyHost(baseHost, urlHost))

    DataFile.debug(module.exports.resourceName, details, shouldBlock)
    return {
      shouldBlock,
      resourceName: module.exports.resourceName
    }
  })
}

module.exports.init = () => {
  trackingProtection = new TrackingProtection()
  DataFile.init(module.exports.resourceName, startTrackingProtection,
                data => trackingProtection.deserialize(data))
}
