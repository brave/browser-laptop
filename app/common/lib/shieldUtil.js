/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const frameStateUtil = require('../../../js/state/frameStateUtil')
const urlParse = require('../urlParse')

function braveShieldsDisabled (windowStore) {
  const activeRequestedLocation = frameStateUtil.activeRequestedLocation(windowStore)
  if (!activeRequestedLocation) {
    return true
  }

  const parsedUrl = urlParse(activeRequestedLocation)
  return parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:' && (parsedUrl.protocol + parsedUrl.host) !== 'about:safebrowsing'
}

module.exports = {
  braveShieldsDisabled
}
