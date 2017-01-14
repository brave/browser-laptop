/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const windowConstants = require('../../../js/constants/windowConstants')
const getSetting = require('../../../js/settings').getSetting
const fetchSearchSuggestions = require('../fetchSearchSuggestions')
const {activeFrameStatePath, frameStatePath, getFrameKeyByTabId, getActiveFrame} = require('../../../js/state/frameStateUtil')
const searchProviders = require('../../../js/data/searchProviders')
const settings = require('../../../js/constants/settings')
const Immutable = require('immutable')
const config = require('../../../js/constants/config')
const top500 = require('../../../js/data/top500')
const {aboutUrls, isNavigatableAboutPage, isSourceAboutUrl, isUrl} = require('../../../js/lib/appUrlUtil')
const siteTags = require('../../../js/constants/siteTags')
const suggestion = require('../lib/suggestion')
const suggestionTypes = require('../../../js/constants/suggestionTypes')
const {navigateSiteClickHandler, frameClickHandler} = require('../suggestionClickHandlers')
// TODO: I think appStoreRenderer should just be collapsed into windowStore to avoid this
const appStoreRenderer = require('../../../js/stores/appStoreRenderer')

const updateSearchEngineInfoFromInput = (state, frameProps) => {
  const input = frameProps.getIn(['navbar', 'urlbar', 'location'])
  const frameSearchDetail = frameProps.getIn(['navbar', 'urlbar', 'searchDetail'])
  if (input && input.length > 0) {
    const isLocationUrl = isUrl(input)
    if (!isLocationUrl &&
      !(frameSearchDetail && input.startsWith(frameSearchDetail.get('shortcut') + ' '))) {
      let entries = searchProviders.providers
      entries.forEach((entry) => {
        if (input.startsWith(entry.shortcut + ' ')) {
          state = state.setIn(
            frameStatePath(state, frameProps.get('key')).concat(['navbar', 'urlbar', 'searchDetail']),
            Immutable.fromJS(Object.assign({}, entry, { activateSearchEngine: true })))
        }
      })
    }
  }
  return state
}

const searchXHR = (state, frameProps, searchOnline) => {
  const searchDetail = state.get('searchDetail')
  const frameSearchDetail = frameProps.getIn(['navbar', 'urlbar', 'searchDetail'])
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
      const location = state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'location']))
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
  const sites = appStoreRenderer.state.get('sites')
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
        return site.toLowerCase().includes(urlLocationLower)
      }
  }) => // Filter out things which are already in our own list at a smaller index
    data
    // Per suggestion provider filter
    .filter(filterValue)
    // Filter out things which are already in the suggestions list
    .filter((site) =>
      suggestionsList.findIndex((x) => (x.location || '').toLowerCase() === (formatUrl(site) || '').toLowerCase()) === -1 ||
        // Tab autosuggestions should always be included since they will almost always be in history
        type === suggestionTypes.TAB)
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

  const historyFilter = (site) => {
    if (!site) {
      return false
    }
    const title = site.get('title') || ''
    const location = site.get('location') || ''
    // Note: Bookmark sites are now included in history. This will allow
    // sites to appear in the auto-complete regardless of their bookmark
    // status. If history is turned off, bookmarked sites will appear
    // in the bookmark section.
    return (title.toLowerCase().includes(urlLocationLower) ||
            location.toLowerCase().includes(urlLocationLower)) &&
            site.get('lastAccessedTime')
  }
  var historySites = sites.filter(historyFilter)

  // potentially append virtual history items (such as www.google.com when
  // searches have been made but the root site has not been visited)
  historySites = historySites.concat(suggestion.createVirtualHistoryItems(historySites))

  // history
  if (getSetting(settings.HISTORY_SUGGESTIONS)) {
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
      filterValue: historyFilter
    }))
  }

  // bookmarks
  if (getSetting(settings.BOOKMARK_SUGGESTIONS)) {
    suggestionsList = suggestionsList.concat(mapListToElements({
      data: sites,
      maxResults: config.urlBarSuggestions.maxBookmarkSites,
      type: suggestionTypes.BOOKMARK,
      clickHandler: navigateSiteClickHandler((site) => {
        return site.get('location')
      }),
      sortHandler: sortBasedOnLocationPos,
      formatTitle: (site) => site.get('title'),
      formatUrl: (site) => site.get('location'),
      filterValue: (site) => {
        const title = site.get('title') || ''
        const location = site.get('location') || ''
        return (title.toLowerCase().includes(urlLocationLower) ||
          location.toLowerCase().includes(urlLocationLower)) &&
          site.get('tags') && site.get('tags').includes(siteTags.BOOKMARK)
      }
    }))
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
        (frame.get('title') && frame.get('title').toLowerCase().includes(urlLocationLower) ||
        frame.get('location') && frame.get('location').toLowerCase().includes(urlLocationLower))}))
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

const urlBarSuggestionsReducer = (state, action) => {
  switch (action.actionType) {
    case windowConstants.WINDOW_SET_NAVIGATED:
      state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
      break
    case windowConstants.WINDOW_SET_FINDBAR_SHOWN:
      if (action.shown) {
        state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
      }
      break
    case windowConstants.WINDOW_SET_URL:
      state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'searchResults']), Immutable.fromJS([]))
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
      }
      state = updateUrlSuffix(state, state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), suggestionList))
      break
    }
    case windowConstants.WINDOW_SEARCH_SUGGESTION_RESULTS_AVAILABLE:
      const frameKey = getFrameKeyByTabId(state, action.tabId)
      state = state.setIn(frameStatePath(state, frameKey).concat(['navbar', 'urlbar', 'suggestions', 'searchResults']), action.searchResults)
      break
    case windowConstants.WINDOW_SET_NAVBAR_INPUT:
      const activeFrameProps = getActiveFrame(state)
      state = updateSearchEngineInfoFromInput(state, activeFrameProps)
      state = searchXHR(state, activeFrameProps, true)
      state = generateNewSuggestionsList(state)
      state = updateUrlSuffix(state, state.getIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), action.suggestionList))
      if (!action.location) {
        state = setRenderUrlBarSuggestions(state, false)
      }
      break
    case windowConstants.WINDOW_URL_BAR_AUTOCOMPLETE_ENABLED:
      state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']), action.enabled)
      break
    case windowConstants.WINDOW_SET_URL_BAR_SUGGESTIONS:
      state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex']), action.selectedIndex)
      state = setUrlSuggestions(state, action.suggestionList)
      break
    case windowConstants.WINDOW_SET_URL_BAR_SUGGESTION_SEARCH_RESULTS:
      state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'searchResults']), action.searchResults)
      break
    case windowConstants.WINDOW_SET_URL_BAR_ACTIVE:
      state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'active']), action.isActive)
      if (!action.isActive) {
        state = state.setIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
        state = state.mergeIn(activeFrameStatePath(state).concat(['navbar', 'urlbar', 'suggestions']), {
          selectedIndex: null,
          suggestionList: null
        })
      }
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
    default:
      return state
  }
  return state
}

module.exports = urlBarSuggestionsReducer
