/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const urlParse = require('./common/urlParse')
const Filtering = require('./filtering')
const {siteHacks} = require('../js/data/siteHacks')
const appConfig = require('../js/constants/appConfig')
const {makeJS} = require('./common/state/immutableUtil')

const resourceName = 'siteHacks'
let referralHeaders = null

const beforeHeaders = (details, isPrivate) => {
  const mainFrameUrl = Filtering.getMainFrameUrl(details)
  if (!mainFrameUrl) {
    return {
      resourceName
    }
  }

  const domain = urlParse(mainFrameUrl).hostname.split('.').slice(-2).join('.')
  const hack = siteHacks[domain]
  let customCookie
  let requestHeaders
  let cancel
  if (hack && hack.onBeforeSendHeaders &&
    domain === urlParse(details.url).hostname.split('.').slice(-2).join('.')) {
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

  // Referral custom headers
  if (referralHeaders == null) {
    const appStore = require('../js/stores/appStore')
    const appState = appStore.getState()
    if (appState) {
      setReferralHeaders(appState.getIn(['updates', 'referralHeaders']))
    }
  }

  if (referralHeaders != null && Array.isArray(referralHeaders)) {
    referralHeaders.forEach((referralHeader) => {
      const domains = referralHeader.domains || []
      if (domains && domains.includes(domain)) {
        const headers = referralHeader.headers
        if (headers) {
          if (requestHeaders == null) {
            requestHeaders = details.requestHeaders
          }

          Object.keys(headers).forEach((key) => {
            requestHeaders[key] = headers[key]
          })
        }
      }
    })
  }

  return {
    resourceName,
    requestHeaders,
    customCookie,
    cancel
  }
}

const beforeRequest = (details, isPrivate) => {
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
}

const init = () => {
  if (!appConfig[resourceName].enabled) {
    return
  }

  Filtering.registerBeforeSendHeadersFilteringCB(beforeHeaders)

  Filtering.registerBeforeRequestFilteringCB(beforeRequest)
}

const setReferralHeaders = (headers) => {
  if (headers) {
    headers = makeJS(headers) || []
    if (!Array.isArray(headers)) {
      headers = [headers]
    }

    referralHeaders = headers
  }
}

const getMethods = () => {
  const publicMethods = {
    init,
    setReferralHeaders
  }

  let privateMethods = {}

  if (process.env.NODE_ENV === 'test') {
    privateMethods = {
      beforeHeaders,
      getReferralHeaders: () => {
        return referralHeaders
      },
      resetReferralHeaders: () => {
        referralHeaders = null
      }
    }
  }

  return Object.assign({}, publicMethods, privateMethods)
}

module.exports = getMethods()
