/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// Utils
const bookmarkUtil = require('../lib/bookmarkUtil')
const bookmarkFoldersUtil = require('../lib/bookmarkFoldersUtil')

// Styles
const globalStyles = require('../../renderer/components/styles/global')
const {iconSize} = require('../../../js/constants/config')
const maxWidth = parseInt(globalStyles.spacing.bookmarksItemMaxWidth, 10)
const padding = parseInt(globalStyles.spacing.bookmarksItemPadding, 10) * 2
const itemMargin = parseInt(globalStyles.spacing.bookmarksItemMargin, 10)
const toolbarPadding = parseInt(globalStyles.spacing.bookmarksToolbarPadding)
const overflowButtonWidth = parseInt(globalStyles.spacing.bookmarksToolbarOverflowButtonWidth, 10)
const chevronMargin = parseInt(globalStyles.spacing.bookmarksItemChevronMargin)
const chevronFontSize = parseInt(globalStyles.spacing.bookmarksItemChevronFontSize)
const chevronWidth = chevronMargin + chevronFontSize

const getBookmarkKeys = (width, bookmarks) => {
  if (bookmarks == null) {
    return {
      toolbar: Immutable.List(),
      other: Immutable.List()
    }
  }

  let widthAccountedFor = 0

  const onlyText = bookmarkUtil.showOnlyText()
  const textAndFavicon = bookmarkUtil.showTextAndFavicon()
  const onlyFavicon = bookmarkUtil.showOnlyFavicon()

  // No margin for show only fav icons
  const margin = onlyFavicon ? 0 : (itemMargin * 2)
  const maximumBookmarksToolbarWidth = width - overflowButtonWidth

  widthAccountedFor += toolbarPadding

  // Loop through until we fill up the entire bookmark toolbar width
  let i = 0
  for (let item of bookmarks) {
    let iconWidth
    const isFolder = bookmarkFoldersUtil.isFolder(item)

    if (onlyText) {
      iconWidth = 0
    } else if (textAndFavicon || isFolder) {
      iconWidth = iconSize + itemMargin
    } else if (onlyFavicon) {
      iconWidth = iconSize
    }

    let extraWidth = 0

    if (onlyText) {
      extraWidth = padding + item.get('width')
    } else if (textAndFavicon) {
      extraWidth = padding + iconWidth + item.get('width')
    } else if (onlyFavicon) {
      extraWidth = padding + iconWidth

      if (isFolder) {
        extraWidth += item.get('width')
      }
    }

    if (isFolder) {
      extraWidth += chevronWidth
    }

    extraWidth = Math.min(extraWidth, maxWidth)
    widthAccountedFor += extraWidth + margin

    if (widthAccountedFor >= maximumBookmarksToolbarWidth) {
      break
    }

    i++
  }

  return {
    toolbar: bookmarks.take(i).map((item) => item.get('key')).toList(),
    other: bookmarks.skip(i).take(100).map((item) => item.get('key')).toList()
  }
}

module.exports = {
  getBookmarkKeys
}
