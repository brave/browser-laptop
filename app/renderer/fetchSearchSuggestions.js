/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const appActions = require('../../js/actions/appActions')
const debounce = require('../../js/lib/debounce')

const fetchSearchSuggestions = debounce((windowId, tabId, autocompleteURL, searchTerms) => {
  const xhr = new window.XMLHttpRequest()
  xhr.open('GET', autocompleteURL
    .replace('{searchTerms}', encodeURIComponent(searchTerms)), true)
  xhr.responseType = 'json'
  xhr.send()
  xhr.onload = () => {
    // Once we have the online suggestions, append them to the others
    appActions.searchSuggestionResultsAvailable(windowId, tabId, Immutable.fromJS(xhr.response[1]))
  }
}, 100)

module.exports = fetchSearchSuggestions
