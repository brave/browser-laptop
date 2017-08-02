/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const Immutable = require('immutable')

// Actions
const syncActions = require('../../../js/actions/syncActions')

// Constants
const settings = require('../../../js/constants/settings')
const siteTags = require('../../../js/constants/siteTags')
const {STATE_SITES} = require('../../../js/constants/stateConstants')

// State
const bookmarkOrderCache = require('../cache/bookmarkOrderCache')

// Utils
const bookmarkFoldersUtil = require('../lib/bookmarkFoldersUtil')
const {makeImmutable, isMap} = require('./immutableUtil')
const {getSetting} = require('../../../js/settings')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isMap(state.get(STATE_SITES.BOOKMARK_FOLDERS)), 'state must contain an Immutable.Map of bookmarkFolders')
  return state
}

const bookmarkFoldersState = {
  getFolders: (state) => {
    state = validateState(state)
    return state.get(STATE_SITES.BOOKMARK_FOLDERS, Immutable.Map())
  },

  getFolder: (state, folderKey) => {
    state = validateState(state)
    folderKey = folderKey.toString()
    return state.getIn([STATE_SITES.BOOKMARK_FOLDERS, folderKey], Immutable.Map())
  },

  getFoldersByParentId: (state, parentFolderId) => {
    state = validateState(state)

    const folders = bookmarkOrderCache.getFoldersByParentId(state, parentFolderId)
    return folders.map(folder => bookmarkFoldersState.getFolder(state, folder.get('key')))
  },

  addFolder: (state, folderDetails, destinationKey) => {
    state = validateState(state)
    folderDetails = makeImmutable(folderDetails)
    let folders = bookmarkFoldersState.getFolders(state)
    let key = folderDetails.get('folderId')

    if (!folderDetails.has('folderId')) {
      key = bookmarkFoldersUtil.getNextFolderId(folders)
    }

    const newFolder = makeImmutable({
      title: folderDetails.get('title'),
      folderId: ~~key,
      key: key.toString(),
      parentFolderId: ~~folderDetails.get('parentFolderId', 0),
      partitionNumber: ~~folderDetails.get('partitionNumber', 0),
      objectId: folderDetails.get('objectId', null),
      type: siteTags.BOOKMARK_FOLDER,
      skipSync: folderDetails.get('skipSync', null)
    })

    state = state.setIn([STATE_SITES.BOOKMARK_FOLDERS, key.toString()], newFolder)
    state = bookmarkOrderCache.addFolderToCache(state, newFolder.get('parentFolderId'), key, destinationKey)
    return state
  },

  editFolder: (state, editKey, folderDetails) => {
    state = validateState(state)
    const oldFolder = bookmarkFoldersState.getFolder(state, editKey)

    if (oldFolder.isEmpty()) {
      return state
    }

    const newFolder = oldFolder.merge(makeImmutable({
      title: folderDetails.get('title'),
      parentFolderId: ~~folderDetails.get('parentFolderId', 0)
    }))

    if (oldFolder.get('parentFolderId') !== newFolder.get('parentFolderId')) {
      state = bookmarkOrderCache.removeCacheKey(state, oldFolder.get('parentFolderId'), editKey)
      state = bookmarkOrderCache.addFolderToCache(state, newFolder.get('parentFolderId'), editKey)
    }

    state = state.setIn([STATE_SITES.BOOKMARK_FOLDERS, editKey.toString()], newFolder)
    return state
  },

  removeFolder: (state, folderKey) => {
    const bookmarksState = require('./bookmarksState')
    const folders = bookmarkFoldersState.getFolders(state)
    const folder = bookmarkFoldersState.getFolder(state, folderKey)

    if (folder.isEmpty()) {
      return state
    }

    if (getSetting(settings.SYNC_ENABLED) === true) {
      syncActions.removeSite(folder)
    }

    folders.filter(folder => folder.get('parentFolderId') === ~~folderKey)
      .map(folder => {
        state = bookmarksState.removeBookmarksByParentId(state, folder.get('folderId'))
        state = bookmarkFoldersState.removeFolder(state, folder.get('folderId'))
        state = bookmarkOrderCache.removeCacheParent(state, folder.get('folderId'))
        state = bookmarkOrderCache.removeCacheKey(state, folder.get('parentFolderId'), folderKey)
      })

    state = bookmarksState.removeBookmarksByParentId(state, folderKey)
    state = bookmarkOrderCache.removeCacheParent(state, folderKey)
    state = bookmarkOrderCache.removeCacheKey(state, folder.get('parentFolderId'), folderKey)
    return state.deleteIn([STATE_SITES.BOOKMARK_FOLDERS, folderKey.toString()])
  },

  /**
   * Get all folders except provided folder
   * @param state
   * @param folderKey
   * @param parentFolderId
   * @param labelPrefix
   * @returns {Array}
   */
  getFoldersWithoutKey: (state, folderKey, parentFolderId = 0, labelPrefix = '') => {
    let folders = []
    const results = bookmarkFoldersState.getFoldersByParentId(state, parentFolderId)

    const resultSize = results.size
    for (let i = 0; i < resultSize; i++) {
      const folder = results.get(i)
      if (folder.get('folderId') === folderKey) {
        continue
      }

      const label = labelPrefix + folder.get('title')
      folders.push({
        folderId: folder.get('folderId'),
        label
      })
      const subSites = bookmarkFoldersState.getFoldersWithoutKey(state, folderKey, folder.get('folderId'), (label || '') + ' / ')
      folders = folders.concat(subSites)
    }

    return folders
  },

  moveFolder: (state, folderKey, destinationKey, append, moveIntoParent) => {
    const bookmarksState = require('./bookmarksState')
    let folder = bookmarkFoldersState.getFolder(state, folderKey)
    let destinationItem = bookmarksState.findBookmark(state, destinationKey)

    if (folder.isEmpty()) {
      return state
    }

    if (moveIntoParent || destinationItem.get('parentFolderId') !== folder.get('parentFolderId')) {
      const parentFolderId = destinationItem.get('type') === siteTags.BOOKMARK
        ? destinationItem.get('parentFolderId')
        : destinationItem.get('folderId')

      state = bookmarkOrderCache.removeCacheKey(state, folder.get('parentFolderId'), folderKey)
      folder = folder.set('parentFolderId', ~~parentFolderId)
      const newKey = bookmarkFoldersUtil.getKey(folder)
      state = state.deleteIn([STATE_SITES.BOOKMARK_FOLDERS, folderKey])
      state = bookmarkOrderCache.addFolderToCache(state, folder.get('parentFolderId'), newKey)
      return state.setIn([STATE_SITES.BOOKMARK_FOLDERS, newKey.toString()], folder)
    }

    state = bookmarkOrderCache.removeCacheKey(state, folder.get('parentFolderId'), folderKey)
    state = bookmarkOrderCache.addFolderToCache(
      state,
      folder.get('parentFolderId'),
      folderKey,
      destinationKey,
      append
    )
    return state
  }
}

module.exports = bookmarkFoldersState
