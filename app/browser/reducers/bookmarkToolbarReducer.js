/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// Constants
const appConstants = require('../../../js/constants/appConstants')

// State
const bookmarksState = require('../../common/state/bookmarksState')
const bookmarkFoldersState = require('../../common/state/bookmarkFoldersState')

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
  }
  return state
}

module.exports = bookmarkToolbarReducer
