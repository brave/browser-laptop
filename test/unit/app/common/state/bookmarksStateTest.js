/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */
const assert = require('assert')
const Immutable = require('immutable')
const mockery = require('mockery')
const sinon = require('sinon')
const siteTags = require('../../../../../js/constants/siteTags')
const settings = require('../../../../../js/constants/settings')

require('../../../braveUnit')

describe('bookmarkState unit test', function () {
  let bookmarkOrderCache, bookmarksState, bookmarkFoldersState, bookmarkLocationCache, syncActions

  const emptyState = Immutable.fromJS({
    windows: [],
    bookmarks: {},
    bookmarkFolders: {},
    cache: {
      bookmarkOrder: {},
      bookmarkLocation: {}
    },
    historySites: {},
    tabs: []
  })

  const bookmark1 = {
    favicon: undefined,
    title: 'Brave',
    location: 'https://brave.com/',
    key: 'https://brave.com/|0|0',
    parentFolderId: 0,
    partitionNumber: 0,
    objectId: null,
    themeColor: undefined,
    type: siteTags.BOOKMARK
  }

  const bookmark2 = {
    favicon: undefined,
    title: 'Clifton',
    location: 'https://clifton.io/',
    key: 'https://clifton.io/|0|0',
    parentFolderId: 0,
    partitionNumber: 0,
    objectId: null,
    themeColor: undefined,
    type: siteTags.BOOKMARK
  }

  const bookmark3 = {
    favicon: undefined,
    title: 'BBondy',
    location: 'https://brianbondy.com/',
    key: 'https://brianbondy.com/|0|1',
    parentFolderId: 1,
    partitionNumber: 0,
    objectId: null,
    themeColor: undefined,
    type: siteTags.BOOKMARK
  }

  const folder1 = {
    title: 'folder1',
    folderId: 1,
    key: '1',
    parentFolderId: 0,
    partitionNumber: 0,
    objectId: null,
    type: siteTags.BOOKMARK_FOLDER
  }

  const folder2 = {
    title: 'folder2',
    folderId: 2,
    key: '2',
    parentFolderId: 1,
    partitionNumber: 0,
    objectId: null,
    type: siteTags.BOOKMARK_FOLDER
  }

  const stateWithData = Immutable.fromJS({
    windows: [],
    bookmarks: {
      'https://brave.com/|0|0': bookmark1,
      'https://clifton.io/|0|0': bookmark2,
      'https://brianbondy.com/|0|1': bookmark3
    },
    bookmarkFolders: {
      '1': folder1,
      '2': folder2
    },
    cache: {
      bookmarkOrder: {
        '0': [
          {
            key: 'https://brave.com/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: 'https://clifton.io/|0|0',
            order: 1,
            type: siteTags.BOOKMARK
          },
          {
            key: '1',
            order: 2,
            type: siteTags.BOOKMARK_FOLDER
          }
        ],
        '1': [
          {
            key: 'https://brianbondy.com/|0|1',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: '2',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]
      },
      bookmarkLocation: {
        'https://brave.com/': [
          'https://brave.com/|0|0'
        ],
        'https://clifton.io/': [
          'https://clifton.io/|0|0'
        ]
      }
    },
    historySites: {},
    tabs: []
  })

  // Settings
  let settingSyncEnabled = false

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../../js/settings', {
      getSetting: (settingKey) => {
        switch (settingKey) {
          case settings.SYNC_ENABLED:
            return settingSyncEnabled
        }
        return false
      }
    })
    syncActions = require('../../../../../js/actions/syncActions')
    bookmarkOrderCache = require('../../../../../app/common/cache/bookmarkOrderCache')
    bookmarkLocationCache = require('../../../../../app/common/cache/bookmarkLocationCache')
    bookmarkFoldersState = require('../../../../../app/common/state/bookmarkFoldersState')
    bookmarksState = require('../../../../../app/common/state/bookmarksState')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('updateFavicon', function () {
    it('updates the favicon for all matching entries', function () {
      const processedState = bookmarksState.updateFavicon(stateWithData, 'https://brave.com/', 'https://brave.com/favicon.ico')
      assert.equal(processedState.getIn(['bookmarks', 'https://brave.com/|0|0', 'favicon']), 'https://brave.com/favicon.ico')
    })
    it('returns the state unchanged if location is not a URL', function () {
      const processedState = bookmarksState.updateFavicon(stateWithData, 'not-a-url', 'https://brave.com/favicon.ico')
      assert.deepEqual(processedState.get('bookmarks'), stateWithData.get('bookmarks'))
    })
    it('throws an error if bookmarks are not an Immutable.Map', function () {
      const emptyLegacySites = Immutable.fromJS({
        bookmarks: []
      })
      assert.throws(
        () => {
          bookmarksState.updateFavicon(emptyLegacySites, 'https://brave.com/', 'https://brave.com/favicon.ico')
        },
        /state must contain an Immutable.Map of bookmarks/,
        'did not throw with expected message')
    })
    it('returns the state unchanged if key is not found in sites', function () {
      const processedState = bookmarksState.updateFavicon(stateWithData, 'https://not-in-sites.com', 'https://brave.com/favicon.ico')
      assert.deepEqual(processedState.get('bookmarks'), stateWithData.get('bookmarks'))
    })
    it('works even if null/undefined entries are present', function () {
      const stateWithInvalidEntries = stateWithData.mergeDeep(Immutable.fromJS({
        'bookmarks': {
          'null': null,
          'bubba': 'a'
        }
      }))
      const processedState = bookmarksState.updateFavicon(stateWithInvalidEntries, 'https://brave.com/', 'https://brave.com/favicon.ico')
      assert.equal(processedState.getIn(['bookmarks', 'https://brave.com/|0|0', 'favicon']), 'https://brave.com/favicon.ico')
    })
    it('returns the object unchanged if the entry does not exist but found in cache', function () {
      const testUrl = 'https://brave.com'
      const stateWithNoEntries = Immutable.fromJS({
        bookmarks: {},
        cache: {
          bookmarkLocation: {
            'https://brave.com': [
              testUrl + '/|0|0', testUrl + '|0|0'
            ]
          }
        }
      })
      const processedState = bookmarksState.updateFavicon(stateWithNoEntries, testUrl, 'https://brave.com/favicon.ico')
      assert.deepEqual(processedState.get('bookmarks').toJS(), stateWithNoEntries.get('bookmarks').toJS())
    })
  })

  describe('getBookmarksByParentId', function () {
    let getBookmarksByParentIdSpy
    before(function () {
      getBookmarksByParentIdSpy = sinon.spy(bookmarkOrderCache, 'getBookmarksByParentId')
    })

    afterEach(function () {
      getBookmarksByParentIdSpy.reset()
    })

    after(function () {
      getBookmarksByParentIdSpy.restore()
    })

    it('null case', function () {
      const result = bookmarksState.getBookmarksByParentId(stateWithData)
      assert(getBookmarksByParentIdSpy.notCalled)
      assert.deepEqual(result.toJS(), [])
    })

    it('cache is empty', function () {
      const result = bookmarksState.getBookmarksByParentId(emptyState, 1)
      assert(getBookmarksByParentIdSpy.calledOnce)
      assert.deepEqual(result.toJS(), [])
    })

    it('bookmarks are returned', function () {
      const result = bookmarksState.getBookmarksByParentId(stateWithData, 0)
      assert(getBookmarksByParentIdSpy.calledOnce)
      assert.deepEqual(result.toJS(), [
        bookmark1,
        bookmark2
      ])
    })
  })

  describe('getBookmarks', function () {
    it('return', function () {
      const result = bookmarksState.getBookmarks(stateWithData)
      assert.deepEqual(result.toJS(), stateWithData.get('bookmarks').toJS())
    })
  })

  describe('getBookmark', function () {
    it('null case', function () {
      const result = bookmarksState.getBookmark(stateWithData)
      assert.deepEqual(result.toJS(), {})
    })

    it('return', function () {
      const result = bookmarksState.getBookmark(stateWithData, 'https://brave.com/|0|0')
      assert.deepEqual(result.toJS(), bookmark1)
    })
  })

  describe('findBookmark', function () {
    let getBookmarkSpy, getFolderSpy
    before(function () {
      getBookmarkSpy = sinon.spy(bookmarksState, 'getBookmark')
      getFolderSpy = sinon.spy(bookmarkFoldersState, 'getFolder')
    })

    afterEach(function () {
      getBookmarkSpy.reset()
      getFolderSpy.reset()
    })

    after(function () {
      getBookmarkSpy.restore()
      getFolderSpy.restore()
    })

    it('null case', function () {
      const result = bookmarksState.findBookmark(stateWithData)
      assert.deepEqual(result.toJS(), {})
      assert(getBookmarkSpy.notCalled)
      assert(getFolderSpy.notCalled)
    })

    it('we are looking for bookmark', function () {
      const result = bookmarksState.findBookmark(stateWithData, 'https://brave.com/|0|0')
      assert.deepEqual(result.toJS(), bookmark1)
      assert(getBookmarkSpy.calledOnce)
      assert(getFolderSpy.notCalled)
    })

    it('we are looking for bookmark folder', function () {
      const result = bookmarksState.findBookmark(stateWithData, '1')
      assert.deepEqual(result.toJS(), stateWithData.getIn(['bookmarkFolders', '1']).toJS())
      assert(getBookmarkSpy.calledOnce)
      assert(getFolderSpy.calledOnce)
    })
  })

  describe('getBookmarksWithFolders', function () {
    let getBookmarksWithFoldersSpy
    before(function () {
      getBookmarksWithFoldersSpy = sinon.spy(bookmarkOrderCache, 'getBookmarksWithFolders')
    })

    afterEach(function () {
      getBookmarksWithFoldersSpy.reset()
    })

    after(function () {
      getBookmarksWithFoldersSpy.restore()
    })

    it('null case (default to parent id 0)', function () {
      const result = bookmarksState.getBookmarksWithFolders(stateWithData)
      const expectedResult = Immutable.fromJS([
        bookmark1,
        bookmark2,
        folder1
      ])
      assert.deepEqual(result.toJS(), expectedResult.toJS())
      assert(getBookmarksWithFoldersSpy.calledOnce)
    })

    it('with parent id', function () {
      const result = bookmarksState.getBookmarksWithFolders(stateWithData, 1)
      const expectedResult = Immutable.fromJS([
        bookmark3,
        folder2
      ])
      assert.deepEqual(result.toJS(), expectedResult.toJS())
      assert(getBookmarksWithFoldersSpy.calledOnce)
    })
  })

  describe('addBookmark', function () {
    let addCacheKeySpy, addBookmarkToCacheSpy
    before(function () {
      addCacheKeySpy = sinon.spy(bookmarkLocationCache, 'addCacheKey')
      addBookmarkToCacheSpy = sinon.spy(bookmarkOrderCache, 'addBookmarkToCache')
    })

    afterEach(function () {
      addCacheKeySpy.reset()
      addBookmarkToCacheSpy.reset()
    })

    after(function () {
      addCacheKeySpy.restore()
      addBookmarkToCacheSpy.restore()
    })

    it('null case', function () {
      const result = bookmarksState.addBookmark(emptyState)
      assert(addCacheKeySpy.notCalled)
      assert(addBookmarkToCacheSpy.notCalled)
      assert.deepEqual(result.toJS(), emptyState.toJS())
    })

    it('completely new bookmark', function () {
      const bookmark = Immutable.fromJS({
        location: 'https://page.com',
        parentFolderId: 2,
        title: 'Page',
        key: 'https://page.com|0|2'
      })
      const result = bookmarksState.addBookmark(emptyState, bookmark)
      const expectedState = emptyState
        .setIn(['bookmarks'], Immutable.fromJS({
          'https://page.com|0|2': {
            location: 'https://page.com',
            parentFolderId: 2,
            title: 'Page',
            key: 'https://page.com|0|2'
          }
        }))
        .setIn(['cache', 'bookmarkOrder', '2'], Immutable.fromJS([
          {
            order: 0,
            key: 'https://page.com|0|2',
            type: siteTags.BOOKMARK
          }
        ]))
        .setIn(['cache', 'bookmarkLocation', 'https://page.com'], Immutable.fromJS([
          'https://page.com|0|2'
        ]))

      assert(addCacheKeySpy.calledOnce)
      assert(addBookmarkToCacheSpy.calledOnce)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })

    it('we already have cache for this bookmark', function () {
      const bookmark = Immutable.fromJS(bookmark1).set('title', 'New Brave')
      const result = bookmarksState.addBookmark(stateWithData, bookmark)
      const expectedState = stateWithData
        .setIn(['bookmarks', 'https://brave.com/|0|0', 'title'], 'New Brave')

      assert(addCacheKeySpy.notCalled)
      assert(addBookmarkToCacheSpy.notCalled)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('editBookmark', function () {
    let addCacheKeySpy, addBookmarkToCacheSpy, removeCacheKeySpy, removeCacheOrderSpy
    before(function () {
      addCacheKeySpy = sinon.spy(bookmarkLocationCache, 'addCacheKey')
      removeCacheKeySpy = sinon.spy(bookmarkLocationCache, 'removeCacheKey')
      removeCacheOrderSpy = sinon.spy(bookmarkOrderCache, 'removeCacheKey')
      addBookmarkToCacheSpy = sinon.spy(bookmarkOrderCache, 'addBookmarkToCache')
    })

    afterEach(function () {
      addCacheKeySpy.reset()
      addBookmarkToCacheSpy.reset()
      removeCacheKeySpy.reset()
      removeCacheOrderSpy.reset()
    })

    after(function () {
      addCacheKeySpy.restore()
      addBookmarkToCacheSpy.restore()
      removeCacheKeySpy.restore()
      removeCacheOrderSpy.restore()
    })

    it('null case', function () {
      const result = bookmarksState.editBookmark(stateWithData)
      assert(addCacheKeySpy.notCalled)
      assert(removeCacheOrderSpy.notCalled)
      assert(addBookmarkToCacheSpy.notCalled)
      assert(removeCacheKeySpy.notCalled)
      assert(result.toJS(), stateWithData.toJS())
    })

    it('edit key is different then old bookmark', function () {
      const bookmark = Immutable.fromJS({
        location: 'https://brave.com/',
        parentFolderId: 2,
        title: 'Page',
        key: 'https://brave.com/|0|2'
      })

      const expectedState = stateWithData
        .deleteIn(['bookmarks', 'https://brave.com/|0|0'])
        .setIn(['bookmarks', 'https://brave.com/|0|2'], Immutable.fromJS({
          location: 'https://brave.com/',
          parentFolderId: 2,
          title: 'Page',
          key: 'https://brave.com/|0|2'
        }))
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: 'https://clifton.io/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: '1',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '2'], Immutable.fromJS([
          {
            order: 0,
            key: 'https://brave.com/|0|2',
            type: siteTags.BOOKMARK
          }
        ]))
        .setIn(['cache', 'bookmarkLocation', 'https://brave.com/'], Immutable.fromJS([
          'https://brave.com/|0|2'
        ]))
      const result = bookmarksState.editBookmark(stateWithData, bookmark1, bookmark)
      assert(addCacheKeySpy.calledOnce)
      assert(removeCacheOrderSpy.calledOnce)
      assert(addBookmarkToCacheSpy.calledOnce)
      assert(removeCacheKeySpy.calledOnce)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })

    it('edit key is the same as old bookmark', function () {
      const bookmark = Immutable.fromJS({
        location: 'https://brave.com/',
        parentFolderId: 0,
        title: 'Page Title',
        key: 'https://brave.com/|0|0'
      })

      const expectedState = stateWithData
        .setIn(['bookmarks', 'https://brave.com/|0|0'], bookmark)
      const result = bookmarksState.editBookmark(stateWithData, bookmark1, bookmark)

      assert(addCacheKeySpy.calledOnce)
      assert(removeCacheKeySpy.calledOnce)
      assert(removeCacheOrderSpy.notCalled)
      assert(addBookmarkToCacheSpy.notCalled)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('removeBookmark', function () {
    let removeCacheOrderSpy, removeCacheKeySpy, getBookmarkSpy, removeSitesSpy
    before(function () {
      removeCacheOrderSpy = sinon.spy(bookmarkOrderCache, 'removeCacheKey')
      removeCacheKeySpy = sinon.spy(bookmarkLocationCache, 'removeCacheKey')
      getBookmarkSpy = sinon.spy(bookmarksState, 'getBookmark')
      removeSitesSpy = sinon.spy(syncActions, 'removeSites')
    })

    afterEach(function () {
      removeCacheOrderSpy.reset()
      removeCacheKeySpy.reset()
      getBookmarkSpy.reset()
      removeSitesSpy.reset()
    })

    after(function () {
      removeCacheOrderSpy.restore()
      removeCacheKeySpy.restore()
      getBookmarkSpy.restore()
      removeSitesSpy.restore()
    })

    it('null case', function () {
      const result = bookmarksState.removeBookmark(stateWithData)
      assert.deepEqual(result.toJS(), stateWithData.toJS())
      assert(removeCacheOrderSpy.notCalled)
      assert(removeCacheKeySpy.notCalled)
      assert(getBookmarkSpy.notCalled)
      assert(removeSitesSpy.notCalled)
    })

    it('bookmark does not exist', function () {
      const result = bookmarksState.removeBookmark(stateWithData, 'https://brave.com/|0|1')
      assert.deepEqual(result.toJS(), stateWithData.toJS())
      assert(getBookmarkSpy.calledOnce)
      assert(removeCacheOrderSpy.notCalled)
      assert(removeCacheKeySpy.notCalled)
      assert(removeSitesSpy.notCalled)
    })

    it('call sync if enabled', function () {
      settingSyncEnabled = true
      bookmarksState.removeBookmark(stateWithData, 'https://brave.com/|0|0')
      assert(removeSitesSpy.calledOnce)
      settingSyncEnabled = false
    })

    it('remove bookmark', function () {
      const result = bookmarksState.removeBookmark(stateWithData, 'https://brave.com/|0|0')
      const expectedState = stateWithData
        .deleteIn(['bookmarks', 'https://brave.com/|0|0'])
        .deleteIn(['cache', 'bookmarkLocation', 'https://brave.com/'])
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: 'https://clifton.io/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: '1',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheOrderSpy.calledOnce)
      assert(removeCacheKeySpy.calledOnce)
      assert(getBookmarkSpy.calledOnce)
      assert(removeSitesSpy.notCalled)
    })
  })

  describe('removeBookmarksByParentId', function () {
    let removeCacheOrderSpy, removeCacheKeySpy, getBookmarkSpy, removeSitesSpy
    before(function () {
      removeCacheKeySpy = sinon.spy(bookmarkLocationCache, 'removeCacheKey')
      removeCacheOrderSpy = sinon.spy(bookmarkOrderCache, 'removeCacheKey')
      getBookmarkSpy = sinon.spy(bookmarksState, 'getBookmarks')
      removeSitesSpy = sinon.spy(syncActions, 'removeSites')
    })

    afterEach(function () {
      removeCacheKeySpy.reset()
      getBookmarkSpy.reset()
      removeCacheOrderSpy.reset()
      removeSitesSpy.reset()
    })

    after(function () {
      removeCacheKeySpy.restore()
      getBookmarkSpy.restore()
      removeCacheOrderSpy.restore()
      removeSitesSpy.restore()
    })

    it('null case', function () {
      const result = bookmarksState.removeBookmarksByParentId(stateWithData)
      assert.deepEqual(result.toJS(), stateWithData.toJS())
      assert(removeCacheKeySpy.notCalled)
      assert(getBookmarkSpy.notCalled)
      assert(removeSitesSpy.notCalled)
      assert(removeCacheOrderSpy.notCalled)
    })

    it('bookmark map is empty', function () {
      const result = bookmarksState.removeBookmarksByParentId(emptyState, '1')
      assert.deepEqual(result.toJS(), emptyState.toJS())
      assert(getBookmarkSpy.calledOnce)
      assert(removeCacheKeySpy.notCalled)
      assert(removeSitesSpy.notCalled)
      assert(removeCacheOrderSpy.notCalled)
    })

    it('there is no bookmark for provided parent ID', function () {
      const result = bookmarksState.removeBookmarksByParentId(stateWithData, '3')
      assert.deepEqual(result.toJS(), stateWithData.toJS())
      assert(getBookmarkSpy.calledOnce)
      assert(removeCacheKeySpy.notCalled)
      assert(removeSitesSpy.notCalled)
      assert(removeCacheOrderSpy.notCalled)
    })

    it('we remove some bookmarks', function () {
      const result = bookmarksState.removeBookmarksByParentId(stateWithData, '0')
      const expectedState = stateWithData
        .deleteIn(['bookmarks', 'https://brave.com/|0|0'])
        .deleteIn(['bookmarks', 'https://clifton.io/|0|0'])
        .deleteIn(['cache', 'bookmarkLocation', 'https://brave.com/'])
        .deleteIn(['cache', 'bookmarkLocation', 'https://clifton.io/'])
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '1',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(getBookmarkSpy.calledOnce)
      assert(removeCacheKeySpy.calledTwice)
      assert(removeCacheOrderSpy.calledTwice)
      assert(removeSitesSpy.notCalled)
    })

    it('sync is enabled', function () {
      settingSyncEnabled = true
      bookmarksState.removeBookmarksByParentId(stateWithData, '0')
      const expectedState = [
        stateWithData.getIn(['bookmarks', 'https://brave.com/|0|0']).toJS(),
        stateWithData.getIn(['bookmarks', 'https://clifton.io/|0|0']).toJS()
      ]
      assert(removeSitesSpy.withArgs(expectedState).calledOnce)
      settingSyncEnabled = false
    })
  })

  describe('moveBookmark', function () {
    let addFolderToCacheSpy, removeCacheKeySpy, findBookmarkSpy, bookmarkLocationCacheSpy

    before(function () {
      removeCacheKeySpy = sinon.spy(bookmarkOrderCache, 'removeCacheKey')
      addFolderToCacheSpy = sinon.spy(bookmarkOrderCache, 'addBookmarkToCache')
      bookmarkLocationCacheSpy = sinon.spy(bookmarkLocationCache, 'addCacheKey')
      findBookmarkSpy = sinon.spy(bookmarksState, 'findBookmark')
    })

    afterEach(function () {
      removeCacheKeySpy.reset()
      addFolderToCacheSpy.reset()
      bookmarkLocationCacheSpy.reset()
      findBookmarkSpy.reset()
    })

    after(function () {
      removeCacheKeySpy.restore()
      addFolderToCacheSpy.restore()
      bookmarkLocationCacheSpy.restore()
      findBookmarkSpy.restore()
    })

    it('null case', function () {
      const result = bookmarksState.moveBookmark(stateWithData)
      assert.deepEqual(result.toJS(), stateWithData.toJS())
      assert(removeCacheKeySpy.notCalled)
      assert(addFolderToCacheSpy.notCalled)
      assert(bookmarkLocationCacheSpy.notCalled)
      assert(findBookmarkSpy.notCalled)
    })

    it('destination folder is not found', function () {
      const result = bookmarksState.moveBookmark(stateWithData, '69')
      assert.deepEqual(result.toJS(), stateWithData.toJS())
      assert(removeCacheKeySpy.notCalled)
      assert(addFolderToCacheSpy.notCalled)
      assert(bookmarkLocationCacheSpy.notCalled)
      assert(findBookmarkSpy.notCalled)
    })

    it('bookmark is moved (destination is bookmark)', function () {
      const result = bookmarksState.moveBookmark(stateWithData, 'https://brave.com/|0|0', 'https://brianbondy.com/|0|1')
      const expectedState = stateWithData
        .deleteIn(['bookmarks', 'https://brave.com/|0|0'])
        .setIn(['bookmarks', 'https://brave.com/|0|1'], Immutable.fromJS(bookmark1))
        .setIn(['bookmarks', 'https://brave.com/|0|1', 'parentFolderId'], 1)
        .setIn(['bookmarks', 'https://brave.com/|0|1', 'key'], 'https://brave.com/|0|1')
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: 'https://clifton.io/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: '1',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
          {
            key: 'https://brianbondy.com/|0|1',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: '2',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: 'https://brave.com/|0|1',
            order: 2,
            type: siteTags.BOOKMARK
          }
        ]))
        .setIn(['cache', 'bookmarkLocation', 'https://brave.com/'], Immutable.fromJS([
          'https://brave.com/|0|1'
        ]))
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(bookmarkLocationCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })

    it('bookmark is moved (destination is bookmark folder, and parentID is the same)', function () {
      const result = bookmarksState.moveBookmark(stateWithData, 'https://brave.com/|0|0', '1', true, true)
      const expectedState = stateWithData
        .deleteIn(['bookmarks', 'https://brave.com/|0|0'])
        .setIn(['bookmarks', 'https://brave.com/|0|1'], Immutable.fromJS(bookmark1))
        .setIn(['bookmarks', 'https://brave.com/|0|1', 'parentFolderId'], 1)
        .setIn(['bookmarks', 'https://brave.com/|0|1', 'key'], 'https://brave.com/|0|1')
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: 'https://clifton.io/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: '1',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
          {
            key: 'https://brianbondy.com/|0|1',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: '2',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: 'https://brave.com/|0|1',
            order: 2,
            type: siteTags.BOOKMARK
          }
        ]))
        .setIn(['cache', 'bookmarkLocation', 'https://brave.com/'], Immutable.fromJS([
          'https://brave.com/|0|1'
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
    })

    it('bookmark is moved (destination is bookmark toolbar)', function () {
      const result = bookmarksState.moveBookmark(stateWithData, 'https://brianbondy.com/|0|1', '0', true, true)
      const expectedState = stateWithData
        .deleteIn(['bookmarks', 'https://brianbondy.com/|0|1'])
        .setIn(['bookmarks', 'https://brianbondy.com/|0|0'], Immutable.fromJS(bookmark3))
        .setIn(['bookmarks', 'https://brianbondy.com/|0|0', 'parentFolderId'], 0)
        .setIn(['bookmarks', 'https://brianbondy.com/|0|0', 'key'], 'https://brianbondy.com/|0|0')
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: 'https://brave.com/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: 'https://clifton.io/|0|0',
            order: 1,
            type: siteTags.BOOKMARK
          },
          {
            key: '1',
            order: 2,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: 'https://brianbondy.com/|0|0',
            order: 3,
            type: siteTags.BOOKMARK
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
          {
            key: '2',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkLocation', 'https://brianbondy.com/'], Immutable.fromJS([
          'https://brianbondy.com/|0|0'
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
    })

    it('bookmark is moved (destination is other bookmarks)', function () {
      const result = bookmarksState.moveBookmark(stateWithData, 'https://brianbondy.com/|0|1', -1, true, true)
      const expectedState = stateWithData
        .deleteIn(['bookmarks', 'https://brianbondy.com/|0|1'])
        .setIn(['bookmarks', 'https://brianbondy.com/|0|-1'], Immutable.fromJS(bookmark3))
        .setIn(['bookmarks', 'https://brianbondy.com/|0|-1', 'parentFolderId'], -1)
        .setIn(['bookmarks', 'https://brianbondy.com/|0|-1', 'key'], 'https://brianbondy.com/|0|-1')
        .setIn(['cache', 'bookmarkOrder', '-1'], Immutable.fromJS([
          {
            key: 'https://brianbondy.com/|0|-1',
            order: 0,
            type: siteTags.BOOKMARK
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
          {
            key: '2',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkLocation', 'https://brianbondy.com/'], Immutable.fromJS([
          'https://brianbondy.com/|0|-1'
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
    })

    it('destination parent ID is different then current parent ID', function () {
      const result = bookmarksState.moveBookmark(stateWithData, 'https://brave.com/|0|0', '2', false, false)
      const expectedState = stateWithData
        .deleteIn(['bookmarks', 'https://brave.com/|0|0'])
        .setIn(['bookmarks', 'https://brave.com/|0|1'], Immutable.fromJS(bookmark1))
        .setIn(['bookmarks', 'https://brave.com/|0|1', 'parentFolderId'], 1)
        .setIn(['bookmarks', 'https://brave.com/|0|1', 'key'], 'https://brave.com/|0|1')
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: 'https://clifton.io/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: '1',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
          {
            key: 'https://brianbondy.com/|0|1',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: '2',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: 'https://brave.com/|0|1',
            order: 2,
            type: siteTags.BOOKMARK
          }
        ]))
        .setIn(['cache', 'bookmarkLocation', 'https://brave.com/'], Immutable.fromJS([
          'https://brave.com/|0|1'
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
    })

    it('we want to move it into the parent folder', function () {
      const result = bookmarksState.moveBookmark(stateWithData, 'https://brave.com/|0|0', '2', false, true)
      const expectedState = stateWithData
        .deleteIn(['bookmarks', 'https://brave.com/|0|0'])
        .setIn(['bookmarks', 'https://brave.com/|0|2'], Immutable.fromJS(bookmark1))
        .setIn(['bookmarks', 'https://brave.com/|0|2', 'parentFolderId'], 2)
        .setIn(['bookmarks', 'https://brave.com/|0|2', 'key'], 'https://brave.com/|0|2')
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: 'https://clifton.io/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: '1',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '2'], Immutable.fromJS([
          {
            key: 'https://brave.com/|0|2',
            order: 0,
            type: siteTags.BOOKMARK
          }
        ]))
        .setIn(['cache', 'bookmarkLocation', 'https://brave.com/'], Immutable.fromJS([
          'https://brave.com/|0|2'
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
    })

    it('we have the same parent ID (destination and current)', function () {
      const result = bookmarksState.moveBookmark(stateWithData, 'https://brave.com/|0|0', 'https://clifton.io/|0|0')
      const expectedState = stateWithData
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: 'https://clifton.io/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: 'https://brave.com/|0|0',
            order: 1,
            type: siteTags.BOOKMARK
          },
          {
            key: '1',
            order: 2,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
    })

    it('we want to prepend folder', function () {
      const result = bookmarksState.moveBookmark(stateWithData, 'https://brave.com/|0|0', '1', false)
      const expectedState = stateWithData
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: 'https://clifton.io/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: 'https://brave.com/|0|0',
            order: 1,
            type: siteTags.BOOKMARK
          },
          {
            key: '1',
            order: 2,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
    })
  })
})
