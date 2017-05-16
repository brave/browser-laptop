/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appActions = require('../../../js/actions/appActions')
const {request} = require('../../../js/lib/request')

const fetchSearchSuggestions = (windowId, tabId, autocompleteURL, searchTerms) => {
  autocompleteURL.replace('{searchTerms}', encodeURIComponent(searchTerms))
  request(autocompleteURL.replace('{searchTerms}', encodeURIComponent(searchTerms)), (err, response, body) => {
    if (err) {
      return
    }

    let searchResults
    try {
      searchResults = JSON.parse(body)[1]
    } catch (e) {
      console.warn(e)
      return
    }

    // Once we have the online suggestions, append them to the others
    appActions.searchSuggestionResultsAvailable(tabId, searchResults)
  })
}

module.exports = fetchSearchSuggestions
