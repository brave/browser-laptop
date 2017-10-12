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
  let bookmarkFoldersReducer, bookmarkFoldersState, bookmarkToolbarState

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

  const fakeTextCalc = {
    calcText: () => true,
    calcTextList: () => true
  }

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('../../browser/api/textCalc', fakeTextCalc)
    bookmarkFoldersReducer = require('../../../../../app/browser/reducers/bookmarkFoldersReducer')
    bookmarkFoldersState = require('../../../../../app/common/state/bookmarkFoldersState')
    bookmarkToolbarState = require('../../../../../app/common/state/bookmarkToolbarState')
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_ADD_BOOKMARK_FOLDER', function () {
    let spy, spyCalc

    afterEach(function () {
      spy.restore()
      spyCalc.restore()
    })

    it('null case', function () {
      spy = sinon.spy(bookmarkFoldersState, 'addFolder')
      spyCalc = sinon.spy(fakeTextCalc, 'calcText')
      const newState = bookmarkFoldersReducer(state, {
        actionType: appConstants.APP_ADD_BOOKMARK_FOLDER
      })
      assert.equal(spy.notCalled, true)
      assert.equal(spyCalc.notCalled, true)
      assert.deepEqual(state, newState)
    })

    it('folder data is map (single folder)', function () {
      spy = sinon.spy(bookmarkFoldersState, 'addFolder')
      spyCalc = sinon.spy(fakeTextCalc, 'calcText')
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
      assert.equal(spyCalc.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })

    it('folder data is list (multiple folders)', function () {
      spy = sinon.spy(bookmarkFoldersState, 'addFolder')
      spyCalc = sinon.spy(fakeTextCalc, 'calcTextList')
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
      assert.equal(spyCalc.callCount, 1)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('APP_EDIT_BOOKMARK_FOLDER', function () {
    let spy, spyCalc

    afterEach(function () {
      spy.restore()
      spyCalc.restore()
    })

    it('null case', function () {
      spy = sinon.spy(bookmarkFoldersState, 'editFolder')
      spyCalc = sinon.spy(fakeTextCalc, 'calcText')
      const newState = bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_EDIT_BOOKMARK_FOLDER
      })
      assert.equal(spy.notCalled, true)
      assert.equal(spyCalc.notCalled, true)
      assert.deepEqual(stateWithData, newState)
    })

    it('folder data is missing', function () {
      spy = sinon.spy(bookmarkFoldersState, 'editFolder')
      spyCalc = sinon.spy(fakeTextCalc, 'calcText')
      const newState = bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_EDIT_BOOKMARK_FOLDER,
        editKey: '1'
      })
      assert.equal(spy.notCalled, true)
      assert.equal(spyCalc.notCalled, true)
      assert.deepEqual(stateWithData, newState)
    })

    it('folder key is missing', function () {
      spy = sinon.spy(bookmarkFoldersState, 'editFolder')
      spyCalc = sinon.spy(fakeTextCalc, 'calcText')
      const newState = bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_EDIT_BOOKMARK_FOLDER,
        folderDetails: {
          title: 'folder1 new',
          parentFolderId: 0
        }
      })
      assert.equal(spy.notCalled, true)
      assert.equal(spyCalc.notCalled, true)
      assert.deepEqual(stateWithData, newState)
    })

    it('folder data is correct', function () {
      spy = sinon.spy(bookmarkFoldersState, 'editFolder')
      spyCalc = sinon.spy(fakeTextCalc, 'calcText')
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
      assert.equal(spyCalc.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('APP_MOVE_BOOKMARK_FOLDER', function () {
    let spy, spyToolbar

    afterEach(function () {
      spy.restore()
      spyToolbar.restore()
    })

    it('null case', function () {
      spy = sinon.spy(bookmarkFoldersState, 'moveFolder')
      spyToolbar = sinon.spy(bookmarkToolbarState, 'setToolbars')
      const newState = bookmarkFoldersReducer(state, {
        actionType: appConstants.APP_MOVE_BOOKMARK_FOLDER
      })
      assert.equal(spy.notCalled, true)
      assert.equal(spyToolbar.notCalled, true)
      assert.deepEqual(state, newState)
    })

    it('check if move is working', function () {
      spy = sinon.spy(bookmarkFoldersState, 'moveFolder')
      spyToolbar = sinon.spy(bookmarkToolbarState, 'setToolbars')
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
        .setIn(['windows', 0, 'bookmarksToolbar', 'toolbar'], Immutable.fromJS([
          '69',
          '1'
        ]))
      assert.equal(spy.calledOnce, true)
      assert.equal(spyToolbar.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })

    it('destination key is not on bookmark toolbar', function () {
      spyToolbar = sinon.spy(bookmarkToolbarState, 'setToolbars')
      bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_MOVE_BOOKMARK_FOLDER,
        folderKey: '1',
        destinationKey: '80'
      })
      assert.equal(spyToolbar.notCalled, true)
    })
  })

  describe('APP_REMOVE_BOOKMARK_FOLDER', function () {
    let spy, spyToolbar

    afterEach(function () {
      spy.restore()
      spyToolbar.restore()
    })

    it('null case', function () {
      spy = sinon.spy(bookmarkFoldersState, 'removeFolder')
      spyToolbar = sinon.spy(bookmarkToolbarState, 'setToolbars')
      const newState = bookmarkFoldersReducer(state, {
        actionType: appConstants.APP_REMOVE_BOOKMARK_FOLDER
      })
      assert.equal(spy.notCalled, true)
      assert.equal(spyToolbar.notCalled, true)
      assert.deepEqual(state, newState)
    })

    it('folder key is list (multiple folders)', function () {
      spy = sinon.spy(bookmarkFoldersState, 'removeFolder')
      spyToolbar = sinon.spy(bookmarkToolbarState, 'setToolbars')
      const newState = bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_REMOVE_BOOKMARK_FOLDER,
        folderKey: [
          '1',
          '69'
        ]
      })
      assert.equal(spy.callCount, 3)
      assert.equal(spyToolbar.calledOnce, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('folder key is map (single folder)', function () {
      spy = sinon.spy(bookmarkFoldersState, 'removeFolder')
      spyToolbar = sinon.spy(bookmarkToolbarState, 'setToolbars')
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
        .deleteIn([STATE_SITES.BOOKMARK_FOLDERS, '1'])
        .setIn(['windows', 0, 'bookmarksToolbar', 'toolbar'], Immutable.fromJS([
          '69'
        ]))
      assert.equal(spy.calledOnce, true)
      assert.equal(spyToolbar.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('APP_ON_BOOKMARK_FOLDER_WIDTH_CHANGED', function () {
    let spy, spyToolbar

    afterEach(function () {
      spy.restore()
      spyToolbar.restore()
    })

    it('null case', function () {
      spy = sinon.spy(bookmarkFoldersState, 'setWidth')
      spyToolbar = sinon.spy(bookmarkToolbarState, 'setToolbars')
      const newState = bookmarkFoldersReducer(state, {
        actionType: appConstants.APP_ON_BOOKMARK_FOLDER_WIDTH_CHANGED
      })
      assert.equal(spy.notCalled, true)
      assert.equal(spyToolbar.notCalled, true)
      assert.deepEqual(state, newState)
    })

    it('we update multiple items', function () {
      spy = sinon.spy(bookmarkFoldersState, 'setWidth')
      spyToolbar = sinon.spy(bookmarkToolbarState, 'setToolbars')
      const newState = bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_ON_BOOKMARK_FOLDER_WIDTH_CHANGED,
        folderList: Immutable.fromJS([
          {
            key: '1',
            width: 10,
            parentFolderId: 0
          },
          {
            key: '69',
            width: 15,
            parentFolderId: 0
          },
          {
            key: '80',
            width: 20,
            parentFolderId: 69
          }
        ])
      })
      assert.equal(spy.callCount, 3)
      assert.equal(spyToolbar.calledOnce, true)
      const expectedState = stateWithData
        .setIn([STATE_SITES.BOOKMARK_FOLDERS, '1', 'width'], 10)
        .setIn([STATE_SITES.BOOKMARK_FOLDERS, '69', 'width'], 15)
        .setIn([STATE_SITES.BOOKMARK_FOLDERS, '80', 'width'], 20)
        .setIn(['windows', 0, 'bookmarksToolbar', 'toolbar'], Immutable.fromJS([
          '1'
        ]))
        .setIn(['windows', 0, 'bookmarksToolbar', 'other'], Immutable.fromJS([
          '69'
        ]))
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })

    it('we update one and dont trigger toolbar update (parentFolderId is not 0)', function () {
      spy = sinon.spy(bookmarkFoldersState, 'setWidth')
      spyToolbar = sinon.spy(bookmarkToolbarState, 'setToolbars')
      const newState = bookmarkFoldersReducer(stateWithData, {
        actionType: appConstants.APP_ON_BOOKMARK_FOLDER_WIDTH_CHANGED,
        folderList: Immutable.fromJS([
          {
            key: '80',
            width: 20,
            parentFolderId: 69
          }
        ])
      })
      assert.equal(spy.callCount, 1)
      assert.equal(spyToolbar.notCalled, true)
      const expectedState = stateWithData
        .setIn([STATE_SITES.BOOKMARK_FOLDERS, '80', 'width'], 20)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })
})
