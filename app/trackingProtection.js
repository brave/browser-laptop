/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const urlParse = require('./common/urlParse')
const TrackingProtection = require('tracking-protection').CTPParser
const dataFile = require('./dataFile')
const Filtering = require('./filtering')
const isThirdPartyHost = require('./browser/isThirdPartyHost')
const LRUCache = require('lru-cache')

module.exports.resourceName = 'trackingProtection'

let trackingProtection

let cachedFirstParty = new LRUCache(50)

// Temporary whitelist until we find a better solution
const whitelistHosts = ['connect.facebook.net', 'connect.facebook.com', 'staticxx.facebook.com', 'www.facebook.com', 'scontent.xx.fbcdn.net', 'pbs.twimg.com', 'scontent-sjc2-1.xx.fbcdn.net', 'platform.twitter.com', 'syndication.twitter.com', 'cdn.syndication.twimg.com']

const startTrackingProtection = (wnd) => {
  Filtering.registerBeforeRequestFilteringCB((details) => {
    const mainFrameUrl = Filtering.getMainFrameUrl(details)
    // this can happen if the tab is closed and the webContents is no longer available
    if (!mainFrameUrl) {
      return {
        resourceName: module.exports.resourceName
      }
    }
    const firstPartyUrl = urlParse(mainFrameUrl)
    let firstPartyUrlHost = firstPartyUrl.hostname || ''
    if (firstPartyUrlHost.startsWith('www.')) {
      firstPartyUrlHost = firstPartyUrlHost.substring(4)
    }
    if (firstPartyUrl.protocol && firstPartyUrl.protocol.startsWith('http')) {
      if (!cachedFirstParty.get(firstPartyUrlHost)) {
        let firstPartyHosts = trackingProtection.findFirstPartyHosts(firstPartyUrlHost)
        cachedFirstParty.set(firstPartyUrlHost, (firstPartyHosts && firstPartyHosts.split(',')) || [])
      }
    }
    const urlHost = urlParse(details.url).hostname
    const cancel = firstPartyUrl.protocol &&
      details.resourceType !== 'mainFrame' &&
      firstPartyUrl.protocol.startsWith('http') &&
      !whitelistHosts.includes(urlHost) &&
      cachedFirstParty.get(firstPartyUrlHost) &&
      trackingProtection.matchesTracker(firstPartyUrlHost, urlHost) &&
      urlHost !== firstPartyUrl.hostname &&
      !cachedFirstParty.get(firstPartyUrlHost).find((baseHost) =>
        !isThirdPartyHost(baseHost, urlHost))

    dataFile.debug(module.exports.resourceName, details, cancel)
    return {
      cancel,
      resourceName: module.exports.resourceName
    }
  })
}

module.exports.init = () => {
  trackingProtection = new TrackingProtection()
  dataFile.init(module.exports.resourceName, undefined, startTrackingProtection,
                (data) => trackingProtection.deserialize(data))
}
