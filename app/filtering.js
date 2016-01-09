/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const filteringFns = []
var wnds = new WeakSet()

module.exports.register = (wnd, filteringFn) => {
  filteringFns.push(filteringFn)
  if (!wnds.has(wnd)) {
    wnds.add(wnd)
    wnd.webContents.session.webRequest.onBeforeRequest((details, cb) => {
      // Using an electron binary which isn't from Brave
      if (!details.firstPartyUrl) {
        cb({})
        return
      }
      cb({
        cancel: filteringFns.some((fn) => fn(details))
      })
    })
  }
}

module.exports.isThirdPartyHost = (baseContextHost, testHost) => {
  if (!testHost.endsWith(baseContextHost)) {
    return true
  }

  let c = testHost[testHost.length - baseContextHost.length - 1]
  return c !== '.' && c !== undefined
}

