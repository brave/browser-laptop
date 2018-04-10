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

    if (folderKey == null) {
      return Immutable.Map()
    }

    folderKey = folderKey.toString()
    return state.getIn([STATE_SITES.BOOKMARK_FOLDERS, folderKey], Immutable.Map())
  },

  getFoldersByParentId: (state, parentFolderId) => {
    state = validateState(state)

    if (parentFolderId == null) {
      return Immutable.List()
    }

    const folders = bookmarkOrderCache.getFoldersByParentId(state, parentFolderId)
    return folders.map(folder => bookmarkFoldersState.getFolder(state, folder.get('key')))
  },

  addFolder: (state, folderDetails, destinationKey) => {
    state = validateState(state)

    if (folderDetails == null) {
      return state
    }

    folderDetails = makeImmutable(folderDetails)

    if (folderDetails.get('key') == null) {
      return state
    }

    state = state.setIn([STATE_SITES.BOOKMARK_FOLDERS, folderDetails.get('key')], folderDetails)
    state = bookmarkOrderCache.addFolderToCache(state, folderDetails.get('parentFolderId'), folderDetails.get('key'), destinationKey)
    return state
  },

  editFolder: (state, editKey, oldFolder, folderDetails) => {
    state = validateState(state)

    if (oldFolder == null) {
      return state
    }

    const newFolder = oldFolder.merge(makeImmutable({
      title: folderDetails.get('title'),
      parentFolderId: Number(folderDetails.get('parentFolderId', 0))
    }))

    if (oldFolder.get('parentFolderId') !== newFolder.get('parentFolderId')) {
      state = bookmarkOrderCache.removeCacheKey(state, oldFolder.get('parentFolderId'), editKey)
      state = bookmarkOrderCache.addFolderToCache(state, newFolder.get('parentFolderId'), editKey)
    }

    state = state.setIn([STATE_SITES.BOOKMARK_FOLDERS, editKey.toString()], newFolder)
    return state
  },

  removeFolder: (state, folderKey) => {
    state = validateState(state)
    const folder = bookmarkFoldersState.getFolder(state, folderKey)

    if (folder.isEmpty()) {
      return state
    }

    const bookmarksState = require('./bookmarksState')
    const folders = bookmarkFoldersState.getFolders(state)

    if (getSetting(settings.SYNC_ENABLED) === true) {
      syncActions.removeSites([folder.toJS()])
    }

    folders.filter(folder => folder.get('parentFolderId') === Number(folderKey))
      .map(folder => {
        state = bookmarkFoldersState.removeFolder(state, folder.get('folderId'))
      })

    state = bookmarksState.removeBookmarksByParentId(state, folderKey)
    state = bookmarkOrderCache.removeCacheParent(state, folderKey)
    state = bookmarkOrderCache.removeCacheKey(state, folder.get('parentFolderId'), folderKey)
    return state.deleteIn([STATE_SITES.BOOKMARK_FOLDERS, folderKey.toString()])
  },

  /**
   * Get a list of all folders except provided folder
   * @param state
   * @param {number} folderKey
   * @param parentFolderId
   * @param labelPrefix
   * @returns {Array} - each entry with folder id and label (title)
   */
  getFoldersWithoutKey: (state, folderKey, parentFolderId = 0, labelPrefix = '') => {
    state = validateState(state)
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
      const subFolders = bookmarkFoldersState.getFoldersWithoutKey(state, folderKey, folder.get('folderId'), (label || '') + ' / ')
      folders = folders.concat(subFolders)
    }

    return folders
  },

  moveFolder: (state, folderKey, destinationKey, append, moveIntoParent) => {
    state = validateState(state)
    let folder = bookmarkFoldersState.getFolder(state, folderKey)
    if (folder.isEmpty()) {
      return state
    }

    const bookmarksState = require('./bookmarksState')
    let destinationItem = bookmarksState.findBookmark(state, destinationKey)
    const numKey = Number(destinationKey)
    if (destinationItem.isEmpty() && numKey !== -1 && numKey !== 0) {
      return state
    }

    if (moveIntoParent || destinationItem.get('parentFolderId') !== folder.get('parentFolderId')) {
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

      state = bookmarkOrderCache.removeCacheKey(state, folder.get('parentFolderId'), folderKey)
      folder = folder.set('parentFolderId', Number(parentFolderId))
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
