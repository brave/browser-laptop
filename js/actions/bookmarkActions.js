/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appActions = require('./appActions')
const windowActions = require('./windowActions')
const eventUtil = require('../lib/eventUtil')
const appStoreRenderer = require('../stores/appStoreRenderer')
const bookmarksUtil = require('../../app/common/lib/bookmarkUtil')
const bookmarksState = require('../../app/common/state/bookmarksState')
const bookmarkFoldersSate = require('../../app/common/state/bookmarkFoldersState')
const {SWITCH_TO_NEW_TABS} = require('../constants/settings')
const {getSetting} = require('../settings')

const bookmarkActions = {
  openBookmarksInFolder: function (folderDetail) {
    const bookmarks = bookmarksState.getBookmarksByParentId(appStoreRenderer.state, folderDetail.get('folderId'))

    // Only load the first 25 tabs as loaded
    bookmarks
      .forEach((bookmark, i) => {
        if (i <= 25) {
          appActions.createTabRequested(
            Object.assign(bookmarksUtil.toCreateProperties(bookmark), {
              isObsoleteAction: true,
              active: false
            }), getSetting(SWITCH_TO_NEW_TABS))
        } else {
          appActions.createTabRequested({
            url: bookmark.get('location'),
            partitionNumber: bookmark.get('partitionNumber'),
            isObsoleteAction: true,
            discarded: true
          }, false)
        }
      })
  },

  /**
   * Performs an action based on the passed in event to the bookmark item
   * @return true if an action was performed
   */
  clickBookmarkItem: function (key, tabId, isFolder, e) {
    const isSecondary = eventUtil.isForSecondaryAction(e)

    if (!isFolder) {
      const bookmarkItem = bookmarksState.getBookmark(appStoreRenderer.state, key)
      if (isSecondary) {
        appActions.createTabRequested({
          url: bookmarkItem.get('location'),
          partitionNumber: bookmarkItem.get('partitionNumber') || undefined,
          isObsoleteAction: true,
          active: !!e.shiftKey || getSetting(SWITCH_TO_NEW_TABS)
        })
      } else {
        appActions.loadURLRequested(tabId, bookmarkItem.get('location'), undefined, true)
      }

      windowActions.setContextMenuDetail()
      return true
    } else if (isSecondary) {
      const folderItem = bookmarkFoldersSate.getFolder(appStoreRenderer.state, key)
      this.openBookmarksInFolder(folderItem)
      windowActions.setContextMenuDetail()
      return true
    }

    return false
  }
}

module.exports = bookmarkActions
