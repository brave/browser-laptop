/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const URL = require('url')
const Filtering = require('./filtering')
const siteHacks = require('../js/data/siteHacks')
const appConfig = require('../js/constants/appConfig')

const resourceName = 'siteHacks'

module.exports.init = () => {
  if (!appConfig[resourceName].enabled) {
    return
  }
  Filtering.registerBeforeSendHeadersFilteringCB(details => {
    if (details.resourceType !== 'mainFrame') {
      return {
        resourceName
      }
    }

    let domain = URL.parse(details.url).hostname.split('.').slice(-2).join('.')
    let hack = siteHacks[domain]
    let customCookie
    if (hack && hack.requestFilter) {
      const result = hack.requestFilter.call(this, details)
      if (result && result.customCookie) {
        customCookie = result.customCookie
      }
    }
    return {
      resourceName,
      customCookie
    }
  })
}
