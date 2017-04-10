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
      shouldRender: false,
      selectedIndex: -1,
      searchResults: [],
      suggestionList: [],
      urlSuffix: ''
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

const api = {

  defaultState,

  getNavigationBarPath: (state, tabId) => {
    state = validateState(state)
    tabState.validateTabId(tabId)

    return tabState.getFramePathByTabId(state, tabId).concat('navbar')
  },

  getNavigationBar: (state, tabId) => {
    state = validateState(state)
    tabState.validateTabId(tabId)

    if (tabId === tabState.TAB_ID_NONE) {
      return defaultState
    }

    return state.getIn(api.getNavigationBarPath(state, tabId)) || defaultState
  },

  getUrlBarPath: (state, tabId) => {
    return api.getNavigationBarPath(state, tabId).concat('urlbar')
  },

  getUrlBar: (state, tabId) => {
    return state.getIn(api.getUrlBarPath(state, tabId)) || defaultState.get('urlbar')
  },

  locationValueSuffix: (state, tabId) => {
    state = validateState(state)
    return api.getUrlBar(state, tabId).getIn(['suggestions', 'urlSuffix']) || ''
  },

  hasLocationValueSuffix: (state, tabId) => {
    state = validateState(state)
    return api.locationValueSuffix(state, tabId).length > 0
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
    const urlbar = api.getUrlBar(state, tabId)
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

  setSelectedIndex: (state, tabId, index = -1) => {
    state = validateState(state)
    return state.setIn(api.getUrlBarPath(state, tabId).concat(['suggestions', 'selectedIndex']), index)
  },

  getSelectedIndex: (state, tabId) => {
    state = validateState(state)
    return api.getUrlBar(state, tabId).getIn(['suggestions', 'selectedIndex']) || -1
  },

  setSuggestionList: (state, tabId, suggestionList = []) => {
    state = validateState(state)
    suggestionList = makeImmutable(suggestionList)
    return state.setIn(api.getUrlBarPath(state, tabId).concat(['suggestions', 'suggestionList']), suggestionList)
  },

  getSuggestionList: (state, tabId) => {
    state = validateState(state)
    state = validateState(state)
    return api.getUrlBar(state, tabId).getIn(['suggestions', 'suggestionList'])
  },

  getSuggestionLocation: (state, tabId) => {
    state = validateState(state)
    const selectedIndex = api.getSelectedIndex(state, tabId)
    const suggestionList = api.getSuggestionList(state, tabId)
    const suggestion = makeImmutable(suggestionList && suggestionList.get(selectedIndex))
    return suggestion && suggestion.get('location')
  },

  setAutocompleteEnabled: (state, tabId, enabled = false) => {
    state = validateState(state)
    return state.setIn(api.getUrlBarPath(state, tabId).concat(['suggestions', 'autocompleteEnabled']), enabled)
  },

  isAutocompleteEnabled: (state, tabId) => {
    return !!api.getUrlBar(state, tabId).getIn(['suggestions', 'autocompleteEnabled'])
  },

  setLocation: (state, tabId, location, counter) => {
    state = validateState(state)
    return state.setIn(api.getUrlBarPath(state, tabId).push('location'), location)
  },

  getLocation: (state, tabId) => {
    return api.getUrlBar(state, tabId).get('location')
  },

  setKeyCounter: (state, tabId, counter) => {
    if (counter) {
      state = state.setIn(api.getUrlBarPath(state, tabId).push('keyCounter'), counter)
    }
    return state
  },

  getKeyCounter: (state, tabId) => {
    return api.getUrlBar(state, tabId).get('keyCounter')
  },

  setShouldRenderUrlBarSuggestions: (state, tabId, enabled = false) => {
    state = validateState(state)
    state = state.setIn(api.getUrlBarPath(state, tabId).concat(['suggestions', 'shouldRender']), enabled)
    if (!enabled) {
      state = state.mergeIn(api.getUrlBarPath(state, tabId).push('suggestions'), defaultState.getIn(['urlbar', 'suggestions']))
    }
    return state
  },

  shouldRenderUrlBarSuggestions: (state, tabId) => {
    const suggestionList = api.getSuggestionList(state, tabId)
    return api.getUrlBar(state, tabId).getIn(['suggestions', 'shouldRender']) === true &&
        suggestionList && suggestionList.size > 0
  },

  setPreviousUrlBarSuggestionSelected: (state, tabId) => {
    if (api.shouldRenderUrlBarSuggestions(state, tabId)) {
      const selectedIndex = api.getSelectedIndex(state, tabId)
      const lastSuffix = api.locationValueSuffix(state, tabId)

      if (selectedIndex !== 0 && !lastSuffix) {
        state = api.setSelectedIndex(state, tabId, 0)
      } else if (selectedIndex > 0) {
        state = api.setSelectedIndex(state, tabId, selectedIndex - 1)
      }
      // state = updateUrlSuffix(state, state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), suggestionList))
    }
    return state
  },

  setNextUrlBarSuggestionSelected: (state, tabId) => {
    if (api.shouldRenderUrlBarSuggestions(state, tabId)) {
      const selectedIndex = api.getSelectedIndex(state, tabId)
      const lastSuffix = api.locationValueSuffix(state, tabId)

      if (selectedIndex !== 0 && !lastSuffix) {
        state = api.setSelectedIndex(state, tabId, 0)
      } else if (selectedIndex > 0) {
        state = api.setSelectedIndex(state, tabId, selectedIndex - 1)
      }
      // state = updateUrlSuffix(state, state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), suggestionList))
    }
    return state
  },

  setActive: (state, tabId, active = false) => {
    state = validateState(state)
    return state.setIn(api.getUrlBarPath(state, tabId).push('active'), active)
  },

  isActive: (state, tabId) => {
    return !!api.getUrlBar(state, tabId).get('active')
  },

  setFocused: (state, tabId, focused = false) => {
    state = validateState(state)
    return state.setIn(api.getUrlBarPath(state, tabId).push('focused'), focused)
  },

  isFocused: (state, tabId) => {
    return tabState.isActive(state, tabId) && !!api.getUrlBar(state, tabId).get('focused')
  },

  setSelected: (state, tabId, selected = false) => {
    state = validateState(state)
    if (selected) {
      // selection implies focus
      state = state = api.setFocused(state, tabId, true)
    }
    return state.setIn(api.getUrlBarPath(state, tabId).push('selected'), selected)
  },

  isSelected: (state, tabId) => {
    return tabState.isActive(state, tabId) && !!api.getUrlBar(state, tabId).get('selected')
  }
}

module.exports = api
