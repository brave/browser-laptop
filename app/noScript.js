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
const { getIndexHTML } = require('../js/lib/appUrlUtil')

module.exports.resourceName = 'noScript'

// Resources that should be temporarily allowed. 1 = allow on next main frame
// load, 2 = do not allow on next load
let temporarilyAllowed = {}

const ALLOW_NEXT_TIME = 1
const DISALLOW_NEXT_TIME = 2

function startNoScript () {
  Filtering.registerHeadersReceivedFilteringCB(onHeadersReceived)
  ipcMain.on(messages.TEMPORARY_ALLOW_SCRIPTS, (e, origin) => {
    temporarilyAllowed[origin] = ALLOW_NEXT_TIME
  })
}

function onHeadersReceived (details) {
  let result = { resourceName: module.exports.resourceName }
  if (!Filtering.isResourceEnabled(module.exports.resourceName, details.firstPartyUrl)) {
    return result
  }
  // Ignore whitelisted URL schemes and non-applicable resource types
  let parsed = urlParse(details.firstPartyUrl)
  if (['about:', 'chrome:', 'chrome-extension:'].includes(parsed.protocol) ||
      ['stylesheet', 'script', 'image'].includes(details.resourceType) ||
      (parsed.hostname === 'localhost' && process.env.NODE_ENV !== 'test') ||
      details.firstPartyUrl === getIndexHTML()) {
    return result
  }

  let origin = siteUtil.getOrigin(details.firstPartyUrl)
  if (origin) {
    if (temporarilyAllowed[origin] === DISALLOW_NEXT_TIME) {
      if (details.resourceType === 'mainFrame') {
        // This resource has been allowed once already. Un-whitelist it
        delete temporarilyAllowed[origin]
      } else {
        return result
      }
    } else if (temporarilyAllowed[origin] === ALLOW_NEXT_TIME) {
      if (details.resourceType === 'mainFrame') {
        // Mark this origin for removal from temporarilyAllowed on next
        // mainFrame load
        temporarilyAllowed[origin] = DISALLOW_NEXT_TIME
      }
      return result
    }
    // Ignore persistently-whitelisted URLs.
    let appState = AppStore.getState()
    let settings = siteSettings.getSiteSettingsForHostPattern(appState.get('siteSettings'), origin)
    if (settings && settings.get('noScript') === false) {
      return result
    }
    settings = siteSettings.getSiteSettingsForHostPattern(appState.get('temporarySiteSettings'), origin)
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
