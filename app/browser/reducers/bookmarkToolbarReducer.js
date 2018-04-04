/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// Constants
const appConstants = require('../../../js/constants/appConstants')

// State
const bookmarksState = require('../../common/state/bookmarksState')
const bookmarkFoldersState = require('../../common/state/bookmarkFoldersState')

// Actions
const appActions = require('../../../js/actions/appActions')

// Constants
const siteTags = require('../../../js/constants/siteTags')

// Util
const {makeImmutable} = require('../../common/state/immutableUtil')
const textCalc = require('../../browser/api/textCalc')

const bookmarkToolbarReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE:
      {
        // update session for 0.21.x version
        const bookmarks = bookmarksState.getBookmarks(state)
        let list = Immutable.List()
        if (bookmarks.first() && !bookmarks.first().has('width')) {
          list = bookmarks.toList()
        }

        const bookmarkFolders = bookmarkFoldersState.getFolders(state)
        if (bookmarkFolders.first() && !bookmarkFolders.first().has('width')) {
          list = list.concat(bookmarkFolders.toList())
        }

        if (!list.isEmpty()) {
          textCalc.calcTextList(list)
        }
      }
      break
    case appConstants.APP_ON_DROP_BOOKMARK: {
      let bookmark = action.get('bookmark')
      let tabDrop = false

      // When we have key null is only when we are getting data from TAB transfer type
      if (bookmark.get('key') == null) {
        tabDrop = true
      }

      const isDestinationParent = action.get('isFolder') && action.get('isDroppedOn')

      // tabDrop is the action of dropping a bookmark from the urlbar
      if (tabDrop) {
        const parentKey = isDestinationParent ? action.get('droppedOnKey') : null
        bookmark = bookmark.set('parentFolderId', parentKey)
        appActions.addBookmark(bookmark)
      } else {
        // if not a tabdrop, then user is just moving bookmarks around
        // in this case, check whether dragged element is a folder or not
        if (bookmark.get('type') === siteTags.BOOKMARK_FOLDER) {
          appActions.moveBookmarkFolder(
            bookmark.get('key'),
            action.get('droppedOnKey'),
            action.get('isRightSide'),
            isDestinationParent
          )
        } else {
          appActions.moveBookmark(
            bookmark.get('key'),
            action.get('droppedOnKey'),
            action.get('isRightSide'),
            isDestinationParent
          )
        }
      }
      break
    }
  }
  return state
}

module.exports = bookmarkToolbarReducer
