/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')
const fakeElectron = require('../../../lib/fakeElectron')
const fakeAdBlock = require('../../../lib/fakeAdBlock')

const appConstants = require('../../../../../js/constants/appConstants')
const siteTags = require('../../../../../js/constants/siteTags')
const {STATE_SITES} = require('../../../../../js/constants/stateConstants')
require('../../../braveUnit')

describe('bookmarkFoldersReducer unit test', function () {
  let bookmarkFoldersReducer, bookmarkFoldersState

  const state = Immutable.fromJS({
    windows: [
      {
        windowId: 1,
        width: 80,
        bookmarksToolbar: {
          toolbar: [],
          other: []
        }
      }
    ],
    bookmarks: {},
    bookmarkFolders: {},
    cache: {
      bookmarkOrder: {}
    }
  })

  const stateWithData = Immutable.fromJS({
    windows: [
      {
        windowId: 1,
        width: 80,
        bookmarksToolbar: {
          toolbar: [],
          other: []
        }
      }
    ],
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
      '69': {
        title: 'folder69',
        folderId: 69,
        key: '69',
        parentFolderId: 0,
        partitionNumber: 0,
        objectId: null,
        type: siteTags.BOOKMARK_FOLDER
      },
      '80': {
        title: 'folder80',
        folderId: 80,
        key: '80',
        parentFolderId: 69,
        partitionNumber: 0,
        objectId: null,
        type: siteTags.BOOKMARK_FOLDER
      },
      '81': {
        title: 'folder80',
        folderId: 81,
        key: '81',
        parentFolderId: 1,
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
            key: '81',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          }
        ],
        '69': [
          {
            key: '80',
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
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    bookmarkFoldersReducer = require('../../../../../app/browser/reducers/bookmarkFoldersReducer')
    bookmarkFoldersState = require('../../../../../app/common/state/bookmarkFoldersState')
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_ADD_BOOKMARK_FOLDER', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(bookmarkFoldersState, 'addFolder')
      const newState = bookmarkFoldersReducer(state, {
        actionType: appConstants.APP_ADD_BOOKMARK_FOLDER
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(state, newState)
    })

    it('folder data is map (single folder)', function () {
      spy = sinon.spy(bookmarkFoldersState, 'addFolder')
      const newState = bookmarkFoldersReducer(state, {
        actionType: appConstants.APP_ADD_BOOKMARK_FOLDER,
        folderDetails: {
          title: 'folder1',
          parentFolderId: 0
        }
      })
      const expectedState = state
        .set('bookmarkFolders', Immutable.fromJS({
          '1': {
            title: 'folder1',
            folderId: 1,
            key: '1',
            parentFolderId: 0,
            partitionNumber: 0,
            skipSync: null,
            objectId: null,
            type: siteTags.BOOKMARK_FOLDER
          }
        }))
        .setIn(['cache', 'bookmarkOrder'], Immutable.fromJS({
          '0': [
            {
              key: '1',
              order: 0,
              type: siteTags.BOOKMARK_FOLDER
            }
          ]
        }))
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })

    it('folder data is list (multiple folders)', function () {
      spy = sinon.spy(bookmarkFoldersState, 'addFolder')
      const newState = bookmarkFoldersReducer(state, {
        actionType: appConstants.APP_ADD_BOOKMARK_FOLDER,
        folderDetails: [
          {
            title: 'folder1',
            parentFolderId: 0
          },
          {
            title: 'folder2',
            parentFolderId: 0
          },
          {
            title: 'folder3',
            parentFolderId: 0
          }
        ]
      })
      const expectedState = state
        .set(['bookmarkFolders'], Immutable.fromJS({
          '1': {
            title: 'folder1',
            folderId: 1,
            key: '1',
            parentFolderId: 0,
            partitionNumber: 0,
            skipSync: null,
            objectId: null,
            type: siteTags.BOOKMARK_FOLDER
          },
          '2': {
            title: 'folder2',
            folderId: 2,
            key: '2',
            parentFolderId: 0,
            partitionNumber: 0,
            skipSync: null,
            objectId: null,
            type: siteTags.BOOKMARK_FOLDER
          },
          '3': {
            title: 'folder3',
            folderId: 3,
            key: '3',
            parentFolderId: 0,
            partitionNumber: 0,
            skipSync: null,
            objectId: null,
            type: siteTags.BOOKMARK_FOLDER
          }
        }))
        .setIn(['cache', 'bookmarkOrder'], Immutable.fromJS({
          '0': [
            {
              key: '1',
              order: 0,
              type: siteTags.BOOKMARK_FOLDER
            },
            {
              key: '2',
              order: 1,
              type: siteTags.BOOKMARK_FOLDER
            },
            {
              key: '3',
              order: 2,
              type: siteTags.BOOKMARK_FOLDER
            }
          ]
        }))
      assert.equal(spy.callCount, 3)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('APP_EDIT_BOOKMARK_FOLDER', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(bookmarkFoldersState, 'editFolder')
      const newState = bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_EDIT_BOOKMARK_FOLDER
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(stateWithData, newState)
    })

    it('folder data is missing', function () {
      spy = sinon.spy(bookmarkFoldersState, 'editFolder')
      const newState = bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_EDIT_BOOKMARK_FOLDER,
        editKey: '1'
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(stateWithData, newState)
    })

    it('folder key is missing', function () {
      spy = sinon.spy(bookmarkFoldersState, 'editFolder')
      const newState = bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_EDIT_BOOKMARK_FOLDER,
        folderDetails: {
          title: 'folder1 new',
          parentFolderId: 0
        }
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(stateWithData, newState)
    })

    it('folder data is correct', function () {
      spy = sinon.spy(bookmarkFoldersState, 'editFolder')
      const newState = bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_EDIT_BOOKMARK_FOLDER,
        folderDetails: {
          title: 'folder1 new',
          parentFolderId: 0
        },
        editKey: '1'
      })
      const expectedState = stateWithData.setIn([STATE_SITES.BOOKMARK_FOLDERS, '1', 'title'], 'folder1 new')
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('APP_MOVE_BOOKMARK_FOLDER', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(bookmarkFoldersState, 'moveFolder')
      const newState = bookmarkFoldersReducer(state, {
        actionType: appConstants.APP_MOVE_BOOKMARK_FOLDER
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(state, newState)
    })

    it('check if move is working', function () {
      spy = sinon.spy(bookmarkFoldersState, 'moveFolder')
      const newState = bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_MOVE_BOOKMARK_FOLDER,
        folderKey: '1',
        destinationKey: '69',
        append: true
      })
      const expectedState = stateWithData
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
          }
        ]))
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('APP_REMOVE_BOOKMARK_FOLDER', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(bookmarkFoldersState, 'removeFolder')
      const newState = bookmarkFoldersReducer(state, {
        actionType: appConstants.APP_REMOVE_BOOKMARK_FOLDER
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(state, newState)
    })

    it('folder key is list (multiple folders)', function () {
      spy = sinon.spy(bookmarkFoldersState, 'removeFolder')
      const newState = bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_REMOVE_BOOKMARK_FOLDER,
        folderKey: [
          '1',
          '69'
        ]
      })
      assert.equal(spy.callCount, 4)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('folder key is map (single folder)', function () {
      spy = sinon.spy(bookmarkFoldersState, 'removeFolder')
      const newState = bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_REMOVE_BOOKMARK_FOLDER,
        folderKey: '1'
      })
      const expectedState = stateWithData
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: '69',
            order: 0,
            type: siteTags.BOOKMARK_FOLDER
          }
        ]))
        .deleteIn(['cache', 'bookmarkOrder', '1'])
        .deleteIn([STATE_SITES.BOOKMARK_FOLDERS, '1'])
        .deleteIn([STATE_SITES.BOOKMARK_FOLDERS, '81'])
      assert.equal(spy.calledTwice, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })
})
