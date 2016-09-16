/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const { responseHasContent } = require('./httpUtil')

/**
 * Is page an actual page being viewed by the user? (not an error page, etc)
 * If the page is invalid, we don't want to collect usage info.
 * @param {Object} view - an entry from page_view (from EventStore)
 * @param {Object} responseList - full page_response array (from EventStore)
 * @return {boolean} true if page should have usage collected, false if not
 */
module.exports.shouldTrackView = (view, responseList) => {
  if (!view || !view.url || !view.tabId) {
    return false
  }
  if (!responseList || !Array.isArray(responseList) || !responseList.length) {
    return false
  }

  const tabId = view.tabId
  const url = view.url

  for (let i = responseList.length; i > -1; i--) {
    const response = responseList[i]

    if (!response) continue

    const responseUrl = response && response.details
      ? response.details.newURL
      : null

    if (url === responseUrl && response.tabId === tabId) {
      return responseHasContent(response.details.httpResponseCode)
    }
  }
  return false
}
