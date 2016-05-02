/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict'

const urlParse = require('url').parse
const Filtering = require('./filtering')

module.exports.resourceName = 'noScript'

function startNoscript () {
  Filtering.registerHeadersReceivedFilteringCB(onHeadersReceived)
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
module.exports.init = startNoscript
