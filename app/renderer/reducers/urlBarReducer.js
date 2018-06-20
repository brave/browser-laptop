/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const windowConstants = require('../../../js/constants/windowConstants')
const appConstants = require('../../../js/constants/appConstants')
const {isURL} = require('../../../js/lib/urlutil')
const {activeFrameStatePath, frameStatePath, getFrameByTabId, isTor} = require('../../../js/state/frameStateUtil')
const searchProviders = require('../../../js/data/searchProviders')
const Immutable = require('immutable')
const {navigateSiteClickHandler} = require('../suggestionClickHandlers')
const navigationBarState = require('../../common/state/navigationBarState')
const tabState = require('../../common/state/tabState')
const {normalizeLocation} = require('../../common/lib/suggestion')
const { getSetting } = require('../../../js/settings')
const settings = require('../../../js/constants/settings')
const tabActionConsts = require('../../common/constants/tabAction')

const updateSearchEngineInfoFromInput = (state, frameProps) => {
  const input = frameProps.getIn(['navbar', 'urlbar', 'location'])
  const frameSearchDetail = frameProps.getIn(['navbar', 'urlbar', 'searchDetail'])
  const searchDetailPath = frameStatePath(state, frameProps.get('key')).concat(['navbar', 'urlbar', 'searchDetail'])
  if (!input || !input.length || isURL(input)) {
    // handle not a search
    state = state.deleteIn(searchDetailPath)
  } else if (!frameSearchDetail || !input.startsWith(frameSearchDetail.get('shortcut') + ' ')) {
    // handle no existing search engine chosen, or there is and user is asking for a different one
    let entries = searchProviders.providers
    // handle user-requested search engine by shortcut
    if (input.startsWith(':')) {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        if (input.startsWith(entry.shortcut + ' ')) {
          state = state.setIn(
            searchDetailPath,
            Immutable.fromJS(Object.assign({}, entry, { activateSearchEngine: true })))
          return state
        }
      }
    }
    if (frameProps.get('isPrivate')) {
      // handle private tab search with default search provider
      const useAlternateDefaultPrivateSearchProvider =
        getSetting(isTor(frameProps) ? settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE_TOR : settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE)
      if (useAlternateDefaultPrivateSearchProvider === true) {
        // DuckDuckGo hard-coded as Private Tab default provider
        // if asked to use a privacy-centric 'alternative'
        const privateProviderName = 'DuckDuckGo'
        const privateTabSearchProvider = searchProviders.providers.find(provider => provider.name === privateProviderName)
        if (privateTabSearchProvider) {
          state = state.setIn(
            searchDetailPath,
            Immutable.fromJS(Object.assign({}, privateTabSearchProvider, { activateSearchEngine: true }))
          )
          return state
        }
      }
    }
    // handle no custom search provider (use default)
    state = state.deleteIn(searchDetailPath)
  }
  return state
}

const setUrlSuggestions = (state, suggestionList) => {
  if (suggestionList !== undefined) {
    state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), suggestionList)
    state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex']), null)
  }
  state = updateUrlSuffix(state, suggestionList)
  return state
}

const setRenderUrlBarSuggestions = (state, enabled, framePath) => {
  if (framePath === undefined) {
    framePath = activeFrameStatePath(state)
  }
  state = state.setIn(framePath.concat(['navbar', 'urlbar', 'suggestions', 'shouldRender']), enabled)
  if (!enabled) {
    state = state.mergeIn(framePath.concat(['navbar', 'urlbar', 'suggestions']), {
      selectedIndex: null,
      suggestionList: null
    })
    // Make sure to remove the suffix from the url bar
    state = state.setIn(framePath.concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex']), null)
    state = updateUrlSuffix(state, undefined, framePath)
  }
  return state
}

/**
 * Updates the active frame state with what the URL bar suffix should be.
 * @param suggestionList - The suggestion list to use to figure out the suffix.
 */
const updateUrlSuffix = (state, suggestionList, framePath) => {
  if (framePath === undefined) {
    framePath = activeFrameStatePath(state)
  }
  let selectedIndex = state.getIn(framePath.concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex'])) || 0
  const lastSuffix = state.getIn(framePath.concat(['navbar', 'urlbar', 'suggestions', 'urlSuffix']))
  if (!selectedIndex && lastSuffix) {
    selectedIndex = 0
  }
  const suggestion = suggestionList && suggestionList.get(selectedIndex)
  let suffix = ''
  let hasSuggestionMatch = false
  if (suggestion) {
    const autocompleteEnabled = state.getIn(framePath.concat(['navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']))

    if (autocompleteEnabled) {
      const location = normalizeLocation(state.getIn(framePath.concat(['navbar', 'urlbar', 'location']))) || ''
      const normalizedSuggestion = suggestion.get && suggestion.get('location')
        ? normalizeLocation(suggestion.get('location').toLowerCase())
        : ''
      const index = normalizedSuggestion.indexOf(location.toLowerCase())
      if (index === 0) {
        suffix = normalizedSuggestion.substring(index + location.length)
        hasSuggestionMatch = true
      }
    }
  }
  state = state.setIn(framePath.concat(['navbar', 'urlbar', 'suggestions', 'urlSuffix']), suffix)
  state = state.setIn(framePath.concat(['navbar', 'urlbar', 'suggestions', 'hasSuggestionMatch']), hasSuggestionMatch)
  return state
}

/**
 * Accepts whatever suffix is present as part of the user input
 */
const acceptUrlSuffix = (state, framePath) => {
  const lastSuffix = state.getIn(framePath.concat(['navbar', 'urlbar', 'suggestions', 'urlSuffix']))
  if (lastSuffix) {
    const input = state.getIn(framePath.concat(['navbar', 'urlbar', 'location']))
    state = setNavBarUserInput(state, input + lastSuffix, framePath)
  }
  state = state.mergeIn(framePath.concat(['navbar', 'urlbar', 'suggestions']), {
    selectedIndex: null,
    suggestionList: null
  })
  return state
}

const updateNavBarInput = (state, loc, framePath) => {
  if (framePath === undefined) {
    framePath = activeFrameStatePath(state)
  }
  state = state.setIn(framePath.concat(['navbar', 'urlbar', 'location']), loc)
  return state
}

const setNavBarUserInput = (state, location, framePath) => {
  if (framePath === undefined) {
    framePath = activeFrameStatePath(state)
  }
  state = updateNavBarInput(state, location, framePath)
  const frameProps = state.getIn(framePath)
  state = updateSearchEngineInfoFromInput(state, frameProps)
  if (!location) {
    state = setRenderUrlBarSuggestions(state, false, framePath)
  }
  return state
}

const setActive = (state, isActive) => {
  state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'active']), isActive)
  if (!isActive) {
    state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
    state = state.mergeIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions']), {
      selectedIndex: null,
      suggestionList: null
    })
  }
  return state
}

const setUrlBarSelected = (state, selected) => {
  const framePath = activeFrameStatePath(state)
  const urlBarPath = framePath.concat(['navbar', 'urlbar'])
  state = acceptUrlSuffix(state, framePath)
  state = state.mergeIn(urlBarPath, {
    selected: selected
  })
  // selection implies focus
  if (selected) {
    state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'focused']), true)
  }
  state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']), false)
  state = setRenderUrlBarSuggestions(state, false, framePath)
  return state
}

const urlBarReducer = (state, action) => {
  // TODO(bridiver) - this is a workaround until we can migrate frames to tabs
  if (action.actionType === tabActionConsts.FINISH_NAVIGATION) {
    const tabId = action.tabId
    const navigationState = action.navigationState

    const displayURL = navigationState.getIn(['visibleEntry', 'virtualURL'])
    const frame = getFrameByTabId(state, tabId)
    if (frame) {
      state = setNavBarUserInput(state, displayURL, frameStatePath(state, frame.get('key')))
      state = state.setIn(frameStatePath(state, frame.get('key')).concat(['navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
    }
    return state
  }

  const framePath = activeFrameStatePath(state)
  if (!framePath) {
    return state
  }
  const activeTabId = state.getIn(framePath.concat(['tabId']), tabState.TAB_ID_NONE)
  if (activeTabId === tabState.TAB_ID_NONE) {
    return state
  }

  const tabId = state.getIn(activeFrameStatePath(state).concat(['tabId']), tabState.TAB_ID_NONE)
  switch (action.actionType) {
    case appConstants.APP_URL_BAR_TEXT_CHANGED:
      state = setNavBarUserInput(state, action.input)
      break
    case appConstants.APP_URL_BAR_SELECTED_INDEX_CHANGED:
      {
        const suggestionList = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']))
        state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex']), action.selectedIndex)
        state = updateUrlSuffix(state, suggestionList)
        break
      }
    case appConstants.APP_URL_BAR_SUGGESTIONS_CHANGED:
      if (action.selectedIndex !== undefined) {
        state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex']), action.selectedIndex)
      }
      state = setUrlSuggestions(state, action.suggestionList)
      state = updateUrlSuffix(state, action.suggestionList)
      break
    case windowConstants.WINDOW_URL_BAR_ON_FOCUS:
      state = navigationBarState.setFocused(state, tabId, true)
      state = navigationBarState.setSelected(state, tabId, true)
      break
    case windowConstants.WINDOW_URL_BAR_ON_BLUR:
      state = setNavBarUserInput(state, action.targetValue)
      state = navigationBarState.setFocused(state, tabId, false)
      if (!action.fromSuggestion && action.locationValue.length > 0) {
        const locationValueSuffix = navigationBarState.locationValueSuffix(state, tabId)
        setNavBarUserInput(state, action.locationValue + locationValueSuffix)
      }
      break
    case windowConstants.WINDOW_TAB_ON_FOCUS:
      state = navigationBarState.setFocused(state, tabId, false)
      state = setActive(state, false)
      break
    case windowConstants.WINDOW_URL_BAR_SELECTED:
      state = setUrlBarSelected(state, action.selected)
      break
    case windowConstants.WINDOW_SET_FINDBAR_SHOWN:
      if (action.shown) {
        state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
      }
      break
    case windowConstants.WINDOW_PREVIOUS_URL_BAR_SUGGESTION_SELECTED: {
      const selectedIndexPath = activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex'])
      const suggestionList = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']))
      const selectedIndex = state.getIn(selectedIndexPath)
      const hasSuggestionMatch = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'hasSuggestionMatch']))
      if (!selectedIndex && selectedIndex !== 0 && !hasSuggestionMatch) {
        state = state.setIn(selectedIndexPath, 0)
      } else if (selectedIndex > 0) {
        state = state.setIn(selectedIndexPath, selectedIndex - 1)
      } else {
        state = state.setIn(selectedIndexPath, suggestionList.size - 1)
      }
      state = updateUrlSuffix(state, state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), suggestionList))
      break
    }
    case windowConstants.WINDOW_NEXT_URL_BAR_SUGGESTION_SELECTED: {
      const selectedIndexPath = activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex'])
      const suggestionList = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']))
      const selectedIndex = state.getIn(selectedIndexPath)
      const hasSuggestionMatch = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'hasSuggestionMatch']))
      if (!selectedIndex && selectedIndex !== 0 && !hasSuggestionMatch) {
        state = state.setIn(selectedIndexPath, 0)
      } else if (selectedIndex < suggestionList.size - 1) {
        state = state.setIn(selectedIndexPath, selectedIndex + 1)
      } else if (selectedIndex === suggestionList.size - 1) {
        state = state.setIn(selectedIndexPath, 0)
      }
      state = updateUrlSuffix(state, state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), suggestionList))
      break
    }
    case windowConstants.WINDOW_URL_BAR_AUTOCOMPLETE_ENABLED:
      state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']), action.enabled)
      break
    case windowConstants.WINDOW_SET_URL_BAR_ACTIVE:
      state = setActive(state, action.isActive)
      break
    case windowConstants.WINDOW_SET_RENDER_URL_BAR_SUGGESTIONS:
      state = setRenderUrlBarSuggestions(state, action.enabled)
      break
    case windowConstants.WINDOW_ACTIVE_URL_BAR_SUGGESTION_CLICKED: {
      const activeFramePath = activeFrameStatePath(state)
      const selectedIndex = state.getIn(activeFramePath.concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex'])) || 0
      const suggestionList = state.getIn(activeFramePath.concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']))
      state = state.setIn(activeFramePath.concat(['navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']), false)
      if (suggestionList.size > 0) {
        // It's important this doesn't run sync or else the returned state below will overwrite anything done in the click handler
        setImmediate(() => {
          const suggestion = suggestionList.get(selectedIndex)
          navigateSiteClickHandler(suggestion, action.isForSecondaryAction, action.shiftKey)
        })
      }
      break
    }
    case windowConstants.WINDOW_ON_STOP:
      if (action.isFocused) {
        state = setActive(state, false)
        if (!action.shouldRender) {
          state = setUrlBarSelected(state, true)
        }
      }
      break
  }
  return state
}

module.exports = urlBarReducer
