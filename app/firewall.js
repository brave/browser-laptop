/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const ip = require('ip')
const Filtering = require('./filtering')
const {isInternalUrl} = require('../js/lib/urlutil')

module.exports.resourceName = 'firewall'

const onHeadersReceived = (details) => {
  const result = { resourceName: module.exports.resourceName }
  const mainFrameUrl = Filtering.getMainFrameUrl(details)
  const isIPInternal = ip.isPrivate(details.ip)
  const isUrlInternal = isInternalUrl(details.url)

  if ((isIPInternal || isUrlInternal) && !isInternalUrl(mainFrameUrl)) {
    // Block requests to local origins from non-local top-level origins
    console.log('firewall blocked request from external IP to internal IP')
    result.cancel = true
  } else if (isIPInternal && !isUrlInternal) {
    // Block requests to an external name that resolves to an internal address
    console.log('firewall blocked request for internal IP with external hostname')
    result.cancel = true
  }

  return result
}

module.exports.init = () => {
  Filtering.registerHeadersReceivedFilteringCB(onHeadersReceived)
}
