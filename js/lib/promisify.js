/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Converts a node style function to an ES6 promise
 */
module.exports = (func, ...promisifyArgs) => {
  return new Promise((resolve, reject) => {
    func(...promisifyArgs, (err, ...cbRest) => {
      if (err) {
        reject(err)
        return
      }
      resolve(cbRest)
    })
  })
}
