/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const urlParse = require('./common/urlParse')
const Filtering = require('./filtering')
const {siteHacks} = require('../js/data/siteHacks')
const appConfig = require('../js/constants/appConfig')

const resourceName = 'siteHacks'

module.exports.init = () => {
  if (!appConfig[resourceName].enabled) {
    return
  }

  Filtering.registerBeforeSendHeadersFilteringCB((details, isPrivate) => {
    if (details.resourceType !== 'mainFrame') {
      return {
        resourceName
      }
    }

    // This filter only applies to top-level requests, so details.url == mainFrameUrl
    let domain = urlParse(details.url).hostname.split('.').slice(-2).join('.')
    let hack = siteHacks[domain]
    let customCookie
    let requestHeaders
    let cancel
    if (hack && hack.onBeforeSendHeaders) {
      const result = hack.onBeforeSendHeaders.call(this, details)
      if (result) {
        customCookie = result.customCookie
        requestHeaders = result.requestHeaders
        if (Filtering.isResourceEnabled(appConfig.resourceNames.NOSCRIPT, 'https://twitter.com/', isPrivate) &&
          result.cancel) {
          // cancel is only called on Twitter where noscript is enabled
          cancel = true
        }
      }
    }
    return {
      resourceName,
      requestHeaders,
      customCookie,
      cancel
    }
  })

  Filtering.registerBeforeRequestFilteringCB((details, isPrivate) => {
    let domain = urlParse(details.url).hostname
    let hack = siteHacks[domain]

    let redirectURL
    let cancel
    const mainFrameUrl = Filtering.getMainFrameUrl(details)
    // this can happen if the tab is closed and the webContents is no longer available
    if (!mainFrameUrl) {
      return {
        resourceName: module.exports.resourceName
      }
    }

    if (hack && hack.onBeforeRequest &&
        (hack.enableForAll ||
         (hack.enableForAdblock && Filtering.isResourceEnabled(appConfig.resourceNames.ADBLOCK, mainFrameUrl, isPrivate)) ||
         (hack.enableForTrackingProtection && Filtering.isResourceEnabled(appConfig.resourceNames.TRACKING_PROTECTION, mainFrameUrl, isPrivate)))) {
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
