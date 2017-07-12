/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// State
const bookmarksState = require('../state/bookmarksState')
const tabState = require('../state/tabState')

// Constants
const dragTypes = require('../../../js/constants/dragTypes')
const {bookmarksToolbarMode} = require('../constants/settingsEnums')
const settings = require('../../../js/constants/settings')
const siteTags = require('../../../js/constants/siteTags')

// Utils
const bookmarkLocationCache = require('../cache/bookmarkLocationCache')
const {calculateTextWidth} = require('../../../js/lib/textCalculator')
const {iconSize} = require('../../../js/constants/config')
const {getSetting} = require('../../../js/settings')

// Styles
const globalStyles = require('../../renderer/components/styles/global')

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

let oldBookmarks
let lastValue
let lastWidth
const getToolbarBookmarks = (state) => {
  const bookmarks = bookmarksState.getBookmarksWithFolders(state)
  const windowWidth = window.innerWidth
  if (bookmarks === oldBookmarks && lastWidth === windowWidth && lastValue) {
    return lastValue
  }
  oldBookmarks = bookmarks
  lastWidth = windowWidth

  let widthAccountedFor = 0

  const onlyText = showOnlyText()
  const textAndFavicon = showTextAndFavicon()
  const onlyFavicon = showOnlyFavicon()

  const maxWidth = parseInt(globalStyles.spacing.bookmarksItemMaxWidth, 10)
  const padding = parseInt(globalStyles.spacing.bookmarksItemPadding, 10) * 2
  const bookmarkItemMargin = parseInt(globalStyles.spacing.bookmarksItemMargin, 10) * 2
  const fontSize = parseInt(globalStyles.spacing.bookmarksItemFontSize)
  const fontFamily = globalStyles.defaultFontFamily
  const chevronMargin = parseInt(globalStyles.spacing.bookmarksItemChevronMargin)
  const chevronFontSize = parseInt(globalStyles.spacing.bookmarksItemChevronFontSize)
  const chevronWidth = chevronMargin + chevronFontSize

  // No margin for show only favicons
  const margin = onlyFavicon ? 0 : bookmarkItemMargin

  // Toolbar padding is only on the left
  const toolbarPadding = parseInt(globalStyles.spacing.bookmarksToolbarPadding)

  const overflowButtonWidth = parseInt(globalStyles.spacing.bookmarksToolbarOverflowButtonWidth, 10)
  const maximumBookmarksToolbarWidth = windowWidth - overflowButtonWidth

  widthAccountedFor += toolbarPadding

  // Loop through until we fill up the entire bookmark toolbar width
  let i = 0
  for (let bookmark of bookmarks) {
    let iconWidth

    if (onlyText) {
      iconWidth = 0
    } else if (textAndFavicon || bookmark.get('folderId')) {
      iconWidth = iconSize + parseInt(globalStyles.spacing.bookmarksItemMargin, 10)
    } else if (onlyFavicon) {
      iconWidth = iconSize
    }

    const currentChevronWidth = bookmark.get('folderId') ? chevronWidth : 0
    const text = bookmark.get('title') || bookmark.get('location')
    let extraWidth

    if (onlyText) {
      extraWidth = padding + calculateTextWidth(text, `${fontSize} ${fontFamily}`)

      if (bookmark.get('folderId')) {
        extraWidth += currentChevronWidth
      }
    } else if (textAndFavicon) {
      extraWidth = padding + iconWidth + calculateTextWidth(text, `${fontSize} ${fontFamily}`) + currentChevronWidth
    } else if (onlyFavicon) {
      extraWidth = padding + iconWidth + currentChevronWidth

      if (bookmark.get('folderId')) {
        extraWidth += calculateTextWidth(text, `${fontSize} ${fontFamily}`)
      }
    }

    extraWidth = Math.min(extraWidth, maxWidth)
    widthAccountedFor += extraWidth + margin

    if (widthAccountedFor >= maximumBookmarksToolbarWidth) {
      widthAccountedFor -= extraWidth + margin
      i--

      break
    }

    i++
  }

  lastValue = {
    visibleBookmarks: bookmarks.take(i).map((item) => item.get('key')).toList(),
    // Show at most 100 items in the overflow menu
    hiddenBookmarks: bookmarks.skip(i).take(100).map((item) => item.get('key')).toList()
  }

  return lastValue
}

const getDetailFromFrame = (frame) => {
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

  if (siteKeys.isEmpty()) {
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
  return {
    url: bookmark.get('location'),
    partitionNumber: bookmark.get('partitionNumber')
  }
}

/**
 * Filters bookmarks relative to a parent folder
 * @param state - The application state
 * @param folderKey The folder key to filter to
 */
const getBookmarksByParentId = (state, folderKey) => {
  const bookmarks = bookmarksState.getBookmarks(state)
  if (!folderKey) {
    return bookmarks
  }

  return bookmarks.filter((bookmark) => bookmark.get('parentFolderId') === folderKey)
}

const isBookmark = (bookmark) => {
  return bookmark.get('type') === siteTags.BOOKMARK
}

const updateTabBookmarked = (state, tabValue) => {
  if (!tabValue || !tabValue.get('tabId')) {
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
  return updateTabBookmarked(state, tab)
}

module.exports = {
  bookmarkHangerHeading,
  isBookmarkNameValid,
  showOnlyFavicon,
  showFavicon,
  getDNDBookmarkData,
  getToolbarBookmarks,
  getDetailFromFrame,
  isLocationBookmarked,
  toCreateProperties,
  getBookmarksByParentId,
  isBookmark,
  updateTabBookmarked,
  updateActiveTabBookmarked
}
