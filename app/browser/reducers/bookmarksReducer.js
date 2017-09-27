/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// State
const bookmarksState = require('../../common/state/bookmarksState')
const bookmarkToolbarState = require('../../common/state/bookmarkToolbarState')
const clearDataState = require('../../common/state/clearDataState')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const siteTags = require('../../../js/constants/siteTags')
const {STATE_SITES} = require('../../../js/constants/stateConstants')

// Utils
const {makeImmutable} = require('../../common/state/immutableUtil')
const syncUtil = require('../../../js/state/syncUtil')
const bookmarkUtil = require('../../common/lib/bookmarkUtil')
const bookmarkLocationCache = require('../../common/cache/bookmarkLocationCache')
const textCalc = require('../../browser/api/textCalc')

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
          let bookmarkList = Immutable.List()
          action.get('siteDetail', Immutable.List()).forEach((bookmark) => {
            const bookmarkDetail = bookmarkUtil.buildBookmark(state, bookmark)
            state = bookmarksState.addBookmark(state, bookmarkDetail, closestKey)
            state = syncUtil.updateObjectCache(state, bookmarkDetail, STATE_SITES.BOOKMARKS)
            bookmarkList = bookmarkList.push(bookmarkDetail)
          })
          textCalc.calcTextList(bookmarkList)
        } else {
          const bookmarkDetail = bookmarkUtil.buildBookmark(state, bookmark)
          state = bookmarksState.addBookmark(state, bookmarkDetail, closestKey)
          state = syncUtil.updateObjectCache(state, bookmarkDetail, STATE_SITES.BOOKMARKS)
          textCalc.calcText(bookmarkDetail, siteTags.BOOKMARK)
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

        const oldBookmark = bookmarksState.getBookmark(state, key)
        if (oldBookmark.isEmpty()) {
          break
        }

        const bookmarkDetail = bookmarkUtil.buildEditBookmark(oldBookmark, bookmark)
        state = bookmarksState.editBookmark(state, oldBookmark, bookmarkDetail)
        state = syncUtil.updateObjectCache(state, bookmark, STATE_SITES.BOOKMARKS)
        textCalc.calcText(bookmarkDetail, siteTags.BOOKMARK)

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

        if (destinationDetail.get('parentFolderId') === 0 || action.get('destinationKey') === 0) {
          state = bookmarkToolbarState.setToolbars(state)
        }
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
          state = bookmarkToolbarState.setToolbars(state)
        } else {
          const bookmark = bookmarksState.getBookmark(state, bookmarkKey)
          state = bookmarksState.removeBookmark(state, bookmarkKey)
          if (bookmark.get('parentFolderId') === 0) {
            state = bookmarkToolbarState.setToolbars(state)
          }
        }
        state = bookmarkUtil.updateActiveTabBookmarked(state)
        break
      }
    case appConstants.APP_ON_BOOKMARK_WIDTH_CHANGED:
      {
        if (action.get('bookmarkList', Immutable.List()).isEmpty()) {
          break
        }

        let updateToolbar = false
        action.get('bookmarkList').forEach(item => {
          state = bookmarksState.setWidth(state, item.get('key'), item.get('width'))
          if (item.get('parentFolderId') === 0) {
            updateToolbar = true
          }
        })

        if (updateToolbar) {
          state = bookmarkToolbarState.setToolbars(state)
        }
        break
      }
    case appConstants.APP_ON_CLEAR_BROWSING_DATA:
      {
        const clearData = clearDataState.getClearDefaults(state)
        if (clearData.get('browserHistory')) {
          state = bookmarkLocationCache.clearCache(state)
        }
        break
      }
  }

  return state
}

module.exports = bookmarksReducer
