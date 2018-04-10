/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')

const settings = require('../../../../../js/constants/settings')
const siteTags = require('../../../../../js/constants/siteTags')
const {STATE_SITES} = require('../../../../../js/constants/stateConstants')
require('../../../braveUnit')

describe('bookmarkFoldersState unit test', function () {
  let bookmarkFoldersState, bookmarkOrderCache, bookmarksState, syncActions

  // Settings
  let settingSyncEnabled = false

  const state = Immutable.fromJS({
    bookmarks: {},
    bookmarkFolders: {},
    cache: {
      bookmarkOrder: {}
    }
  })

  const stateWithData = Immutable.fromJS({
    bookmarks: {},
    bookmarkFolders: {
      '1': {
        title: 'folder1',
        folderId: 1,
        key: '1',
        parentFolderId: 0,
        partitionNumber: 0,
        objectId: null,
        type: siteTags.BOOKMARK_FOLDER
      },
      '2': {
        title: 'folder2',
        folderId: 2,
        key: '2',
        parentFolderId: 1,
        partitionNumber: 0,
        objectId: null,
        type: siteTags.BOOKMARK_FOLDER
      },
      '69': {
        title: 'folder69',
        folderId: 69,
        key: '69',
        parentFolderId: 0,
        partitionNumber: 0,
        objectId: null,
        type: siteTags.BOOKMARK_FOLDER
      }
    },
    cache: {
      bookmarkOrder: {
        '0': [
          {
            key: '1',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '69',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ],
        '1': [
          {
            key: '2',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]
      }
    }
  })

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
    bookmarkOrderCache = require('../../../../../app/common/cache/bookmarkOrderCache')
    bookmarksState = require('../../../../../app/common/state/bookmarksState')
    syncActions = require('../../../../../js/actions/syncActions')
    bookmarkFoldersState = require('../../../../../app/common/state/bookmarkFoldersState')
  })

  after(function () {
    mockery.disable()
  })

  describe('getFolders', function () {
    it('return folders', function () {
      const newState = bookmarkFoldersState.getFolders(stateWithData)
      assert.deepEqual(newState.toJS(), stateWithData.get(STATE_SITES.BOOKMARK_FOLDERS).toJS())
    })
  })

  describe('getFolder', function () {
    it('null case', function () {
      const newState = bookmarkFoldersState.getFolder(stateWithData)
      assert.deepEqual(newState, Immutable.Map())
    })

    it('folder key is not found', function () {
      const newState = bookmarkFoldersState.getFolder(stateWithData, '100')
      assert.deepEqual(newState, Immutable.Map())
    })

    it('folder key is found', function () {
      const newState = bookmarkFoldersState.getFolder(stateWithData, '1')
      assert.deepEqual(newState.toJS(), stateWithData.getIn([STATE_SITES.BOOKMARK_FOLDERS, '1']).toJS())
    })
  })

  describe('getFoldersByParentId', function () {
    it('null case', function () {
      const newState = bookmarkFoldersState.getFoldersByParentId(stateWithData)
      assert.deepEqual(newState, Immutable.List())
    })

    it('parent folder is not found', function () {
      const newState = bookmarkFoldersState.getFoldersByParentId(stateWithData, '1000')
      assert.deepEqual(newState, Immutable.List())
    })

    it('parent folder is found, but dont have any items', function () {
      const newState = bookmarkFoldersState.getFoldersByParentId(stateWithData, '69')
      assert.deepEqual(newState, Immutable.List())
    })

    it('parent folder has child item', function () {
      const newState = bookmarkFoldersState.getFoldersByParentId(stateWithData, '1')
      assert.deepEqual(newState, Immutable.fromJS([
        {
          title: 'folder2',
          folderId: 2,
          key: '2',
          parentFolderId: 1,
          partitionNumber: 0,
          objectId: null,
          type: siteTags.BOOKMARK_FOLDER
        }
      ]))
    })
  })

  describe('addFolder', function () {
    let addFolderToCacheSpy
    before(function () {
      addFolderToCacheSpy = sinon.spy(bookmarkOrderCache, 'addFolderToCache')
    })

    afterEach(function () {
      addFolderToCacheSpy.reset()
    })

    after(function () {
      addFolderToCacheSpy.restore()
    })

    it('null case', function () {
      const newState = bookmarkFoldersState.addFolder(state)
      assert.deepEqual(newState.toJS(), state.toJS())
      assert(addFolderToCacheSpy.notCalled)
    })

    it('folder key is not provided', function () {
      const newState = bookmarkFoldersState.addFolder(stateWithData, {
        title: 'Brave'
      })
      assert.deepEqual(newState.toJS(), stateWithData.toJS())
      assert(addFolderToCacheSpy.notCalled)
    })

    it('folder key is provided', function () {
      const newState = bookmarkFoldersState.addFolder(state, {
        title: 'Brave',
        key: 10
      })
      const expectedState = state
        .setIn(['bookmarkFolders', '10'], Immutable.fromJS({
          title: 'Brave',
          key: '10'
        }))
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '10',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
      assert.deepEqual(newState.toJS(), expectedState.toJS())
      assert(addFolderToCacheSpy.calledOnce)
    })
  })

  describe('editFolder', function () {
    let addFolderToCacheSpy, removeCacheKeySpy

    const oldFolder = stateWithData.getIn(['bookmarkFolders', '1'])
    const editKey = '1'

    before(function () {
      addFolderToCacheSpy = sinon.spy(bookmarkOrderCache, 'addFolderToCache')
      removeCacheKeySpy = sinon.spy(bookmarkOrderCache, 'removeCacheKey')
    })

    afterEach(function () {
      addFolderToCacheSpy.reset()
      removeCacheKeySpy.reset()
    })

    after(function () {
      addFolderToCacheSpy.restore()
      removeCacheKeySpy.restore()
    })

    it('edit folder is missing', function () {
      const result = bookmarkFoldersState.editFolder(state)
      assert.deepEqual(result.toJS(), result.toJS())
      assert(addFolderToCacheSpy.notCalled)
      assert(removeCacheKeySpy.notCalled)
    })

    it('old parent id is not the same as provided one', function () {
      const result = bookmarkFoldersState.editFolder(stateWithData, editKey, oldFolder, Immutable.fromJS({
        title: 'New folder name',
        parentFolderId: 1
      }))
      const expectedState = stateWithData
        .setIn(['bookmarkFolders', editKey, 'parentFolderId'], 1)
        .setIn(['bookmarkFolders', editKey, 'title'], 'New folder name')
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '69',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
          {
            key: '2',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '1',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(addFolderToCacheSpy.calledOnce)
      assert(removeCacheKeySpy.calledOnce)
    })

    it('old parent id is the same as provided one', function () {
      const result = bookmarkFoldersState.editFolder(stateWithData, editKey, oldFolder, Immutable.fromJS({
        title: 'New folder name'
      }))
      const expectedState = stateWithData
        .setIn(['bookmarkFolders', editKey, 'title'], 'New folder name')
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(addFolderToCacheSpy.notCalled)
      assert(removeCacheKeySpy.notCalled)
    })
  })

  describe('removeFolder', function () {
    let removeBookmarksByParentIdSpy, removeCacheParentSpy, removeCacheKeySpy, removeFolderSpy, removeSitesSpy
    before(function () {
      removeCacheParentSpy = sinon.spy(bookmarkOrderCache, 'removeCacheParent')
      removeCacheKeySpy = sinon.spy(bookmarkOrderCache, 'removeCacheKey')
      removeBookmarksByParentIdSpy = sinon.spy(bookmarksState, 'removeBookmarksByParentId')
      removeFolderSpy = sinon.spy(bookmarkFoldersState, 'removeFolder')
      removeSitesSpy = sinon.spy(syncActions, 'removeSites')
    })

    afterEach(function () {
      removeCacheParentSpy.reset()
      removeCacheKeySpy.reset()
      removeBookmarksByParentIdSpy.reset()
      removeFolderSpy.reset()
      removeSitesSpy.reset()
    })

    after(function () {
      removeCacheParentSpy.restore()
      removeCacheKeySpy.restore()
      removeBookmarksByParentIdSpy.restore()
      removeFolderSpy.restore()
      removeSitesSpy.restore()
    })

    it('null case', function () {
      const result = bookmarkFoldersState.removeFolder(state)
      assert.deepEqual(result.toJS(), result.toJS())
    })

    it('check if sync is called when sync is enabled', function () {
      settingSyncEnabled = true
      bookmarkFoldersState.removeFolder(stateWithData, '69')
      assert(removeSitesSpy.calledOnce)
      settingSyncEnabled = false
    })

    it('with no child folders', function () {
      const result = bookmarkFoldersState.removeFolder(stateWithData, '69')
      const expectedState = stateWithData
        .deleteIn(['bookmarkFolders', '69'])
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '1',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheParentSpy.calledOnce)
      assert(removeCacheKeySpy.calledOnce)
      assert(removeBookmarksByParentIdSpy.calledOnce)
    })

    it('with one child folder', function () {
      const result = bookmarkFoldersState.removeFolder(stateWithData, '1')
      const expectedState = stateWithData
        .deleteIn(['bookmarkFolders', '1'])
        .deleteIn(['bookmarkFolders', '2'])
        .deleteIn(['cache', 'bookmarkOrder', '1'])
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '69',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheParentSpy.calledTwice)
      assert(removeCacheKeySpy.calledTwice)
      assert(removeBookmarksByParentIdSpy.calledTwice)
      // we call removeFolderSpy once on line 341 in this file and once in bookmarkFolderState
      assert(removeFolderSpy.calledTwice)
    })
  })

  describe('getFoldersWithoutKey', function () {
    let getFoldersWithoutKeySpy
    before(function () {
      getFoldersWithoutKeySpy = sinon.spy(bookmarkFoldersState, 'getFoldersWithoutKey')
    })

    afterEach(function () {
      getFoldersWithoutKeySpy.reset()
    })

    after(function () {
      getFoldersWithoutKeySpy.restore()
    })

    it('null case', function () {
      const result = bookmarkFoldersState.getFoldersWithoutKey(state)
      assert.deepEqual(result, [])
      assert(getFoldersWithoutKeySpy.calledOnce)
    })

    it('default parentId', function () {
      const result = bookmarkFoldersState.getFoldersWithoutKey(stateWithData, 1)
      assert.deepEqual(result, [
        {
          folderId: '69',
          label: 'folder69'
        }
      ])
      assert.equal(getFoldersWithoutKeySpy.callCount, 2)
    })

    it('multi level folders', function () {
      const result = bookmarkFoldersState.getFoldersWithoutKey(stateWithData, 69)
      assert.deepEqual(result, [
        {
          folderId: 1,
          label: 'folder1'
        },
        {
          folderId: 2,
          label: 'folder1 / folder2'
        }
      ])
      assert.equal(getFoldersWithoutKeySpy.callCount, 3)
    })

    it('custom label', function () {
      const result = bookmarkFoldersState.getFoldersWithoutKey(stateWithData, '2', 1, 'hi - ')
      assert.deepEqual(result, [{
        folderId: 2,
        label: 'hi - folder2'
      }])
      assert(getFoldersWithoutKeySpy.calledTwice)
    })
  })

  describe('moveFolder', function () {
    let addFolderToCacheSpy, removeCacheKeySpy, findBookmarkSpy

    const moveState = stateWithData
      .setIn(['bookmarkFolders', '70'], Immutable.fromJS({
        title: 'folder70',
        folderId: 70,
        key: '70',
        parentFolderId: 0,
        partitionNumber: 0,
        objectId: null,
        type: siteTags.BOOKMARK_FOLDER
      }))
      .set('bookmarks', Immutable.fromJS({
        'https://brave.com/|0|1': {
          favicon: undefined,
          title: 'Brave',
          location: 'https://brave.com/',
          key: 'https://brave.com/|0|1',
          parentFolderId: 1,
          partitionNumber: 0,
          objectId: null,
          themeColor: undefined,
          type: siteTags.BOOKMARK
        }
      }))
      .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
        {
          key: '1',
          order: 0,
          type: siteTags.BOOKMARK_FOLDER
        },
        {
          key: '69',
          order: 1,
          type: siteTags.BOOKMARK_FOLDER
        },
        {
          key: '70',
          order: 2,
          type: siteTags.BOOKMARK_FOLDER
        }
      ]))
      .setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
        {
          key: '2',
          order: 0,
          type: siteTags.BOOKMARK_FOLDER
        },
        {
          key: 'https://brave.com/|0|0',
          order: 1,
          type: siteTags.BOOKMARK
        }
      ]))
      .setIn(['cache', 'bookmarkLocation'], Immutable.fromJS({
        'https://brave.com/': [
          'https://brave.com/|0|1'
        ]
      }))

    before(function () {
      removeCacheKeySpy = sinon.spy(bookmarkOrderCache, 'removeCacheKey')
      addFolderToCacheSpy = sinon.spy(bookmarkOrderCache, 'addFolderToCache')
      findBookmarkSpy = sinon.spy(bookmarksState, 'findBookmark')
    })

    afterEach(function () {
      removeCacheKeySpy.reset()
      addFolderToCacheSpy.reset()
      findBookmarkSpy.reset()
    })

    after(function () {
      removeCacheKeySpy.restore()
      addFolderToCacheSpy.restore()
      findBookmarkSpy.restore()
    })

    it('null case', function () {
      const result = bookmarkFoldersState.moveFolder(state)
      assert.deepEqual(result.toJS(), state.toJS())
    })

    it('destination is not found', function () {
      const result = bookmarkFoldersState.moveFolder(moveState, '69')
      assert.deepEqual(result.toJS(), moveState.toJS())
    })

    it('destination is bookmark toolbar (destination key is 0)', function () {
      const result = bookmarkFoldersState.moveFolder(moveState, '2', 0)
      const expectedState = moveState
        .setIn(['bookmarkFolders', '2', 'parentFolderId'], 0)
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '1',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '69',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '70',
            order: 2,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '2',
            order: 3,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
          {
            key: 'https://brave.com/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          }
        ]))

      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
    })

    it('destination is other bookmarks (destination key is -1)', function () {
      const result = bookmarkFoldersState.moveFolder(moveState, '2', '-1')
      const expectedState = moveState
        .setIn(['bookmarkFolders', '2', 'parentFolderId'], -1)
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '1',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '69',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '70',
            order: 2,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
          {
            key: 'https://brave.com/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '-1'], Immutable.fromJS([
          {
            key: '2',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))

      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
    })

    it('folder is moved (destination is bookmark)', function () {
      const result = bookmarkFoldersState.moveFolder(moveState, '69', 'https://brave.com/|0|1')
      const expectedState = moveState
        .setIn(['bookmarkFolders', '69', 'parentFolderId'], 1)
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '1',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '70',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
          {
            key: '2',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: 'https://brave.com/|0|0',
            order: 1,
            type: siteTags.BOOKMARK
          },
          {
            key: '69',
            order: 2,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
    })

    it('folder is moved (destination is bookmark folder and parentID is the same)', function () {
      const result = bookmarkFoldersState.moveFolder(moveState, '69', '1', true, true)
      const expectedState = moveState
        .setIn(['bookmarkFolders', '69', 'parentFolderId'], 1)
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '1',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '70',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
          {
            key: '2',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: 'https://brave.com/|0|0',
            order: 1,
            type: siteTags.BOOKMARK
          },
          {
            key: '69',
            order: 2,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
    })

    it('destination parent ID is different then current parent ID', function () {
      const result = bookmarkFoldersState.moveFolder(moveState, '69', '2', false, false)
      const expectedState = moveState
        .setIn(['bookmarkFolders', '69', 'parentFolderId'], 1)
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '1',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '70',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '1'], Immutable.fromJS([
          {
            key: '2',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: 'https://brave.com/|0|0',
            order: 1,
            type: siteTags.BOOKMARK
          },
          {
            key: '69',
            order: 2,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
    })

    it('we want to move folder into the parent', function () {
      const result = bookmarkFoldersState.moveFolder(moveState, '69', '2', false, true)
      const expectedState = moveState
        .setIn(['bookmarkFolders', '69', 'parentFolderId'], 2)
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '1',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '70',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .setIn(['cache', 'bookmarkOrder', '2'], Immutable.fromJS([
          {
            key: '69',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(removeCacheKeySpy.calledOnce)
      assert(addFolderToCacheSpy.calledOnce)
      assert(findBookmarkSpy.calledOnce)
    })

    it('we have the same parent ID (destination and current)', function () {
      const result = bookmarkFoldersState.moveFolder(moveState, '70', '1')
      const expectedState = moveState
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '1',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '70',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '69',
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
      const result = bookmarkFoldersState.moveFolder(moveState, '69', '1', false)
      const expectedState = moveState
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '69',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '1',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          },
          {
            key: '70',
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
