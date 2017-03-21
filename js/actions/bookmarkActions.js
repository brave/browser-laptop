/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const siteUtil = require('../state/siteUtil')
const windowActions = require('./windowActions')
const eventUtil = require('../lib/eventUtil')
const {SWITCH_TO_NEW_TABS} = require('../constants/settings')
const getSetting = require('../settings').getSetting

const bookmarkActions = {
  openBookmarksInFolder: function (allBookmarkItems, folderDetail) {
    // We have a middle clicked folder
    const bookmarks = allBookmarkItems
      .filter((bookmark) => (bookmark.get('parentFolderId') || 0) === (folderDetail.get('folderId') || 0) && siteUtil.isBookmark(bookmark))

    // Only load the first 25 tabs as loaded
    bookmarks
      .forEach((bookmark, i) =>
        windowActions.newFrame(Object.assign(siteUtil.toFrameOpts(bookmark), {unloaded: i > 25}), getSetting(SWITCH_TO_NEW_TABS)))
  },

  /**
   * Performs an action based on the passed in event to the bookmark item
   * @return true if an action was performed
   */
  clickBookmarkItem: function (allBookmarkItems, bookmarkItem, activeFrame, e) {
    const isFolder = siteUtil.isFolder(bookmarkItem)
    if (!isFolder) {
      if (eventUtil.isForSecondaryAction(e)) {
        windowActions.newFrame({
          location: bookmarkItem.get('location'),
          partitionNumber: (bookmarkItem && bookmarkItem.get && bookmarkItem.get('partitionNumber')) || undefined
        }, !!e.shiftKey || getSetting(SWITCH_TO_NEW_TABS))
      } else {
        windowActions.loadUrl(activeFrame, bookmarkItem.get('location'))
      }
      windowActions.setContextMenuDetail()
      return true
    } else if (eventUtil.isForSecondaryAction(e)) {
      this.openBookmarksInFolder(allBookmarkItems, bookmarkItem)
      windowActions.setContextMenuDetail()
      return true
    }
    return false
  }
}

module.exports = bookmarkActions
