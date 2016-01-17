/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const messages = require('../js/constants/messages')

const filteringFns = []

module.exports.registerFilteringCB = filteringFn => {
  filteringFns.push(filteringFn)
}

module.exports.registerWindow = wnd => {
  wnd.webContents.session.webRequest.onBeforeSendHeaders(function (wnd, details, cb) {
    // Using an electron binary which isn't from Brave
    if (!details.firstPartyUrl) {
      cb({})
      return
    }

    let results
    for (let i = 0; i < filteringFns.length; i++) {
      results = filteringFns[i](details)
      if (results.shouldBlock) {
        break
      }
    }

    if (!results) {
      cb({})
    } else if (results.cbArgs) {
      cb(results.cbArgs)
    } else {
      if (results.shouldBlock) {
        wnd.webContents.send(messages.BLOCKED_RESOURCE, results.resourceName, details)
      }
      cb({
        cancel: results.shouldBlock
      })
    }
  }.bind(null, wnd))
}

module.exports.isThirdPartyHost = (baseContextHost, testHost) => {
  if (!testHost.endsWith(baseContextHost)) {
    return true
  }

  let c = testHost[testHost.length - baseContextHost.length - 1]
  return c !== '.' && c !== undefined
}

