/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const tabState = require('./tabState')
const windowState = require('./windowState')
const { makeImmutable, isMap } = require('./immutableUtil')
const getSetting = require('../../../js/settings').getSetting
const settings = require('../../../js/constants/settings')
const assert = require('assert')

const defaultState = Immutable.fromJS({
  urlbar: {
    location: '',
    suggestions: {
      selectedIndex: -1,
      searchResults: [],
      suggestionList: null
    },
    selected: false,
    focused: false,
    active: false
  }
})

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  return state
}

const navigationBarState = {

  defaultState,

  getNavigationBar: (state, tabId) => {
    state = validateState(state)
    if (tabId === tabState.TAB_ID_NONE) {
      return defaultState
    }

    const frame = tabState.getFrameByTabId(state, tabId)
    return (frame && frame.getIn(['navbar'])) || defaultState
  },

  getUrlBar: (state, tabId) => {
    state = validateState(state)
    if (tabId === tabState.TAB_ID_NONE) {
      return defaultState.get('urlbar')
    }

    return navigationBarState.getNavigationBar(state, tabId).get('urlbar') || defaultState.get('urlbar')
  },

  locationValueSuffix: (state, tabId) => {
    state = validateState(state)
    return navigationBarState.getUrlBar(state, tabId).getIn(['suggestions', 'urlSuffix']) || ''
  },

  hasLocationValueSuffix: (state, tabId) => {
    state = validateState(state)
    return navigationBarState.locationValueSuffix(state, tabId).length > 0
  },

  // TODO(bridiver) - refactor this so it doesn't require windowState
  isTitleMode: (state, tabId, bookmarkDetail) => {
    state = validateState(state)
    const tab = tabState.getByTabId(state, tabId)
    if (!tab || tab.get('windowId') === windowState.WINDOW_ID_NONE) {
      return false
    }

    const win = windowState.getByWindowId(state, tab.get('windowId'))
    if (!win) {
      return false
    }

    const mouseInTitlebar = windowState.isMouseInTitlebar(state, tab.get('windowId'))
    const location = tabState.getLocation(state, tabId)
    const urlbar = navigationBarState.getUrlBar(state, tabId)
    return tabState.isShowingMessageBox(state, tabId) ||
      (
        mouseInTitlebar === false &&
        !bookmarkDetail &&
        tabState.getTitle(state, tabId) &&
        !['about:blank', 'about:newtab'].includes(location) &&
        !tabState.isLoading(state, tabId) &&
        !urlbar.get('focused') &&
        !urlbar.get('active') &&
        getSetting(settings.DISABLE_TITLE_MODE) === false
      )
  },

  getSelectedIndex: (state, tabId) => {
    state = validateState(state)
    return navigationBarState.getUrlBar(state, tabId).getIn(['suggestions', 'selectedIndex'])
  },

  getSuggestionList: (state, tabId) => {
    state = validateState(state)
    return navigationBarState.getUrlBar(state, tabId).getIn(['suggestions', 'suggestionList'])
  },

  getSuggestionLocation: (state, tabId) => {
    state = validateState(state)
    const selectedIndex = navigationBarState.getSelectedIndex(state, tabId)
    const suggestionList = navigationBarState.getSuggestionList(state, tabId)
    console.log(selectedIndex)
    const suggestion = makeImmutable(suggestionList && suggestionList.get(selectedIndex))
    return suggestion && suggestion.get('location')
  },

  showAutocomplete: (state, tabId) => {
    state = validateState(state)
    return navigationBarState.showAutoComplete(state, tabId)
  },

  showAutoComplete: (state, tabId) => {
    state = validateState(state)
    return !!navigationBarState.getUrlBar(state, tabId).getIn(['suggestions', 'autocompleteEnabled'])
  },

  getLocation: (state, tabId) => {
    state = validateState(state)
    return navigationBarState.getUrlBar(state, tabId).get('location')
  }
}

module.exports = navigationBarState
