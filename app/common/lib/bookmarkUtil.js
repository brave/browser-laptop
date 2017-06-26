/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// Constants
const dragTypes = require('../../../js/constants/dragTypes')
const {bookmarksToolbarMode} = require('../constants/settingsEnums')
const settings = require('../../../js/constants/settings')

// Utils
const domUtil = require('../../renderer/lib/domUtil')
const siteUtil = require('../../../js/state/siteUtil')
const {calculateTextWidth} = require('../../../js/lib/textCalculator')
const {iconSize} = require('../../../js/constants/config')
const {getSetting} = require('../../../js/settings')

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

const getToolbarBookmarks = (state) => {
  const sites = state.get('sites', Immutable.List())

  const noParentItems = siteUtil.getBookmarks(sites)
    .filter((bookmark) => !bookmark.get('parentFolderId'))
    .sort(siteUtil.siteSort)
  let widthAccountedFor = 0
  const overflowButtonWidth = 25
  const onlyFavicon = showOnlyFavicon()
  const favicon = showFavicon()

  // Dynamically calculate how many bookmark items should appear on the toolbar
  // before it is actually rendered.
  const maxWidth = domUtil.getStyleConstants('bookmark-item-max-width')
  const padding = domUtil.getStyleConstants('bookmark-item-padding') * 2
  // Toolbar padding is only on the left
  const toolbarPadding = domUtil.getStyleConstants('bookmarks-toolbar-padding')
  const bookmarkItemMargin = domUtil.getStyleConstants('bookmark-item-margin') * 2
  // No margin for show only favicons
  const chevronMargin = domUtil.getStyleConstants('bookmark-item-chevron-margin')
  const fontSize = domUtil.getStyleConstants('bookmark-item-font-size')
  const fontFamily = domUtil.getStyleConstants('default-font-family')
  const chevronWidth = chevronMargin + fontSize
  const margin = favicon && onlyFavicon ? 0 : bookmarkItemMargin
  const windowWidth = window.innerWidth
  widthAccountedFor += toolbarPadding

  // Loop through until we fill up the entire bookmark toolbar width
  let i = 0
  for (let bookmark of noParentItems) {
    const current = bookmark[1]
    let iconWidth = favicon ? iconSize : 0
    // font-awesome file icons are 3px smaller
    if (favicon && !current.get('folderId') && !current.get('favicon')) {
      iconWidth -= 3
    }
    const currentChevronWidth = favicon && current.get('folderId') ? chevronWidth : 0
    if (favicon && onlyFavicon) {
      widthAccountedFor += padding + iconWidth + currentChevronWidth
    } else {
      const text = current.get('customTitle') || current.get('title') || current.get('location')
      widthAccountedFor += Math.min(calculateTextWidth(text, `${fontSize} ${fontFamily}`) + padding + iconWidth + currentChevronWidth, maxWidth)
    }
    widthAccountedFor += margin
    if (widthAccountedFor >= windowWidth - overflowButtonWidth) {
      break
    }
    i++
  }

  return {
    visibleBookmarks: noParentItems.take(i).map((item, index) => index).toList(),
    // Show at most 100 items in the overflow menu
    hiddenBookmarks: noParentItems.skip(i).take(100).map((item, index) => index).toList()
  }
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
