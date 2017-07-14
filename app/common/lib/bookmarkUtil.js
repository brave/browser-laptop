/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// Constants
const dragTypes = require('../../../js/constants/dragTypes')
const {bookmarksToolbarMode} = require('../constants/settingsEnums')
const settings = require('../../../js/constants/settings')

// Utils
const siteUtil = require('../../../js/state/siteUtil')
const {calculateTextWidth} = require('../../../js/lib/textCalculator')
const {iconSize} = require('../../../js/constants/config')
const {getSetting} = require('../../../js/settings')

// Styles
const globalStyles = require('../../renderer/components/styles/global')

function bookmarkHangerHeading (editMode, isFolder, isAdded) {
  if (isFolder) {
    return editMode
      ? 'bookmarkFolderEditing'
      : 'bookmarkFolderAdding'
  }

  if (isAdded) {
    return 'bookmarkAdded'
  }

  return editMode
    ? 'bookmarkEdit'
    : 'bookmarkCreateNew'
}

const displayBookmarkName = (detail) => {
  const customTitle = detail.get('customTitle')
  if (customTitle !== undefined && customTitle !== '') {
    return customTitle || ''
  }
  return detail.get('title') || ''
}

const isBookmarkNameValid = (title, location, isFolder, customTitle) => {
  const newTitle = title || customTitle
  return isFolder
    ? (newTitle != null && newTitle !== 0) && newTitle.trim().length > 0
    : location != null && location.trim().length > 0
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

let oldSites
let lastValue
let lastWidth
const getToolbarBookmarks = (state) => {
  const sites = state.get('sites', Immutable.List())
  const windowWidth = window.innerWidth

  if (sites === oldSites && lastWidth === windowWidth && lastValue) {
    return lastValue
  }

  oldSites = sites
  lastWidth = windowWidth

  const noParentItems = siteUtil.getBookmarks(sites)
    .filter((bookmark) => !bookmark.get('parentFolderId'))
    .sort(siteUtil.siteSort)

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

  const overflowButtonWidth = 25
  const maximumBookmarksToolbarWidth = windowWidth - overflowButtonWidth

  widthAccountedFor += toolbarPadding

  // Loop through until we fill up the entire bookmark toolbar width
  let i = 0
  for (let bookmark of noParentItems) {
    const current = bookmark[1]

    let iconWidth

    if (onlyText) {
      iconWidth = 0
    } else if (textAndFavicon || current.get('folderId')) {
      iconWidth = iconSize + parseInt(globalStyles.spacing.bookmarksItemMargin, 10)
    } else if (onlyFavicon) {
      iconWidth = iconSize
    }

    const currentChevronWidth = current.get('folderId') ? chevronWidth : 0

    let extraWidth

    if (onlyText) {
      const text = current.get('customTitle') || current.get('title') || current.get('location')

      extraWidth = padding + calculateTextWidth(text, `${fontSize} ${fontFamily}`)

      if (current.get('folderId')) {
        extraWidth += currentChevronWidth
      }
    } else if (textAndFavicon) {
      const text = current.get('customTitle') || current.get('title') || current.get('location')

      extraWidth = padding + iconWidth + calculateTextWidth(text, `${fontSize} ${fontFamily}`) + currentChevronWidth
    } else if (onlyFavicon) {
      extraWidth = padding + iconWidth + currentChevronWidth

      if (current.get('folderId')) {
        const text = current.get('customTitle') || current.get('title') || current.get('location')
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
    visibleBookmarks: noParentItems.take(i).map((item, index) => index).toList(),
    // Show at most 100 items in the overflow menu
    hiddenBookmarks: noParentItems.skip(i).take(100).map((item, index) => index).toList()
  }
  return lastValue
}

module.exports = {
  bookmarkHangerHeading,
  displayBookmarkName,
  isBookmarkNameValid,
  showOnlyFavicon,
  showFavicon,
  getDNDBookmarkData,
  getToolbarBookmarks
}
