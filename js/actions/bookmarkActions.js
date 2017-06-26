/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const siteUtil = require('../state/siteUtil')
const appActions = require('./appActions')
const windowActions = require('./windowActions')
const eventUtil = require('../lib/eventUtil')
const appStoreRenderer = require('../stores/appStoreRenderer')
const {SWITCH_TO_NEW_TABS} = require('../constants/settings')
const getSetting = require('../settings').getSetting

const bookmarkActions = {
  openBookmarksInFolder: function (folderDetail) {
    const allBookmarkItems = siteUtil.getBookmarks(appStoreRenderer.state.get('sites'))
    // We have a middle clicked folder
    const bookmarks = allBookmarkItems
      .filter((bookmark) => (bookmark.get('parentFolderId') || 0) === (folderDetail.get('folderId') || 0) && siteUtil.isBookmark(bookmark))

    // Only load the first 25 tabs as loaded
    bookmarks
      .forEach((bookmark, i) => {
        if (i <= 25) {
          appActions.createTabRequested(
            Object.assign(siteUtil.toCreateProperties(bookmark), {
              active: false
            }), getSetting(SWITCH_TO_NEW_TABS))
        } else {
          appActions.createTabRequested({
            location: bookmark.get('location'),
            partitionNumber: bookmark.get('partitionNumber'),
            discarded: true
          }, false)
        }
      })
  },

  /**
   * Performs an action based on the passed in event to the bookmark item
   * @return true if an action was performed
   */
  clickBookmarkItem: function (bookmarkKey, tabId, e) {
    const bookmarkItem = appStoreRenderer.state.getIn(['sites', bookmarkKey], Immutable.Map())
    const isFolder = siteUtil.isFolder(bookmarkItem)
    if (!isFolder) {
      if (eventUtil.isForSecondaryAction(e)) {
        appActions.createTabRequested({
          url: bookmarkItem.get('location'),
          partitionNumber: (bookmarkItem && bookmarkItem.get && bookmarkItem.get('partitionNumber')) || undefined,
          active: !!e.shiftKey || getSetting(SWITCH_TO_NEW_TABS)
        })
      } else {
        appActions.loadURLRequested(tabId, bookmarkItem.get('location'))
      }
      windowActions.setContextMenuDetail()
      return true
    } else if (eventUtil.isForSecondaryAction(e)) {
      this.openBookmarksInFolder(bookmarkItem)
      windowActions.setContextMenuDetail()
      return true
    }
    return false
  }
}

module.exports = bookmarkActions
