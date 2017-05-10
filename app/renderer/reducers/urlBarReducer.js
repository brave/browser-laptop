/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const windowConstants = require('../../../js/constants/windowConstants')
const appConstants = require('../../../js/constants/appConstants')
const {aboutUrls, isNavigatableAboutPage, isSourceAboutUrl, isUrl, getSourceAboutUrl, getSourceMagnetUrl} = require('../../../js/lib/appUrlUtil')
const {isURL, isPotentialPhishingUrl, getUrlFromInput} = require('../../../js/lib/urlutil')
const {getFrameByKey, getFrameKeyByTabId, activeFrameStatePath, frameStatePath, getActiveFrame, getFrameByTabId} = require('../../../js/state/frameStateUtil')
const getSetting = require('../../../js/settings').getSetting
const {isBookmark, isDefaultEntry, isHistoryEntry} = require('../../../js/state/siteUtil')
const fetchSearchSuggestions = require('../fetchSearchSuggestions')
const searchProviders = require('../../../js/data/searchProviders')
const settings = require('../../../js/constants/settings')
const Immutable = require('immutable')
const config = require('../../../js/constants/config')
const top500 = require('../../../js/data/top500')
const suggestion = require('../lib/suggestion')
const suggestionTypes = require('../../../js/constants/suggestionTypes')
const {navigateSiteClickHandler, frameClickHandler} = require('../suggestionClickHandlers')
const appStoreRenderer = require('../../../js/stores/appStoreRenderer')

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

const searchXHR = (state, frameProps, searchOnline) => {
  const searchDetail = state.get('searchDetail')
  const frameSearchDetail = frameProps.getIn(['navbar', 'urlbar', 'searchDetail'])
  if (!searchDetail && !frameSearchDetail) {
    return state
  }
  let autocompleteURL = frameSearchDetail
    ? frameSearchDetail.get('autocomplete')
    : searchDetail.get('autocompleteURL')
  if (!getSetting(settings.OFFER_SEARCH_SUGGESTIONS) || !autocompleteURL) {
    state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'searchResults']), Immutable.fromJS([]))
    return state
  }

  let input = frameProps.getIn(['navbar', 'urlbar', 'location'])
  if (!isUrl(input) && input.length > 0) {
    if (searchDetail) {
      const replaceRE = new RegExp('^' + searchDetail.get('shortcut') + ' ', 'g')
      input = input.replace(replaceRE, '')
    }

    if (searchOnline) {
      fetchSearchSuggestions(frameProps.get('tabId'), autocompleteURL, input)
    }
  } else {
    state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'searchResults']), Immutable.fromJS([]))
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
  if (suggestion) {
    const autocompleteEnabled = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']))

    if (autocompleteEnabled) {
      const location = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'location'])) || ''
      const index = suggestion.location.toLowerCase().indexOf(location.toLowerCase())
      if (index !== -1) {
        const beforePrefix = suggestion.location.substring(0, index)
        if (beforePrefix.endsWith('://') || beforePrefix.endsWith('://www.') || index === 0) {
          suffix = suggestion.location.substring(index + location.length)
        }
      }
    }
  }
  state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'urlSuffix']), suffix)
  return state
}

const generateNewSuggestionsList = (state) => {
  const activeFrameKey = state.get('activeFrameKey')
  const urlLocation = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'location']))
  const searchResults = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'searchResults']))
  const frameSearchDetail = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'searchDetail']))
  const searchDetail = state.get('searchDetail')

  if (!urlLocation) {
    return state
  }

  const urlLocationLower = urlLocation.toLowerCase()
  let suggestionsList = new Immutable.List()
  const defaultme = (x) => x
  const mapListToElements = ({data, maxResults, type, clickHandler = navigateSiteClickHandler.bind(this),
      sortHandler = defaultme, formatTitle = defaultme, formatUrl = defaultme,
      filterValue = (site) => {
        return site.toLowerCase().indexOf(urlLocationLower) !== -1
      }
  }) => {
    // Filter out things which are already in our own list at a smaller index
    // Filter out things which are already in the suggestions list
    let filteredData = data.filter((site) =>
      suggestionsList.findIndex((x) => (x.location || '').toLowerCase() === (formatUrl(site) || '').toLowerCase()) === -1 ||
        // Tab autosuggestions should always be included since they will almost always be in history
        type === suggestionTypes.TAB)
    // Per suggestion provider filter
    if (filterValue) {
      filteredData = filteredData.filter(filterValue)
    }

    return filteredData
      .sort(sortHandler)
      .take(maxResults)
      .map((site) => {
        return {
          onClick: clickHandler.bind(null, site),
          title: formatTitle(site),
          location: formatUrl(site),
          type
        }
      })
  }

  const shouldNormalize = suggestion.shouldNormalizeLocation(urlLocationLower)
  const urlLocationLowerNormalized = suggestion.normalizeLocation(urlLocationLower)
  const sortBasedOnLocationPos = (s1, s2) => {
    const location1 = shouldNormalize ? suggestion.normalizeLocation(s1.get('location')) : s1.get('location')
    const location2 = shouldNormalize ? suggestion.normalizeLocation(s2.get('location')) : s2.get('location')
    const pos1 = location1.indexOf(urlLocationLowerNormalized)
    const pos2 = location2.indexOf(urlLocationLowerNormalized)
    if (pos1 === -1 && pos2 === -1) {
      return 0
    } else if (pos1 === -1) {
      return 1
    } else if (pos2 === -1) {
      return -1
    } else {
      if (pos1 - pos2 !== 0) {
        return pos1 - pos2
      } else {
        // sort site.com higher than site.com/somepath
        const sdnv1 = suggestion.simpleDomainNameValue(s1)
        const sdnv2 = suggestion.simpleDomainNameValue(s2)
        if (sdnv1 !== sdnv2) {
          return sdnv2 - sdnv1
        } else {
          // If there's a tie on the match location, use the age
          // decay modified access count
          return suggestion.sortByAccessCountWithAgeDecay(s1, s2)
        }
      }
    }
  }

  // NOTE: Iterating sites can take a long time! Please be mindful when
  // working with the history and bookmark suggestion code.
  const historySuggestionsOn = getSetting(settings.HISTORY_SUGGESTIONS)
  const bookmarkSuggestionsOn = getSetting(settings.BOOKMARK_SUGGESTIONS)
  const shouldIterateSites = historySuggestionsOn || bookmarkSuggestionsOn
  if (shouldIterateSites) {
    // Note: Bookmark sites are now included in history. This will allow
    // sites to appear in the auto-complete regardless of their bookmark
    // status. If history is turned off, bookmarked sites will appear
    // in the bookmark section.
    const sitesFilter = (site) => {
      const location = site.get('location')
      if (!location) {
        return false
      }
      const title = site.get('title')
      return location.toLowerCase().indexOf(urlLocationLower) !== -1 ||
        (title && title.toLowerCase().indexOf(urlLocationLower) !== -1)
    }

    let historySites = new Immutable.List()
    let bookmarkSites = new Immutable.List()
    const sites = appStoreRenderer.state.get('sites')
    sites.forEach(site => {
      if (!sitesFilter(site)) {
        return
      }
      if (historySuggestionsOn && isHistoryEntry(site) && !isDefaultEntry(site)) {
        historySites = historySites.push(site)
        return
      }
      if (bookmarkSuggestionsOn && isBookmark(site) && !isDefaultEntry(site)) {
        bookmarkSites = bookmarkSites.push(site)
      }
    })

    if (historySites.size > 0) {
      historySites = historySites.concat(suggestion.createVirtualHistoryItems(historySites))

      suggestionsList = suggestionsList.concat(mapListToElements({
        data: historySites,
        maxResults: config.urlBarSuggestions.maxHistorySites,
        type: suggestionTypes.HISTORY,
        clickHandler: navigateSiteClickHandler((site) => {
          return site.get('location')
        }),
        sortHandler: sortBasedOnLocationPos,
        formatTitle: (site) => site.get('title'),
        formatUrl: (site) => site.get('location'),
        filterValue: null
      }))
    }

    if (bookmarkSites.size > 0) {
      suggestionsList = suggestionsList.concat(mapListToElements({
        data: bookmarkSites,
        maxResults: config.urlBarSuggestions.maxBookmarkSites,
        type: suggestionTypes.BOOKMARK,
        clickHandler: navigateSiteClickHandler((site) => {
          return site.get('location')
        }),
        sortHandler: sortBasedOnLocationPos,
        formatTitle: (site) => site.get('title'),
        formatUrl: (site) => site.get('location'),
        filterValue: null
      }))
    }
  }

  // about pages
  suggestionsList = suggestionsList.concat(mapListToElements({
    data: aboutUrls.keySeq().filter((x) => isNavigatableAboutPage(x)),
    maxResults: config.urlBarSuggestions.maxAboutPages,
    type: suggestionTypes.ABOUT_PAGES,
    clickHandler: navigateSiteClickHandler((x) => x)}))

  // opened frames
  if (getSetting(settings.OPENED_TAB_SUGGESTIONS)) {
    suggestionsList = suggestionsList.concat(mapListToElements({
      data: state.get('frames'),
      maxResults: config.urlBarSuggestions.maxOpenedFrames,
      type: suggestionTypes.TAB,
      clickHandler: frameClickHandler,
      sortHandler: sortBasedOnLocationPos,
      formatTitle: (frame) => frame.get('title'),
      formatUrl: (frame) => frame.get('location'),
      filterValue: (frame) => !isSourceAboutUrl(frame.get('location')) &&
        frame.get('key') !== activeFrameKey &&
        (
          (frame.get('title') && frame.get('title').toLowerCase().indexOf(urlLocationLower) !== -1) ||
          (frame.get('location') && frame.get('location').toLowerCase().indexOf(urlLocationLower) !== -1)
        )
    }))
  }

  // Search suggestions
  if (getSetting(settings.OFFER_SEARCH_SUGGESTIONS) && searchResults) {
    suggestionsList = suggestionsList.concat(mapListToElements({
      data: searchResults,
      maxResults: config.urlBarSuggestions.maxSearch,
      type: suggestionTypes.SEARCH,
      clickHandler: navigateSiteClickHandler((searchTerms) => {
        let searchURL = frameSearchDetail
        ? frameSearchDetail.get('search') : searchDetail.get('searchURL')
        return searchURL.replace('{searchTerms}', encodeURIComponent(searchTerms))
      })
    }))
  }

  // Alexa top 500
  suggestionsList = suggestionsList.concat(mapListToElements({
    data: top500,
    maxResults: config.urlBarSuggestions.maxTopSites,
    type: suggestionTypes.TOP_SITE,
    clickHandler: navigateSiteClickHandler((x) => x)}))

  return setUrlSuggestions(state, suggestionsList)
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
  state = searchXHR(state, activeFrameProps, true)
  state = generateNewSuggestionsList(state)
  state = updateUrlSuffix(state, state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), Immutable.Map()))
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
      const lastSuffix = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'urlSuffix']))
      if (!selectedIndex && selectedIndex !== 0 && !lastSuffix) {
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
      const lastSuffix = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'urlSuffix']))
      if (!selectedIndex && selectedIndex !== 0 && !lastSuffix) {
        state = state.setIn(selectedIndexPath, 0)
      } else if (selectedIndex < suggestionList.size - 1) {
        state = state.setIn(selectedIndexPath, selectedIndex + 1)
      } else if (selectedIndex === suggestionList.size - 1) {
        state = state.setIn(selectedIndexPath, 0)
      }
      state = updateUrlSuffix(state, state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), suggestionList))
      break
    }
    case windowConstants.WINDOW_SEARCH_SUGGESTION_RESULTS_AVAILABLE:
      const frameKey = getFrameKeyByTabId(state, action.tabId)
      state = state.setIn(frameStatePath(state, frameKey).concat(['navbar', 'urlbar', 'suggestions', 'searchResults']), action.searchResults)
      state = generateNewSuggestionsList(state)
      break
    case windowConstants.WINDOW_URL_BAR_AUTOCOMPLETE_ENABLED:
      state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']), action.enabled)
      break
    case windowConstants.WINDOW_SET_URL_BAR_SUGGESTIONS:
      state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex']), action.selectedIndex)
      state = setUrlSuggestions(state, action.suggestionList)
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
        setImmediate(() =>
          suggestionList.get(selectedIndex).onClick(action.isForSecondaryAction, action.shiftKey))
      }
      break
  }
  return state
}

module.exports = urlBarReducer
