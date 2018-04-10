/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// State
const bookmarksState = require('../state/bookmarksState')
const tabState = require('../state/tabState')
const historyState = require('../state/historyState')

// Constants
const dragTypes = require('../../../js/constants/dragTypes')
const {bookmarksToolbarMode} = require('../constants/settingsEnums')
const settings = require('../../../js/constants/settings')
const siteTags = require('../../../js/constants/siteTags')
const newTabData = require('../../../js/data/newTabData')

// Utils
const bookmarkLocationCache = require('../cache/bookmarkLocationCache')
const {getSetting} = require('../../../js/settings')
const UrlUtil = require('../../../js/lib/urlutil')
const {makeImmutable} = require('../state/immutableUtil')

const bookmarkHangerHeading = (editMode, isAdded) => {
  if (isAdded) {
    return 'bookmarkAdded'
  }

  return editMode
    ? 'bookmarkEdit'
    : 'bookmarkCreateNew'
}

const isBookmarkNameValid = (location) => {
  return location != null && location.trim().length > 0
}

const showOnlyText = () => {
  const btbMode = getSetting(settings.BOOKMARKS_TOOLBAR_MODE)
  return btbMode === bookmarksToolbarMode.TEXT_ONLY
}

const showTextAndFavicon = () => {
  const btbMode = getSetting(settings.BOOKMARKS_TOOLBAR_MODE)
  return btbMode === bookmarksToolbarMode.TEXT_AND_FAVICONS
}

const showOnlyFavicon = () => {
  const btbMode = getSetting(settings.BOOKMARKS_TOOLBAR_MODE)
  return btbMode === bookmarksToolbarMode.FAVICONS_ONLY
}

const showFavicon = () => {
  const btbMode = getSetting(settings.BOOKMARKS_TOOLBAR_MODE)
  return btbMode === bookmarksToolbarMode.TEXT_AND_FAVICONS ||
    btbMode === bookmarksToolbarMode.FAVICONS_ONLY
}

const getDNDBookmarkData = (state, bookmarkKey) => {
  const data = (state.getIn(['dragData', 'dragOverData', 'draggingOverType']) === dragTypes.BOOKMARK &&
    state.getIn(['dragData', 'dragOverData'], Immutable.Map())) || Immutable.Map()

  return data.get('draggingOverKey') === bookmarkKey ? data : Immutable.Map()
}

const getDetailFromFrame = (frame) => {
  if (frame == null) {
    return null
  }

  return Immutable.fromJS({
    location: frame.get('location'),
    title: frame.get('title'),
    partitionNumber: frame.get('partitionNumber'),
    favicon: frame.get('icon'),
    themeColor: frame.get('themeColor') || frame.get('computedThemeColor')
  })
}

/**
 * Checks if a location is bookmarked.
 *
 * @param state The application state Immutable map
 * @param {string} location
 * @return {boolean}
 */
const isLocationBookmarked = (state, location) => {
  const bookmarks = bookmarksState.getBookmarks(state)
  const siteKeys = bookmarkLocationCache.getCacheKey(state, location)

  if (siteKeys.isEmpty() || bookmarks.isEmpty()) {
    return false
  }

  return siteKeys.some(key => bookmarks.has(key))
}

/**
 * Converts a siteDetail to createProperties format
 * @param {Object} bookmark - A bookmark detail as per app state
 * @return {Object} A createProperties plain JS object, not ImmutableJS
 */
const toCreateProperties = (bookmark) => {
  if (bookmark == null) {
    return null
  }

  return {
    url: bookmark.get('location'),
    partitionNumber: bookmark.get('partitionNumber')
  }
}

const isBookmark = (bookmark) => {
  if (bookmark == null) {
    return false
  }

  return bookmark.get('type') === siteTags.BOOKMARK
}

const updateTabBookmarked = (state, tabValue) => {
  if (!tabValue || !tabValue.has('tabId')) {
    return state
  }

  const bookmarked = isLocationBookmarked(state, tabValue.get('url'))
  return tabState.updateTabValue(state, tabValue.set('bookmarked', bookmarked))
}

const updateActiveTabBookmarked = (state) => {
  const tab = tabState.getActiveTab(state)
  if (!tab) {
    return state
  }

  return module.exports.updateTabBookmarked(state, tab)
}

const getKey = (siteDetail) => {
  if (!siteDetail) {
    return null
  }

  let location = siteDetail.get('location')

  if (location) {
    location = UrlUtil.getLocationIfPDF(location)
    return location + '|' +
      (siteDetail.get('partitionNumber') || 0) + '|' +
      (siteDetail.get('parentFolderId') || 0)
  }
  return null
}

const buildBookmark = (state, bookmarkDetail) => {
  bookmarkDetail = makeImmutable(bookmarkDetail)
  let location
  if (bookmarkDetail.has('location')) {
    location = UrlUtil.getLocationIfPDF(bookmarkDetail.get('location'))
    bookmarkDetail = bookmarkDetail.set('location', location)
  }

  const key = getKey(bookmarkDetail)
  const historyKey = key.slice(0, -2)
  let dataItem = historyState.getSite(state, historyKey)

  if (dataItem.isEmpty()) {
    // check if we have data in tabs
    const tab = tabState.getActiveTab(state) || Immutable.Map()
    const activeLocation = tab.get('url') || tab.getIn(['frame', 'location'])

    if (!tab.isEmpty() && bookmarkDetail.get('location') === activeLocation) {
      dataItem = makeImmutable({
        partitionNumber: tab.getIn(['frame', 'partitionNumber'], 0),
        favicon: tab.getIn(['frame', 'icon']),
        themeColor: tab.getIn(['frame', 'themeColor'])
      })
    } else {
      // check if bookmark is in top sites
      const topSites = Immutable.fromJS(newTabData.topSites.concat(newTabData.pinnedTopSites))
      const topSite = topSites.find(site => site.get('location') === bookmarkDetail.get('location')) || Immutable.Map()

      if (!topSite.isEmpty()) {
        dataItem = topSite
      }
    }
  }

  return makeImmutable({
    title: bookmarkDetail.get('title', ''),
    location: bookmarkDetail.get('location'),
    parentFolderId: Number(bookmarkDetail.get('parentFolderId', 0)),
    partitionNumber: Number(dataItem.get('partitionNumber', 0)),
    objectId: bookmarkDetail.get('objectId', null),
    favicon: dataItem.get('favicon'),
    themeColor: dataItem.get('themeColor'),
    type: siteTags.BOOKMARK,
    key: key,
    skipSync: bookmarkDetail.get('skipSync', null)
  })
}

const buildEditBookmark = (oldBookmark, bookmarkDetail) => {
  let newBookmark = oldBookmark.merge(bookmarkDetail)

  let location
  if (newBookmark.has('location')) {
    location = UrlUtil.getLocationIfPDF(newBookmark.get('location'))
    newBookmark = newBookmark.set('location', location)
  }

  const newKey = getKey(newBookmark)
  if (newKey === null) {
    return oldBookmark
  }

  return newBookmark.set('key', newKey)
}

module.exports = {
  bookmarkHangerHeading,
  isBookmarkNameValid,
  showOnlyFavicon,
  showFavicon,
  getDNDBookmarkData,
  getDetailFromFrame,
  isLocationBookmarked,
  toCreateProperties,
  isBookmark,
  updateTabBookmarked,
  updateActiveTabBookmarked,
  getKey,
  showOnlyText,
  showTextAndFavicon,
  buildBookmark,
  buildEditBookmark
}
