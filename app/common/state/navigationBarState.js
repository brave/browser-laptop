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

    const path = tabState.getFramePathByTabId(state, tabId)
    if (path == null) {
      return null
    }
    return path.push('navbar')
  },

  getNavigationBar: (state, tabId) => {
    state = validateState(state)
    tabState.validateTabId(tabId)

    if (tabId === tabState.TAB_ID_NONE) {
      return defaultState
    }

    const path = api.getNavigationBarPath(state, tabId)
    if (path == null) {
      return defaultState
    }

    return state.getIn(path) || defaultState
  },

  getUrlBarPath: (state, tabId) => {
    const path = api.getNavigationBarPath(state, tabId)
    return path == null ? null : path.push('urlbar')
  },

  getUrlBar: (state, tabId) => {
    const path = api.getUrlBarPath(state, tabId)
    if (path == null) {
      return defaultState.get('urlbar')
    }
    return state.getIn(path) || defaultState.get('urlbar')
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
    const path = api.getUrlBarPath(state, tabId)
    if (path == null) {
      return state
    }
    return state.setIn(path.concat(['suggestions', 'selectedIndex']), index)
  },

  getSelectedIndex: (state, tabId) => {
    state = validateState(state)
    return api.getUrlBar(state, tabId).getIn(['suggestions', 'selectedIndex']) || -1
  },

  setSuggestionList: (state, tabId, suggestionList = []) => {
    state = validateState(state)
    const path = api.getUrlBarPath(state, tabId)
    if (path == null) {
      return state
    }
    suggestionList = makeImmutable(suggestionList)
    return state.setIn(path.concat(['suggestions', 'suggestionList']), suggestionList)
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
    const path = api.getUrlBarPath(state, tabId)
    if (path == null) {
      return state
    }
    return state.setIn(path.concat(['suggestions', 'autocompleteEnabled']), enabled)
  },

  isAutocompleteEnabled: (state, tabId) => {
    return !!api.getUrlBar(state, tabId).getIn(['suggestions', 'autocompleteEnabled'])
  },

  setLocation: (state, tabId, location, counter) => {
    state = validateState(state)
    const path = api.getUrlBarPath(state, tabId)
    if (path == null) {
      return state
    }
    return state.setIn(path.push('location'), location)
  },

  getLocation: (state, tabId) => {
    return api.getUrlBar(state, tabId).get('location')
  },

  setKeyCounter: (state, tabId, counter) => {
    const path = api.getUrlBarPath(state, tabId)
    if (path == null) {
      return state
    }

    if (counter) {
      state = state.setIn(path.push('keyCounter'), counter)
    }
    return state
  },

  getKeyCounter: (state, tabId) => {
    return api.getUrlBar(state, tabId).get('keyCounter')
  },

  setShouldRenderUrlBarSuggestions: (state, tabId, enabled = false) => {
    state = validateState(state)
    const path = api.getUrlBarPath(state, tabId)
    if (path == null) {
      return state
    }
    state = state.setIn(path.concat(['suggestions', 'shouldRender']), enabled)
    if (!enabled) {
      state = state.mergeIn(path.push('suggestions'), defaultState.getIn(['urlbar', 'suggestions']))
    }
    return state
  },

  shouldRenderUrlBarSuggestions: (state, tabId) => {
    const suggestionList = api.getSuggestionList(state, tabId)
    return api.getUrlBar(state, tabId).getIn(['suggestions', 'shouldRender']) === true &&
        suggestionList && suggestionList.size > 0
  },

  setActive: (state, tabId, active = false) => {
    state = validateState(state)
    const path = api.getUrlBarPath(state, tabId)
    if (path == null) {
      return state
    }
    return state.setIn(path.push('active'), active)
  },

  isActive: (state, tabId) => {
    return !!api.getUrlBar(state, tabId).get('active')
  },

  setFocused: (state, tabId, focused = false) => {
    state = validateState(state)
    const path = api.getUrlBarPath(state, tabId)
    if (path == null) {
      return state
    }
    return state.setIn(path.push('focused'), focused)
  },

  isFocused: (state, tabId) => {
    return tabState.isActive(state, tabId) && !!api.getUrlBar(state, tabId).get('focused')
  },

  setSelected: (state, tabId, selected = false) => {
    state = validateState(state)
    const path = api.getUrlBarPath(state, tabId)
    if (path == null) {
      return state
    }
    if (selected) {
      // selection implies focus
      state = state = api.setFocused(state, tabId, true)
    }
    return state.setIn(path.push('selected'), selected)
  },

  isSelected: (state, tabId) => {
    return tabState.isActive(state, tabId) && !!api.getUrlBar(state, tabId).get('selected')
  }
}

module.exports = api
