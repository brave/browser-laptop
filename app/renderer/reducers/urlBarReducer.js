/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const windowConstants = require('../../../js/constants/windowConstants')
const appConstants = require('../../../js/constants/appConstants')
const {isUrl, getSourceAboutUrl, getSourceMagnetUrl} = require('../../../js/lib/appUrlUtil')
const {isURL, isPotentialPhishingUrl, getUrlFromInput} = require('../../../js/lib/urlutil')
const {getFrameByKey, activeFrameStatePath, frameStatePath, getActiveFrame, getFrameByTabId} = require('../../../js/state/frameStateUtil')
const searchProviders = require('../../../js/data/searchProviders')
const Immutable = require('immutable')
const {navigateSiteClickHandler} = require('../suggestionClickHandlers')
const navigationBarState = require('../../common/state/navigationBarState')
const tabState = require('../../common/state/tabState')

const updateSearchEngineInfoFromInput = (state, frameProps) => {
  const input = frameProps.getIn(['navbar', 'urlbar', 'location'])
  const frameSearchDetail = frameProps.getIn(['navbar', 'urlbar', 'searchDetail'])
  const searchDetailPath = frameStatePath(state, frameProps.get('key')).concat(['navbar', 'urlbar', 'searchDetail'])
  if (!input || !input.length || isUrl(input) || !input.startsWith(':')) {
    state = state.deleteIn(searchDetailPath)
  } else if (!frameSearchDetail || !input.startsWith(frameSearchDetail.get('shortcut') + ' ')) {
    let entries = searchProviders.providers
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (input.startsWith(entry.shortcut + ' ')) {
        state = state.setIn(
          searchDetailPath,
          Immutable.fromJS(Object.assign({}, entry, { activateSearchEngine: true })))
        return state
      }
    }
    state = state.deleteIn(searchDetailPath)
  }
  return state
}

const setUrlSuggestions = (state, suggestionList) => {
  if (suggestionList !== undefined) {
    state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), suggestionList)
  }
  state = updateUrlSuffix(state, suggestionList)
  return state
}

const setRenderUrlBarSuggestions = (state, enabled) => {
  state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'shouldRender']), enabled)
  if (!enabled) {
    state = state.mergeIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions']), {
      selectedIndex: null,
      suggestionList: null
    })
    // Make sure to remove the suffix from the url bar
    state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex']), null)
    state = updateUrlSuffix(state, undefined)
  }
  return state
}

/**
 * Updates the active frame state with what the URL bar suffix should be.
 * @param suggestionList - The suggestion list to use to figure out the suffix.
 */
const updateUrlSuffix = (state, suggestionList) => {
  let selectedIndex = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex'])) || 0
  const lastSuffix = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'urlSuffix']))
  if (!selectedIndex && lastSuffix) {
    selectedIndex = 0
  }
  const suggestion = suggestionList && suggestionList.get(selectedIndex)
  let suffix = ''
  let hasSuggestionMatch = false
  if (suggestion) {
    const autocompleteEnabled = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']))

    if (autocompleteEnabled) {
      const location = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'location'])) || ''
      const index = suggestion.get('location').toLowerCase().indexOf(location.toLowerCase())
      if (index !== -1) {
        const beforePrefix = suggestion.get('location').substring(0, index)
        if (beforePrefix.endsWith('://') || beforePrefix.endsWith('://www.') || index === 0) {
          suffix = suggestion.get('location').substring(index + location.length)
          hasSuggestionMatch = true
        }
      }
    }
  }
  state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'urlSuffix']), suffix)
  state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'hasSuggestionMatch']), hasSuggestionMatch)
  return state
}

const getLocation = (location) => {
  location = location.trim()
  location = getSourceAboutUrl(location) ||
    getSourceMagnetUrl(location) ||
    location

  if (isURL(location)) {
    location = getUrlFromInput(location)
  }

  return location
}

const updateNavBarInput = (state, loc, framePath) => {
  if (framePath === undefined) {
    framePath = activeFrameStatePath(state)
  }
  state = state.setIn(framePath.concat(['navbar', 'urlbar', 'location']), loc)
  return state
}

const navigationAborted = (state, action) => {
  const frame = getFrameByTabId(state, action.tabId)
  if (frame) {
    let location = action.location || frame.get('provisionalLocation')
    if (location) {
      const framePath = frameStatePath(state, frame.get('key'))
      location = getLocation(location)
      state = updateNavBarInput(state, location, framePath)
      state = state.mergeIn(framePath, {
        location
      })
    }
  }
  return state
}

const setNavBarUserInput = (state, location) => {
  state = updateNavBarInput(state, location)
  const activeFrameProps = getActiveFrame(state)
  state = updateSearchEngineInfoFromInput(state, activeFrameProps)
  if (!location) {
    state = setRenderUrlBarSuggestions(state, false)
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

const urlBarReducer = (state, action) => {
  const tabId = state.getIn(activeFrameStatePath(state).concat(['tabId']), tabState.TAB_ID_NONE)
  switch (action.actionType) {
    case appConstants.APP_URL_BAR_TEXT_CHANGED:
      state = setNavBarUserInput(state, action.input)
      break
    case appConstants.APP_URL_BAR_SUGGESTIONS_CHANGED:
      if (action.selectedIndex !== undefined) {
        state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex']), action.selectedIndex)
      }
      state = setUrlSuggestions(state, action.suggestionList)
      break
    case windowConstants.WINDOW_SET_NAVIGATED:
      // For about: URLs, make sure we store the URL as about:something
      // and not what we map to.
      action.location = getLocation(action.location)

      const key = action.key || state.get('activeFrameKey')
      state = state.mergeIn(frameStatePath(state, key), {
        location: action.location
      })
      if (!action.isNavigatedInPage) {
        state = state.mergeIn(frameStatePath(state, key), {
          adblock: {},
          audioPlaybackActive: false,
          computedThemeColor: undefined,
          httpsEverywhere: {},
          icon: undefined,
          location: action.location,
          noScript: {},
          themeColor: undefined,
          title: '',
          trackingProtection: {},
          fingerprintingProtection: {}
        })
      }

      // Update nav bar unless when spawning a new tab. The user might have
      // typed in the URL bar while we were navigating -- we should preserve it.
      if (!(action.location === 'about:newtab' && !getActiveFrame(state).get('canGoForward'))) {
        const key = action.key || state.get('activeFrameKey')
        state = updateNavBarInput(state, action.location, frameStatePath(state, key))
      }

      // For potential phishing pages, show a warning
      if (isPotentialPhishingUrl(action.location)) {
        state = state.setIn(['ui', 'siteInfo', 'isVisible'], true)
      }

      state = state.setIn(frameStatePath(state, key).concat(['navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
      const frame = getFrameByKey(state, key)
      state = updateSearchEngineInfoFromInput(state, frame)
      break
    case windowConstants.WINDOW_SET_NAVIGATION_ABORTED:
      state = navigationAborted(state, action)
      break
    case windowConstants.WINDOW_URL_BAR_ON_FOCUS:
      state = navigationBarState.setFocused(state, tabId, true)
      state = navigationBarState.setSelected(state, tabId, true)
      break
    case windowConstants.WINDOW_URL_BAR_ON_BLUR:
      state = setNavBarUserInput(state, action.targetValue)
      if (!action.fromSuggestion && action.locationValue.length > 0) {
        const locationValueSuffix = navigationBarState.locationValueSuffix(state, tabId)
        setNavBarUserInput(state, action.locationValue + locationValueSuffix)
      }
      break
    case windowConstants.WINDOW_TAB_ON_FOCUS:
      state = navigationBarState.setFocused(state, tabId, false)
      state = setActive(state, false)
      break
    case windowConstants.WINDOW_SET_URL_BAR_SELECTED:
      const urlBarPath = activeFrameStatePath(state).concat(['navbar', 'urlbar'])
      state = state.mergeIn(urlBarPath, {
        selected: action.selected
      })
      // selection implies focus
      if (action.selected) {
        state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'focused']), true)
      }
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
    case windowConstants.WINDOW_ACTIVE_URL_BAR_SUGGESTION_CLICKED:
      const selectedIndex = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex'])) || 0
      const suggestionList = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']))
      if (suggestionList.size > 0) {
        // It's important this doesn't run sync or else the returned state below will overwrite anything done in the click handler
        setImmediate(() => {
          const suggestion = suggestionList.get(selectedIndex)
          navigateSiteClickHandler(suggestion, action.isForSecondaryAction, action.shiftKey)
        })
      }
      break
  }
  return state
}

module.exports = urlBarReducer
