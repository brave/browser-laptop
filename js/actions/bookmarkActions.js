/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const siteUtil = require('../state/siteUtil')
const siteTags = require('../constants/siteTags')
const windowActions = require('./windowActions')

const bookmarkActions = {
  /**
   * Performs an action based on the passed in event to the bookmark item
   * @return true if an action was performed
   */
  clickBookmarkItem: function (allBookmarkItems, bookmarkItem, activeFrame, e) {
    const isFolder = siteUtil.isFolder(bookmarkItem)
    if (!isFolder) {
      const isDarwin = process.platform === 'darwin'
      if (e.ctrlKey && !isDarwin ||
          e.metaKey && isDarwin ||
          e.button === 1) {
        windowActions.newFrame({
          location: bookmarkItem.get('location'),
          partitionNumber: bookmarkItem && bookmarkItem.get && bookmarkItem.get('partitionNumber') || undefined
        }, false)
      } else {
        windowActions.loadUrl(activeFrame, bookmarkItem.get('location'))
      }
      windowActions.setContextMenuDetail()
      return true
    } else if (e.button === 1) {
      // We have a middle clicked folder
      allBookmarkItems
        .filter(bookmark => bookmark.get('parentFolderId') === bookmarkItem.get('folderId') && bookmark.get('tags').includes(siteTags.BOOKMARK))
        .forEach(bookmark =>
          windowActions.newFrame({
            location: bookmark.get('location'),
            partitionNumber: bookmark.get('partitionNumber')
          }, false))
      windowActions.setContextMenuDetail()
      return true
    }
    return false
  }
}

module.exports = bookmarkActions
