/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const {generateNewSuggestionsList, generateNewSearchXHRResults} = require('../../common/lib/suggestion')
const {init} = require('../../common/lib/siteSuggestions')

const urlBarSuggestionsReducer = (state, action) => {
  switch (action.actionType) {
    case appConstants.APP_SET_STATE:
      init(Object.values(action.appState.get('sites').toJS()))
      break
    case appConstants.APP_URL_BAR_TEXT_CHANGED:
      generateNewSuggestionsList(state, action.windowId, action.tabId, action.input)
      generateNewSearchXHRResults(state, action.windowId, action.tabId, action.input)
      break
    case appConstants.APP_SEARCH_SUGGESTION_RESULTS_AVAILABLE:
      // TODO: Find a way to get urlLocation and also convert search suggestions to fetch
      // generateNewSuggestionsList(state, action.windowId, action.tabId, urlLocation, action.searchResults)
      break
  }
  return state
}

module.exports = urlBarSuggestionsReducer
