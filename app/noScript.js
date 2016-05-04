/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict'

const urlParse = require('url').parse
const Filtering = require('./filtering')
const AppStore = require('../js/stores/appStore')
const siteSettings = require('../js/state/siteSettings')
const siteUtil = require('../js/state/siteUtil')
const ipcMain = require('electron').ipcMain
const messages = require('../js/constants/messages')

module.exports.resourceName = 'noScript'

// Resources that should be temporarily allowed. True = allow once,
// false = allow until restart.
let temporarilyAllowed = {}

function startNoScript () {
  Filtering.registerHeadersReceivedFilteringCB(onHeadersReceived)
  ipcMain.on(messages.TEMPORARY_ALLOW_SCRIPTS, (e, origin, allowOnce) => {
    temporarilyAllowed[origin] = allowOnce
  })
}

function onHeadersReceived (details) {
  let result = { resourceName: module.exports.resourceName }
  if (!Filtering.isResourceEnabled(module.exports.resourceName)) {
    return result
  }
  // Ignore whitelisted URL schemes and non-applicable resource types
  let parsed = urlParse(details.firstPartyUrl)
  if (['about:', 'chrome:', 'chrome-extension:'].includes(parsed.protocol) || ['stylesheet', 'script', 'image'].includes(details.resourceType) || parsed.hostname === 'localhost') {
    return result
  }

  let origin = siteUtil.getOrigin(details.firstPartyUrl)
  if (details.resourceType.endsWith('Frame') && origin) {
    // Ignore temporarily-whitelisted URLs.
    if (origin in temporarilyAllowed) {
      if (temporarilyAllowed[origin] === true) {
        delete temporarilyAllowed[origin]
      }
      return result
    }
    // Ignore persistently-whitelisted URLs.
    let settings = siteSettings.getSiteSettingsForHostPattern(AppStore.getState().get('siteSettings'), origin)
    if (settings && settings.get('noScript') === false) {
      return result
    }
  }

  result.responseHeaders = details.responseHeaders

  let cspHeaderName = 'Content-Security-Policy'
  for (let headerName in details.responseHeaders) {
    if (headerName.toLowerCase() === 'content-security-policy') {
      cspHeaderName = headerName
    }
  }

  let csp = details.responseHeaders[cspHeaderName] || []
  csp.push("script-src 'none'")
  result.responseHeaders[cspHeaderName] = csp
  return result
}

/**
 * Loads noscript
 */
module.exports.init = startNoScript
