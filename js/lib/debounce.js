/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

function debounce (fn, bufferInterval, ...args) {
  let timeout
  return (...args2) => {
    clearTimeout(timeout)
    let a = args || []
    if (args2 && args2.constructor === Array) {
      a = a.concat(args2)
    }
    timeout = setTimeout(fn.apply.bind(fn, this, a), bufferInterval)
  }
}

module.exports = debounce
