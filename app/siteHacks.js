/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const URL = require('url')
const Filtering = require('./filtering')
const {siteHacks} = require('../js/data/siteHacks')
const appConfig = require('../js/constants/appConfig')

const resourceName = 'siteHacks'

module.exports.init = () => {
  if (!appConfig[resourceName].enabled) {
    return
  }
  Filtering.registerBeforeSendHeadersFilteringCB((details) => {
    if (details.resourceType !== 'mainFrame') {
      return {
        resourceName
      }
    }

    let domain = URL.parse(details.url).hostname.split('.').slice(-2).join('.')
    let hack = siteHacks[domain]
    let customCookie
    if (hack && hack.onBeforeSendHeaders) {
      const result = hack.onBeforeSendHeaders.call(this, details)
      if (result && result.customCookie) {
        customCookie = result.customCookie
      }
    }
    return {
      resourceName,
      customCookie
    }
  })
  Filtering.registerBeforeRequestFilteringCB((details) => {
    let domain = URL.parse(details.url).hostname
    let hack = siteHacks[domain]

    let redirectURL
    let cancel
    const firstPartyUrl = Filtering.getMainFrameUrl(details)
    if (hack && hack.onBeforeRequest &&
        (hack.enableForAll ||
         hack.enableForAdblock && Filtering.isResourceEnabled(appConfig.resourceNames.ADBLOCK, firstPartyUrl) ||
         hack.enableForTrackingProtection && Filtering.isResourceEnabled(appConfig.resourceNames.TRACKING_PROTECTION, firstPartyUrl))) {
      const result = hack.onBeforeRequest.call(this, details)
      if (result && result.redirectURL) {
        redirectURL = result.redirectURL
      }
      if (result && typeof result.cancel === 'boolean') {
        cancel = result.cancel
      }
    }
    return {
      resourceName,
      redirectURL,
      cancel
    }
  })
}
