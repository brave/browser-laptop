/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const appConstants = require('../../../js/constants/appConstants')
const {generateNewSuggestionsList, generateNewSearchXHRResults} = require('../../common/lib/suggestion')
const {init, add} = require('../../common/lib/siteSuggestions')
const {makeImmutable} = require('../../common/state/immutableUtil')
const tabState = require('../../common/state/tabState')
const historyState = require('../../common/state/historyState')
const bookmarksState = require('../../common/state/bookmarksState')

const urlBarSuggestionsReducer = (state, action) => {
  switch (action.actionType) {
    case appConstants.APP_ADD_HISTORY_SITE:
    case appConstants.APP_ADD_BOOKMARK:
    case appConstants.APP_EDIT_BOOKMARK:
      if (Immutable.List.isList(action.siteDetail)) {
        action.siteDetail.forEach((s) => {
          add(s)
        })
      } else {
        add(action.siteDetail)
      }
      break
    case appConstants.APP_SET_STATE:
      const bookmarks = bookmarksState.getBookmarks(action.appState)
      const history = historyState.getSites(action.appState)
      init(Object.values(bookmarks.concat(history).toJS()))
      break
    case appConstants.APP_URL_BAR_TEXT_CHANGED:
      generateNewSuggestionsList(state, action.windowId, action.tabId, action.input)
      generateNewSearchXHRResults(state, action.windowId, action.tabId, action.input)
      break
    case appConstants.APP_SEARCH_SUGGESTION_RESULTS_AVAILABLE:
      state = state.set('searchResults', makeImmutable(action.searchResults))
      if (action.query) {
        const windowId = tabState.getWindowId(state, action.tabId)
        generateNewSuggestionsList(state, windowId, action.tabId, action.query)
      }
      break
  }
  return state
}

module.exports = urlBarSuggestionsReducer
