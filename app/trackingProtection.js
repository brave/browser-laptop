/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const URL = require('url')
const TrackingProtection = require('tracking-protection').CTPParser
const DataFile = require('./dataFile')
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

const startTrackingProtection = (win) => {
  // Aftre every 50 first party hosts, just
  // re-get the first party host list
  if (cachedFirstPartyCount > 50) {
    cachedFirstPartyCount = 0
    cachedFirstParty = {}
  }

  win.webContents.session.webRequest.onBeforeRequest(function (details, cb) {
    // Using an electron binary which isn't from Brave
    if (!details.firstPartyUrl) {
      cb({})
      return
    }
    const firstPartyUrl = URL.parse(details.firstPartyUrl)
    if (firstPartyUrl.protocol && firstPartyUrl.protocol.startsWith('http')) {
      if (!cachedFirstParty[firstPartyUrl.host]) {
        let firstPartyHosts = trackingProtection.findFirstPartyHosts(firstPartyUrl.host)
        cachedFirstParty[firstPartyUrl.host] =
          firstPartyHosts && firstPartyHosts.split(',') || []
        ++cachedFirstPartyCount
      }
    }
    const urlHost = URL.parse(details.url).host
    const shouldBlock = firstPartyUrl.protocol &&
      firstPartyUrl.protocol.startsWith('http') &&
      cachedFirstParty[firstPartyUrl.host] &&
      trackingProtection.matchesTracker(urlHost) &&
      !cachedFirstParty[firstPartyUrl.host].find((baseHost) =>
        isThirdPartyHost(baseHost, urlHost))

    DataFile.debug(resourceName, details, shouldBlock)
    try {
      cb({
        cancel: shouldBlock
      })
    } catch (e) {
      cb({})
    }
  })
}

module.exports.init = (win) => {
  const first = !trackingProtection
  const wnds = []
  trackingProtection = new TrackingProtection()
  DataFile.init(win, resourceName, startTrackingProtection, trackingProtection, first, wnds)
}
