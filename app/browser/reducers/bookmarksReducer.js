/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// State
const bookmarksState = require('../../common/state/bookmarksState')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const {STATE_SITES} = require('../../../js/constants/stateConstants')

// Utils
const {makeImmutable} = require('../../common/state/immutableUtil')
const syncUtil = require('../../../js/state/syncUtil')
const bookmarkUtil = require('../../common/lib/bookmarkUtil')
const bookmarkLocationCache = require('../../common/cache/bookmarkLocationCache')

const bookmarksReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE:
      state = bookmarkLocationCache.generateCache(state)
      break
    case appConstants.APP_ADD_BOOKMARK:
      {
        const closestKey = action.get('closestKey')
        const bookmark = action.get('siteDetail')

        if (bookmark == null) {
          break
        }

        if (Immutable.List.isList(bookmark)) {
          action.get('siteDetail', Immutable.List()).forEach((bookmark) => {
            state = bookmarksState.addBookmark(state, bookmark, closestKey)
            state = syncUtil.updateObjectCache(state, bookmark, STATE_SITES.BOOKMARKS)
          })
        } else {
          state = bookmarksState.addBookmark(state, bookmark, closestKey)
          state = syncUtil.updateObjectCache(state, bookmark, STATE_SITES.BOOKMARKS)
        }

        state = bookmarkUtil.updateActiveTabBookmarked(state)
        break
      }
    case appConstants.APP_EDIT_BOOKMARK:
      {
        const bookmark = action.get('siteDetail', Immutable.Map())
        const key = action.get('editKey')

        if (key == null || bookmark.isEmpty()) {
          break
        }

        state = bookmarksState.editBookmark(state, key, bookmark)
        state = syncUtil.updateObjectCache(state, bookmark, STATE_SITES.BOOKMARKS)

        state = bookmarkUtil.updateActiveTabBookmarked(state)
        break
      }
    case appConstants.APP_MOVE_BOOKMARK:
      {
        const key = action.get('bookmarkKey')

        if (key == null) {
          break
        }

        state = bookmarksState.moveBookmark(
          state,
          key,
          action.get('destinationKey'),
          action.get('append'),
          action.get('moveIntoParent')
        )

        const destinationDetail = bookmarksState.getBookmark(state, action.get('destinationKey'))
        state = syncUtil.updateObjectCache(state, destinationDetail, STATE_SITES.BOOKMARKS)
        break
      }
    case appConstants.APP_REMOVE_BOOKMARK:
      {
        const bookmarkKey = action.get('bookmarkKey')
        if (bookmarkKey == null) {
          break
        }

        if (Immutable.List.isList(bookmarkKey)) {
          action.get('bookmarkKey', Immutable.List()).forEach((key) => {
            state = bookmarksState.removeBookmark(state, key)
          })
        } else {
          state = bookmarksState.removeBookmark(state, bookmarkKey)
        }
        state = bookmarkUtil.updateActiveTabBookmarked(state)
        break
      }
  }

  return state
}

module.exports = bookmarksReducer
