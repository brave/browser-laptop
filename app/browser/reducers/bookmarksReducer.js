/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// State
const bookmarksState = require('../../common/state/bookmarksState')

// Constants
const appConstants = require('../../../js/constants/appConstants')

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
        let bookmark = action.get('siteDetail')

        if (bookmark == null) {
          break
        }

        if (Immutable.List.isList(bookmark)) {
          action.get('siteDetail', Immutable.List()).forEach((bookmark) => {
            state = bookmarksState.addBookmark(state, bookmark, closestKey)

            if (syncUtil.syncEnabled()) {
              state = syncUtil.updateSiteCache(state, bookmark)
            }
          })
        } else {
          state = bookmarksState.addBookmark(state, bookmark, closestKey)

          if (syncUtil.syncEnabled()) {
            state = syncUtil.updateSiteCache(state, bookmark)
          }
        }

        state = bookmarkUtil.updateActiveTabBookmarked(state)
        break
      }
    case appConstants.APP_EDIT_BOOKMARK:
      {
        let bookmark = action.get('siteDetail')

        if (bookmark == null) {
          break
        }

        state = bookmarksState.editBookmark(state, bookmark, action.get('editKey'))

        if (syncUtil.syncEnabled()) {
          state = syncUtil.updateSiteCache(state, bookmark)
        }

        state = bookmarkUtil.updateActiveTabBookmarked(state)
        break
      }
    case appConstants.APP_MOVE_BOOKMARK:
      {
        state = bookmarksState.moveBookmark(
          state,
          action.get('bookmarkKey'),
          action.get('destinationKey'),
          action.get('append'),
          action.get('moveIntoParent')
        )

        if (syncUtil.syncEnabled()) {
          const destinationDetail = state.getIn(['sites', action.get('destinationKey')])
          state = syncUtil.updateSiteCache(state, destinationDetail)
        }
        break
      }
    case appConstants.APP_REMOVE_BOOKMARK:
      {
        if (Immutable.List.isList(action.get('bookmarkKey'))) {
          action.get('bookmarkKey', Immutable.List()).forEach((key) => {
            state = bookmarksState.removeBookmark(state, key)
          })
        } else {
          state = bookmarksState.removeBookmark(state, action.get('bookmarkKey'))
        }
        state = bookmarkUtil.updateActiveTabBookmarked(state)
        break
      }
  }

  return state
}

module.exports = bookmarksReducer
