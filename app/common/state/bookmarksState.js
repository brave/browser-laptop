/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const Immutable = require('immutable')

// Constants
const settings = require('../../../js/constants/settings')
const siteTags = require('../../../js/constants/siteTags')
const {STATE_SITES} = require('../../../js/constants/stateConstants')

// State
const bookmarkOrderCache = require('../cache/bookmarkOrderCache')
const bookmarkFoldersState = require('./bookmarkFoldersState')

// Actions
const syncActions = require('../../../js/actions/syncActions')

// Utils
const UrlUtil = require('../../../js/lib/urlutil')
const bookmarkLocationCache = require('../cache/bookmarkLocationCache')
const {getSetting} = require('../../../js/settings')
const {makeImmutable, isMap} = require('./immutableUtil')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isMap(state.get(STATE_SITES.BOOKMARKS)), 'state must contain an Immutable.Map of bookmarks')
  return state
}

const bookmarksState = {
  getBookmarks: (state) => {
    state = validateState(state)
    return state.get(STATE_SITES.BOOKMARKS) || Immutable.Map()
  },

  getBookmark: (state, key) => {
    state = validateState(state)

    if (key == null) {
      return Immutable.Map()
    }

    return state.getIn([STATE_SITES.BOOKMARKS, key], Immutable.Map())
  },

  /**
   * Use this function if you only have a key and don't know if key is for folder or regular bookmark
   * @param state
   * @param key
   */
  findBookmark: (state, key) => {
    state = validateState(state)

    if (key == null) {
      return Immutable.Map()
    }

    let bookmark = bookmarksState.getBookmark(state, key)
    if (bookmark.isEmpty()) {
      bookmark = bookmarkFoldersState.getFolder(state, key)
    }

    return bookmark
  },

  getBookmarksWithFolders: (state, parentFolderId = 0) => {
    state = validateState(state)

    const cache = bookmarkOrderCache.getBookmarksWithFolders(state, parentFolderId)
    let bookmarks = Immutable.List()

    for (let item of cache) {
      if (item.get('type') === siteTags.BOOKMARK) {
        bookmarks = bookmarks.push(bookmarksState.getBookmark(state, item.get('key')))
      } else {
        bookmarks = bookmarks.push(bookmarkFoldersState.getFolder(state, item.get('key')))
      }
    }

    return bookmarks
  },

  addBookmark: (state, bookmarkDetail, destinationKey, isLeftSide) => {
    state = validateState(state)

    if (bookmarkDetail == null) {
      return state
    }

    bookmarkDetail = makeImmutable(bookmarkDetail)

    const key = bookmarkDetail.get('key')
    if (key == null) {
      return state
    }

    if (!state.hasIn([STATE_SITES.BOOKMARKS, key])) {
      state = bookmarkLocationCache.addCacheKey(state, bookmarkDetail.get('location'), key)
      state = bookmarkOrderCache.addBookmarkToCache(state, bookmarkDetail.get('parentFolderId'), key, destinationKey, isLeftSide)
    }

    state = state.setIn([STATE_SITES.BOOKMARKS, key], bookmarkDetail)
    return state
  },

  editBookmark: (state, oldBookmark, bookmarkDetail) => {
    state = validateState(state)

    if (oldBookmark == null || bookmarkDetail == null) {
      return state
    }

    bookmarkDetail = makeImmutable(bookmarkDetail)
    oldBookmark = makeImmutable(oldBookmark)

    const newKey = bookmarkDetail.get('key')
    const editKey = oldBookmark.get('key')

    if (editKey !== newKey) {
      state = state.deleteIn([STATE_SITES.BOOKMARKS, editKey])
      state = bookmarkOrderCache.removeCacheKey(state, oldBookmark.get('parentFolderId'), editKey)
      state = bookmarkOrderCache.addBookmarkToCache(state, bookmarkDetail.get('parentFolderId'), newKey)
      bookmarkDetail = bookmarkDetail.set('key', newKey)
    }

    state = state.setIn([STATE_SITES.BOOKMARKS, newKey], bookmarkDetail)
    state = bookmarkLocationCache.removeCacheKey(state, oldBookmark.get('location'), editKey)
    state = bookmarkLocationCache.addCacheKey(state, bookmarkDetail.get('location'), newKey)
    return state
  },

  removeBookmark: (state, bookmarkKey) => {
    state = validateState(state)

    if (bookmarkKey == null) {
      return state
    }

    const bookmark = bookmarksState.getBookmark(state, bookmarkKey)

    if (bookmark.isEmpty()) {
      return state
    }

    if (getSetting(settings.SYNC_ENABLED) === true) {
      syncActions.removeSites([bookmark.toJS()])
    }

    state = bookmarkLocationCache.removeCacheKey(state, bookmark.get('location'), bookmarkKey)
    state = bookmarkOrderCache.removeCacheKey(state, bookmark.get('parentFolderId'), bookmarkKey)

    return state.deleteIn([STATE_SITES.BOOKMARKS, bookmarkKey])
  },

  /**
   * Removes bookmarks based on the parent ID
   * Cache is cleared in the function that is calling this one
   * @param state - App state
   * @param parentFolderId - parent id of the folder that we are deleting
   */
  removeBookmarksByParentId: (state, parentFolderId) => {
    state = validateState(state)

    if (parentFolderId == null) {
      return state
    }

    parentFolderId = Number(parentFolderId)

    const syncEnabled = getSetting(settings.SYNC_ENABLED) === true
    const removedBookmarks = []
    const bookmarks = bookmarksState.getBookmarks(state)
      .filter(bookmark => {
        if (bookmark.get('parentFolderId') !== parentFolderId) {
          return true
        }

        if (syncEnabled) {
          removedBookmarks.push(bookmark.toJS())
        }

        state = bookmarkLocationCache.removeCacheKey(state, bookmark.get('location'), bookmark.get('key'))
        state = bookmarkOrderCache.removeCacheKey(state, bookmark.get('parentFolderId'), bookmark.get('key'))
        return false
      })

    if (syncEnabled && removedBookmarks.length) {
      syncActions.removeSites(removedBookmarks)
    }

    return state.set(STATE_SITES.BOOKMARKS, bookmarks)
  },

  /**
   * Update the favicon URL for all entries in the state sites
   * which match a given location. Currently, there should only be
   * one match, but this will handle multiple.
   *
   * @param state The application state
   * @param location URL for the entry needing an update
   * @param favicon favicon URL
   */
  updateFavicon: (state, location, favicon) => {
    state = validateState(state)

    if (UrlUtil.isNotURL(location)) {
      return state
    }

    const siteKeys = bookmarkLocationCache.getCacheKey(state, location)
    if (siteKeys.isEmpty()) {
      return state
    }

    siteKeys.forEach((siteKey) => {
      if (state.getIn([STATE_SITES.BOOKMARKS, siteKey])) {
        state = state.setIn([STATE_SITES.BOOKMARKS, siteKey, 'favicon'], favicon)
      }
    })
    return state
  },

  moveBookmark: (state, bookmarkKey, destinationKey, append, moveIntoParent) => {
    state = validateState(state)

    const bookmarkUtil = require('../lib/bookmarkUtil')
    let bookmark = bookmarksState.getBookmark(state, bookmarkKey)
    if (bookmark.isEmpty()) {
      return state
    }

    let destinationItem = bookmarksState.findBookmark(state, destinationKey)
    const numKey = Number(destinationKey)
    if (destinationItem.isEmpty() && numKey !== -1 && numKey !== 0) {
      return state
    }

    // move bookmark into a new folder
    if (moveIntoParent || destinationItem.get('parentFolderId') !== bookmark.get('parentFolderId')) {
      let parentFolderId = destinationItem.get('type') === siteTags.BOOKMARK
        ? destinationItem.get('parentFolderId')
        : destinationItem.get('folderId')

      // always use parent ID when we are not moving into the folder
      if (!moveIntoParent) {
        parentFolderId = destinationItem.get('parentFolderId')
      }

      if (parentFolderId == null) {
        parentFolderId = destinationKey
      }

      state = bookmarkOrderCache.removeCacheKey(state, bookmark.get('parentFolderId'), bookmarkKey)
      state = bookmarkLocationCache.removeCacheKey(state, bookmark.get('location'), bookmarkKey)
      bookmark = bookmark.set('parentFolderId', Number(parentFolderId))
      const newKey = bookmarkUtil.getKey(bookmark)

      state = state.deleteIn([STATE_SITES.BOOKMARKS, bookmarkKey])
      state = bookmarkOrderCache.addBookmarkToCache(state, bookmark.get('parentFolderId'), newKey)
      state = bookmarkLocationCache.addCacheKey(state, bookmark.get('location'), newKey)

      bookmark = bookmark.set('key', newKey)
      return state.setIn([STATE_SITES.BOOKMARKS, newKey], bookmark)
    }

    // move bookmark to another place
    state = bookmarkOrderCache.removeCacheKey(state, bookmark.get('parentFolderId'), bookmarkKey)
    state = bookmarkOrderCache.addBookmarkToCache(
      state,
      bookmark.get('parentFolderId'),
      bookmarkKey,
      destinationKey,
      append
    )
    return state
  },

  /**
   * Get bookmarks relative to a parent folder
   * @param state - The application state
   * @param folderKey The folder key to filter to
   */
  getBookmarksByParentId: (state, folderKey) => {
    if (folderKey == null) {
      return Immutable.List()
    }

    const cache = bookmarkOrderCache.getBookmarksByParentId(state, folderKey)
    return cache.map((item) => bookmarksState.getBookmark(state, item.get('key')))
  }
}

module.exports = bookmarksState
