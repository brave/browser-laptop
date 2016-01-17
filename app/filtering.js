/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const messages = require('../js/constants/messages')
const electron = require('electron')
const session = electron.session
const BrowserWindow = electron.BrowserWindow

const filteringFns = []

module.exports.registerFilteringCB = filteringFn => {
  filteringFns.push(filteringFn)
}

/**
 * Register for notifications for webRequest notifications for
 * a particular session.
 * @param {object} The session to add webRequest filtering on
 */
function registerForSession (session) {
  session.webRequest.onBeforeSendHeaders(function (details, cb) {
    // Using an electron binary which isn't from Brave
    if (!details.firstPartyUrl) {
      cb({})
      return
    }

    let results
    let cbArgs
    for (let i = 0; i < filteringFns.length; i++) {
      results = filteringFns[i](details)
      cbArgs = cbArgs || results.cbArgs
      if (results.shouldBlock) {
        break
      }
    }

    if (!results) {
      cb({})
    } else if (results.shouldBlock) {
      // We have no good way of knowing which BrowserWindow the blocking is for
      // yet so send it everywhere and let listeners decide how to respond.
      BrowserWindow.getAllWindows().forEach(wnd =>
        wnd.webContents.send(messages.BLOCKED_RESOURCE, results.resourceName, details))
      cb({
        cancel: results.shouldBlock
      })
    } else {
      cb(cbArgs || {})
    }
  })
}

module.exports.isThirdPartyHost = (baseContextHost, testHost) => {
  if (!testHost.endsWith(baseContextHost)) {
    return true
  }

  let c = testHost[testHost.length - baseContextHost.length - 1]
  return c !== '.' && c !== undefined
}

module.exports.init = () => {
  registerForSession(session.fromPartition(''))
  registerForSession(session.fromPartition('private-1'))
}
