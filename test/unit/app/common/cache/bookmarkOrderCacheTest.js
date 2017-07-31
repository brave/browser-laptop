/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it */

const Immutable = require('immutable')
const assert = require('assert')
const bookmarkOrderCache = require('../../../../../app/common/cache/bookmarkOrderCache')
const siteTags = require('../../../../../js/constants/siteTags')

const bookmark = Immutable.fromJS({
  lastAccessedTime: 123,
  objectId: [210, 115],
  type: siteTags.BOOKMARK,
  location: 'https://brave.com/',
  title: 'Brave',
  parentFolderId: 1,
  partitionNumber: 0,
  key: 'https://brave.com/|0|1'
})
const bookmark1 = Immutable.fromJS({
  lastAccessedTime: 123,
  objectId: [210, 31],
  type: siteTags.BOOKMARK,
  location: 'https://clifton.io/',
  title: 'Clifton',
  parentFolderId: 1,
  partitionNumber: 0,
  key: 'https://clifton.io/|0|1'
})
const bookmark2 = Immutable.fromJS({
  lastAccessedTime: 123,
  objectId: [115, 31],
  type: siteTags.BOOKMARK,
  location: 'https://brianbondy.com/',
  title: 'Bondy',
  parentFolderId: 0,
  partitionNumber: 0,
  key: 'https://brianbondy.com/|0|0'
})

const folder = Immutable.fromJS({
  lastAccessedTime: 123,
  objectId: [115, 31],
  type: siteTags.BOOKMARK_FOLDER,
  folderId: 1,
  title: 'Folder',
  parentFolderId: 1,
  partitionNumber: 0,
  key: '1'
})
const folder1 = Immutable.fromJS({
  lastAccessedTime: 123,
  objectId: [10, 31],
  type: siteTags.BOOKMARK_FOLDER,
  folderId: 2,
  title: 'Folder 1',
  parentFolderId: 0,
  partitionNumber: 0,
  key: '2'
})
const bookmarkKey = bookmark.get('key')
const bookmarkKey1 = bookmark1.get('key')
const bookmarkKey2 = bookmark2.get('key')
const folderKey = folder.get('key')
const folderKey1 = folder1.get('key')
const baseState = Immutable.fromJS({
  bookmarks: {
    [bookmarkKey]: bookmark,
    [bookmarkKey1]: bookmark1,
    [folderKey]: folder
  },
  cache: {
    bookmarkOrder: {}
  }
})
const stateWithData = Immutable.fromJS({
  bookmarks: {
    [bookmarkKey]: bookmark,
    [bookmarkKey1]: bookmark1,
    [folderKey]: folder
  },
  cache: {
    bookmarkOrder: {
      '1': [
        {
          key: bookmarkKey,
          order: 0,
          type: siteTags.BOOKMARK
        }
      ]
    }
  }
})
const stateLargeData = Immutable.fromJS({
  bookmarks: {
    [bookmarkKey]: bookmark,
    [bookmarkKey1]: bookmark1,
    [bookmarkKey2]: bookmark2,
    [folderKey]: folder,
    [folderKey1]: folder1
  },
  cache: {
    bookmarkOrder: {
      '0': [
        {
          key: bookmarkKey2,
          order: 0,
          type: siteTags.BOOKMARK
        },
        {
          key: folderKey1,
          order: 1,
          type: siteTags.BOOKMARK_FOLDER
        }
      ],
      '1': [
        {
          key: bookmarkKey,
          order: 0,
          type: siteTags.BOOKMARK
        },
        {
          key: bookmarkKey1,
          order: 1,
          type: siteTags.BOOKMARK
        },
        {
          key: folderKey,
          order: 2,
          type: siteTags.BOOKMARK_FOLDER
        }
      ]
    }
  }
})

describe('bookmarkOrderCache unit test', function () {
  describe('addBookmarkToCache', function () {
    it('key is not provided', function () {
      const state = bookmarkOrderCache.addBookmarkToCache(baseState)
      assert.deepEqual(state.toJS(), baseState.toJS())
    })

    it('parentId doesnt exist in the list', function () {
      const state = bookmarkOrderCache.addBookmarkToCache(baseState, 1, bookmarkKey)
      const expectedState = baseState.setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
        {
          key: bookmarkKey,
          order: 0,
          type: siteTags.BOOKMARK
        }
      ]))
      assert.deepEqual(state.toJS(), expectedState.toJS())
    })

    it('destination key is not provided, but parentId exist in the list', function () {
      const state = bookmarkOrderCache.addBookmarkToCache(stateWithData, 1, bookmarkKey1)
      const expectedState = stateWithData.setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
        {
          key: bookmarkKey,
          order: 0,
          type: siteTags.BOOKMARK
        },
        {
          key: bookmarkKey1,
          order: 1,
          type: siteTags.BOOKMARK
        }
      ]))
      assert.deepEqual(state.toJS(), expectedState.toJS())
    })

    it('dont add cache if key already exist, but destination is not provided', function () {
      const state = bookmarkOrderCache.addBookmarkToCache(stateWithData, 1, bookmarkKey)
      assert.deepEqual(state.toJS(), stateWithData.toJS())
    })

    it('destination key is provided', function () {
      const state = bookmarkOrderCache.addBookmarkToCache(stateWithData, 1, bookmarkKey1, bookmarkKey)
      const expectedState = stateWithData.setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
        {
          key: bookmarkKey,
          order: 0,
          type: siteTags.BOOKMARK
        },
        {
          key: bookmarkKey1,
          order: 1,
          type: siteTags.BOOKMARK
        }
      ]))
      assert.deepEqual(state.toJS(), expectedState.toJS())
    })

    it('destination key is provided, item should be prepend', function () {
      const state = bookmarkOrderCache.addBookmarkToCache(stateWithData, 1, bookmarkKey1, bookmarkKey, false)
      const expectedState = stateWithData.setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
        {
          key: bookmarkKey1,
          order: 0,
          type: siteTags.BOOKMARK
        },
        {
          key: bookmarkKey,
          order: 1,
          type: siteTags.BOOKMARK
        }
      ]))
      assert.deepEqual(state.toJS(), expectedState.toJS())
    })
  })

  describe('addFolderToCache', function () {
    it('null case', function () {
      const state = bookmarkOrderCache.addFolderToCache(baseState)
      assert.deepEqual(state.toJS(), baseState.toJS())
    })

    it('parentId doesnt exist in the list', function () {
      const state = bookmarkOrderCache.addFolderToCache(baseState, 1, folderKey)
      const expectedState = baseState.setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
        {
          key: folderKey,
          order: 0,
          type: siteTags.BOOKMARK_FOLDER
        }
      ]))
      assert.deepEqual(state.toJS(), expectedState.toJS())
    })

    it('destination key is not provided, but parentId exist in the list', function () {
      const state = bookmarkOrderCache.addFolderToCache(stateWithData, 1, folderKey)
      const expectedState = stateWithData.setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
        {
          key: bookmarkKey,
          order: 0,
          type: siteTags.BOOKMARK
        },
        {
          key: folderKey,
          order: 1,
          type: siteTags.BOOKMARK_FOLDER
        }
      ]))
      assert.deepEqual(state.toJS(), expectedState.toJS())
    })

    it('dont add cache if key already exist, but destination is not provided', function () {
      const stateWithFolder = Immutable.fromJS({
        bookmarks: {
          [bookmarkKey]: bookmark,
          [bookmarkKey1]: bookmark1,
          [folderKey]: folder
        },
        cache: {
          bookmarkOrder: {
            '1': [
              {
                key: folderKey,
                order: 0,
                type: siteTags.BOOKMARK_FOLDER
              }
            ]
          }
        }
      })
      const state = bookmarkOrderCache.addFolderToCache(stateWithFolder, 1, folderKey)
      assert.deepEqual(state.toJS(), stateWithFolder.toJS())
    })

    it('destination key is provided', function () {
      const state = bookmarkOrderCache.addFolderToCache(stateWithData, 1, folderKey, bookmarkKey)
      const expectedState = stateWithData.setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
        {
          key: bookmarkKey,
          order: 0,
          type: siteTags.BOOKMARK
        },
        {
          key: folderKey,
          order: 1,
          type: siteTags.BOOKMARK_FOLDER
        }
      ]))
      assert.deepEqual(state.toJS(), expectedState.toJS())
    })

    it('destination key is provided, item should be prepend', function () {
      const state = bookmarkOrderCache.addFolderToCache(stateWithData, 1, folderKey, bookmarkKey, false)
      const expectedState = stateWithData.setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
        {
          key: folderKey,
          order: 0,
          type: siteTags.BOOKMARK_FOLDER
        },
        {
          key: bookmarkKey,
          order: 1,
          type: siteTags.BOOKMARK
        }
      ]))
      assert.deepEqual(state.toJS(), expectedState.toJS())
    })
  })

  describe('removeCacheKey', function () {
    it('key is not provided', function () {
      const state = bookmarkOrderCache.removeCacheKey(baseState)
      assert.deepEqual(state.toJS(), baseState.toJS())
    })

    it('cache is empty', function () {
      const state = bookmarkOrderCache.removeCacheKey(baseState, 0, bookmarkKey)
      assert.deepEqual(state.toJS(), baseState.toJS())
    })

    it('cache has only one key', function () {
      const state = bookmarkOrderCache.removeCacheKey(stateWithData, 1, bookmarkKey)
      assert.deepEqual(state.toJS(), baseState.toJS())
    })

    it('cache has multiple keys', function () {
      const initState = stateWithData.setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
        {
          key: bookmarkKey,
          order: 0,
          type: siteTags.BOOKMARK
        },
        {
          key: folderKey,
          order: 1,
          type: siteTags.BOOKMARK_FOLDER
        }
      ]))
      const state = bookmarkOrderCache.removeCacheKey(initState, 1, bookmarkKey)
      const expectedState = baseState.setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
        {
          key: folderKey,
          order: 0,
          type: siteTags.BOOKMARK_FOLDER
        }
      ]))
      assert.deepEqual(state.toJS(), expectedState.toJS())
    })
  })

  describe('getFoldersByParentId', function () {
    it('parentId is not provided (default is used)', function () {
      const cache = bookmarkOrderCache.getFoldersByParentId(stateLargeData)
      const expectedCache = [
        {
          key: folderKey1,
          order: 1,
          type: siteTags.BOOKMARK_FOLDER
        }
      ]
      assert.deepEqual(cache.toJS(), expectedCache)
    })

    it('if not found return empty list', function () {
      const cache = bookmarkOrderCache.getFoldersByParentId(stateLargeData, 2)
      assert.deepEqual(cache, Immutable.List())
    })

    it('parentId is provided', function () {
      const cache = bookmarkOrderCache.getFoldersByParentId(stateLargeData, 1)
      const expectedCache = [
        {
          key: folderKey,
          order: 2,
          type: siteTags.BOOKMARK_FOLDER
        }
      ]
      assert.deepEqual(cache.toJS(), expectedCache)
    })
  })

  describe('getBookmarksByParentId', function () {
    it('parentId is not provided (default is used)', function () {
      const cache = bookmarkOrderCache.getBookmarksByParentId(stateLargeData)
      const expectedCache = [
        {
          key: bookmarkKey2,
          order: 0,
          type: siteTags.BOOKMARK
        }
      ]
      assert.deepEqual(cache.toJS(), expectedCache)
    })

    it('if not found return empty list', function () {
      const cache = bookmarkOrderCache.getBookmarksByParentId(stateLargeData, 2)
      assert.deepEqual(cache, Immutable.List())
    })

    it('parentId is provided', function () {
      const cache = bookmarkOrderCache.getBookmarksByParentId(stateLargeData, 1)
      const expectedCache = [
        {
          key: bookmarkKey,
          order: 0,
          type: siteTags.BOOKMARK
        },
        {
          key: bookmarkKey1,
          order: 1,
          type: siteTags.BOOKMARK
        }
      ]
      assert.deepEqual(cache.toJS(), expectedCache)
    })
  })

  describe('getBookmarksWithFolders', function () {
    it('parentId is not provided (default is used)', function () {
      const cache = bookmarkOrderCache.getBookmarksWithFolders(stateLargeData)
      const expectedCache = [
        {
          key: bookmarkKey2,
          order: 0,
          type: siteTags.BOOKMARK
        },
        {
          key: folderKey1,
          order: 1,
          type: siteTags.BOOKMARK_FOLDER
        }
      ]
      assert.deepEqual(cache.toJS(), expectedCache)
    })

    it('if not found return empty list', function () {
      const cache = bookmarkOrderCache.getBookmarksByParentId(stateLargeData, 2)
      assert.deepEqual(cache, Immutable.List())
    })

    it('parentId is provided', function () {
      const cache = bookmarkOrderCache.getBookmarksWithFolders(stateLargeData, 1)
      const expectedCache = [
        {
          key: bookmarkKey,
          order: 0,
          type: siteTags.BOOKMARK
        },
        {
          key: bookmarkKey1,
          order: 1,
          type: siteTags.BOOKMARK
        },
        {
          key: folderKey,
          order: 2,
          type: siteTags.BOOKMARK_FOLDER
        }
      ]
      assert.deepEqual(cache.toJS(), expectedCache)
    })
  })

  describe('removeCacheParent', function () {
    it('null case', function () {
      const state = bookmarkOrderCache.removeCacheParent(baseState)
      assert.deepEqual(state.toJS(), baseState.toJS())
    })

    it('parentId is provided', function () {
      const state = bookmarkOrderCache.removeCacheParent(stateWithData, 1)
      assert.deepEqual(state.toJS(), baseState.toJS())
    })
  })

  describe('getOrderCache', function () {
    it('cache doesnt exist', function () {
      const cache = bookmarkOrderCache.getOrderCache(baseState)
      assert.deepEqual(cache, Immutable.Map())
    })

    it('cache exists', function () {
      const state = bookmarkOrderCache.getOrderCache(stateWithData)
      assert.deepEqual(state.toJS(), stateWithData.getIn(['cache', 'bookmarkOrder']).toJS())
    })
  })
})
