/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

const getRedirectedResources = (redirectedResources) => {
  let result = new Immutable.List()
  if (redirectedResources) {
    redirectedResources.forEach((urls) => {
      urls.forEach((url) => {
        result = result.push(url)
      })
    })
  }
  return result
}

module.exports = {
  getRedirectedResources
}
