/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const Immutable = require('immutable')

// Constants
const settings = require('../../../js/constants/settings')
const siteTags = require('../../../js/constants/siteTags')
const {STATE_SITES} = require('../../../js/constants/stateConstants')
const newTabData = require('../../../js/data/newTabData')

// State
const historyState = require('./historyState')
const bookmarkOrderCache = require('../cache/bookmarkOrderCache')
const bookmarkFoldersState = require('./bookmarkFoldersState')
const tabState = require('./tabState')

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
    return state.get(STATE_SITES.BOOKMARKS)
  },

  getBookmark: (state, key) => {
    state = validateState(state)
    return state.getIn([STATE_SITES.BOOKMARKS, key], Immutable.Map())
  },

  /**
   * Use this function if you only have a key and don't know if key is for folder or regular bookmark
   * @param state
   * @param key
   */
  findBookmark: (state, key) => {
    state = validateState(state)
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

  addBookmark: (state, bookmarkDetail, destinationKey) => {
    state = validateState(state)
    const bookmarkUtil = require('../lib/bookmarkUtil')

    bookmarkDetail = makeImmutable(bookmarkDetail)
    let location
    if (bookmarkDetail.has('location')) {
      location = UrlUtil.getLocationIfPDF(bookmarkDetail.get('location'))
      bookmarkDetail = bookmarkDetail.set('location', location)
    }

    const key = bookmarkUtil.getKey(bookmarkDetail)
    let dataItem = historyState.getSite(state, key)

    if (dataItem.isEmpty()) {
      // check if we have data in tabs
      const tab = tabState.getActiveTab(state) || Immutable.Map()
      const activeLocation = tab.get('url') || tab.getIn(['frame', 'location'])

      if (!tab.isEmpty() && bookmarkDetail.get('location') === activeLocation) {
        dataItem = makeImmutable({
          partitionNumber: tab.getIn(['frame', 'partitionNumber'], 0),
          favicon: tab.getIn(['frame', 'icon']),
          themeColor: tab.getIn(['frame', 'themeColor'])
        })
      } else {
        // check if bookmark is in top sites
        const topSites = Immutable.fromJS(newTabData.topSites.concat(newTabData.pinnedTopSites))
        const topSite = topSites.find(site => site.get('location') === bookmarkDetail.get('location')) || Immutable.Map()

        if (!topSite.isEmpty()) {
          dataItem = topSite
        }
      }
    }

    let bookmark = makeImmutable({
      title: bookmarkDetail.get('title', ''),
      location: bookmarkDetail.get('location'),
      parentFolderId: ~~bookmarkDetail.get('parentFolderId', 0),
      partitionNumber: ~~dataItem.get('partitionNumber', 0),
      objectId: bookmarkDetail.get('objectId', null),
      favicon: dataItem.get('favicon'),
      themeColor: dataItem.get('themeColor'),
      type: siteTags.BOOKMARK,
      key: key,
      skipSync: bookmarkDetail.get('skipSync', null)
    })

    if (key === null) {
      return state
    }

    if (!state.hasIn([STATE_SITES.BOOKMARKS, key])) {
      state = bookmarkLocationCache.addCacheKey(state, location, key)
      state = bookmarkOrderCache.addBookmarkToCache(state, bookmark.get('parentFolderId'), key, destinationKey)
    }

    state = state.setIn([STATE_SITES.BOOKMARKS, key], bookmark)
    return state
  },

  editBookmark: (state, editKey, bookmarkDetail) => {
    state = validateState(state)
    const bookmarkUtil = require('../lib/bookmarkUtil')

    const oldBookmark = bookmarksState.getBookmark(state, editKey)

    if (oldBookmark.isEmpty()) {
      return state
    }

    let newBookmark = oldBookmark.merge(bookmarkDetail)

    let location
    if (newBookmark.has('location')) {
      location = UrlUtil.getLocationIfPDF(newBookmark.get('location'))
      newBookmark = newBookmark.set('location', location)
    }
    const newKey = bookmarkUtil.getKey(newBookmark)
    if (newKey === null) {
      return state
    }

    if (editKey !== newKey) {
      state = state.deleteIn([STATE_SITES.BOOKMARKS, editKey])
      state = bookmarkOrderCache.removeCacheKey(state, oldBookmark.get('parentFolderId'), editKey)
      state = bookmarkOrderCache.addBookmarkToCache(state, newBookmark.get('parentFolderId'), newKey)
      newBookmark = newBookmark.set('key', newKey)
    }

    state = state.setIn([STATE_SITES.BOOKMARKS, newKey], newBookmark)
    state = bookmarkLocationCache.removeCacheKey(state, oldBookmark.get('location'), editKey)
    state = bookmarkLocationCache.addCacheKey(state, location, newKey)
    return state
  },

  removeBookmark: (state, bookmarkKey) => {
    state = validateState(state)

    const bookmark = bookmarksState.getBookmark(state, bookmarkKey)

    if (bookmark.isEmpty()) {
      return state
    }

    if (getSetting(settings.SYNC_ENABLED) === true) {
      syncActions.removeSite(bookmark)
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

    const syncEnabled = getSetting(settings.SYNC_ENABLED) === true
    const bookmarks = bookmarksState.getBookmarks(state)
      .filter(bookmark => {
        if (bookmark.get('parentFolderId') !== ~~parentFolderId) {
          return true
        }
        if (syncEnabled) {
          syncActions.removeSite(bookmark)
        }
        return false
      })

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
      state = state.setIn([STATE_SITES.BOOKMARKS, siteKey, 'favicon'], favicon)
    })
    return state
  },

  moveBookmark: (state, bookmarkKey, destinationKey, append, moveIntoParent) => {
    state = validateState(state)

    const bookmarkUtil = require('../lib/bookmarkUtil')
    let bookmark = bookmarksState.getBookmark(state, bookmarkKey)
    let destinationItem = bookmarksState.findBookmark(state, destinationKey)

    if (bookmark.isEmpty()) {
      return state
    }

    // move bookmark into a new folder
    if (moveIntoParent || destinationItem.get('parentFolderId') !== bookmark.get('parentFolderId')) {
      const parentFolderId = destinationItem.get('type') === siteTags.BOOKMARK
        ? destinationItem.get('parentFolderId')
        : destinationItem.get('folderId')

      state = bookmarkOrderCache.removeCacheKey(state, bookmark.get('parentFolderId'), bookmarkKey)
      bookmark = bookmark.set('parentFolderId', ~~parentFolderId)
      const newKey = bookmarkUtil.getKey(bookmark)
      state = state.deleteIn([STATE_SITES.BOOKMARKS, bookmarkKey])
      state = bookmarkOrderCache.addBookmarkToCache(state, bookmark.get('parentFolderId'), newKey)
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
  }
}

module.exports = bookmarksState
