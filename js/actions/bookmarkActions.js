/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const siteUtil = require('../state/siteUtil')
const siteTags = require('../constants/siteTags')
const windowActions = require('./windowActions')
const eventUtil = require('../lib/eventUtil.js')

const bookmarkActions = {
  openBookmarksInFolder: function (allBookmarkItems, folderDetail) {
    // We have a middle clicked folder
    allBookmarkItems
      .filter((bookmark) => bookmark.get('parentFolderId') === folderDetail.get('folderId') && bookmark.get('tags').includes(siteTags.BOOKMARK))
      .forEach((bookmark) =>
        windowActions.newFrame(siteUtil.toFrameOpts(bookmark), false))
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
          partitionNumber: bookmarkItem && bookmarkItem.get && bookmarkItem.get('partitionNumber') || undefined
        }, !!e.shiftKey)
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
