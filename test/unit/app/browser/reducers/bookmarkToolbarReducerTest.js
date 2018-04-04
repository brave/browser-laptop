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

describe('bookmarkToolbarReducer unit test', function () {
  let bookmarkToolbarReducer

  const fakeTextCalc = {
    calcTextList: () => true
  }

  const fakeAppAction = {
    addBookmark: () => {},
    moveBookmarkFolder: () => {},
    moveBookmark: () => {}
  }

  const stateWithData = Immutable.fromJS({
    windows: [],
    bookmarks: {
      'https://brave.com/|0|0': {
        favicon: undefined,
        title: 'Brave',
        location: 'https://brave.com/',
        key: 'https://brave.com/|0|0',
        parentFolderId: 0,
        partitionNumber: 0,
        objectId: null,
        themeColor: undefined,
        type: siteTags.BOOKMARK
      },
      'https://brianbondy.com/|0|1': {
        favicon: undefined,
        title: 'Clifton',
        location: 'https://clifton.io/',
        key: 'https://clifton.io/|0|1',
        parentFolderId: 1,
        partitionNumber: 0,
        objectId: null,
        themeColor: undefined,
        type: siteTags.BOOKMARK
      }
    },
    bookmarkFolders: {
      '1': {
        title: 'folder1',
        folderId: 1,
        key: '1',
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
            key: 'https://brave.com/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: '1',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ],
        '1': [
          {
            key: 'https://brianbondy.com/|0|1',
            order: 0,
            type: siteTags.BOOKMARK
          }
        ]
      },
      bookmarkLocation: {
        'https://brave.com/': [
          'https://brave.com/|0|0'
        ],
        'https://brianbondy.com/': [
          'https://brianbondy.com/|0|1'
        ]
      }
    },
    historySites: {},
    tabs: []
  })

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('../../browser/api/textCalc', fakeTextCalc)
    mockery.registerMock('../../../js/actions/appActions', fakeAppAction)
    bookmarkToolbarReducer = require('../../../../../app/browser/reducers/bookmarkToolbarReducer')
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_SET_STATE', function () {
    let spyCalc

    afterEach(function () {
      spyCalc.restore()
    })

    it('we are upgrading from version 0.20 to 0.21', function () {
      spyCalc = sinon.spy(fakeTextCalc, 'calcTextList')
      bookmarkToolbarReducer(stateWithData, {
        actionType: appConstants.APP_SET_STATE
      })
      assert.equal(spyCalc.callCount, 1)
    })

    it('we are on version 0.21', function () {
      spyCalc = sinon.spy(fakeTextCalc, 'calcTextList')
      const newState = stateWithData
        .setIn([STATE_SITES.BOOKMARKS, 'https://brave.com/|0|0', 'width'], 10)
        .setIn([STATE_SITES.BOOKMARKS, 'https://brianbondy.com/|0|1', 'width'], 10)
        .setIn([STATE_SITES.BOOKMARK_FOLDERS, '1', 'width'], 10)
      bookmarkToolbarReducer(newState, {
        actionType: appConstants.APP_SET_STATE
      })
      assert.equal(spyCalc.notCalled, true)
    })
  })
  describe('APP_ON_DROP_BOOKMARK', function () {
    let bookmark = Immutable.fromJS({
      actionType: appConstants.APP_ON_DROP_BOOKMARK,
      bookmark: {
        location: 'https://brazilian-ameri-do-te-karate.com',
        type: 'bookmark'
      }
    })

    describe('when bookmark is dropped from urlbar', function () {
      let fakeAddBookmark

      afterEach(function () {
        fakeAddBookmark.restore()
      })

      it('if dropped inside a folder sets the parentFolderId as droppedOnKey', function () {
        fakeAddBookmark = sinon.spy(fakeAppAction, 'addBookmark')

        const droppedBookmark = bookmark.merge(Immutable.fromJS({
          isFolder: true,
          isDroppedOn: true,
          droppedOnKey: 11
        }))

        bookmarkToolbarReducer(stateWithData, droppedBookmark)
        // assert that addBookmark was called
        assert.equal(fakeAddBookmark.calledOnce, true)
        // assert that parentFolderId is the same as original key where it was dropped
        assert.equal(
          fakeAddBookmark.args[0][0].get('parentFolderId'),
          droppedBookmark.get('droppedOnKey')
        )
      })

      it('if NOT dropped inside a folder sets it in the toolbar (parentFolderId is null)', function () {
        fakeAddBookmark = sinon.spy(fakeAppAction, 'addBookmark')

        const droppedBookmark = bookmark.merge(Immutable.fromJS({
          isFolder: false,
          isDroppedOn: true
        }))

        bookmarkToolbarReducer(stateWithData, droppedBookmark)
        // assert that addBookmark was called
        assert.equal(fakeAddBookmark.calledOnce, true)
        // assert that parentFolderId is null
        assert.equal(fakeAddBookmark.args[0][0].get('parentFolderId'), null)
      })
    })

    describe('when bookmark already exists', function () {
      let fakeMoveBookmarkFolder
      let fakeMoveBookmark

      afterEach(function () {

      })

      it('calls moveBookmark if it is a bookmark', function () {
        fakeMoveBookmark = sinon.spy(fakeAppAction, 'moveBookmark')

        const droppedBookmark = bookmark
          .merge(Immutable.fromJS({
            isRightSide: true,
            isDroppedOn: true,
            droppedOnKey: 'https://some-other-karate-bookmark.com/|0|0'
          }))
          .mergeIn(['bookmark'], Immutable.fromJS({
            key: 123123123,
            type: 'bookmark'
          }))

        bookmarkToolbarReducer(stateWithData, droppedBookmark)
        assert.equal(fakeMoveBookmark.calledOnce, true)
        fakeMoveBookmark.restore()
      })

      it('calls moveBookmarkFolder if it is a bookmark folder', function () {
        fakeMoveBookmarkFolder = sinon.spy(fakeAppAction, 'moveBookmarkFolder')

        const droppedBookmark = bookmark
          .merge(Immutable.fromJS({
            isRightSide: true,
            isDroppedOn: false,
            droppedOnKey: 'https://yet-another-karate-bookmark.com/|0|0'
          }))
          .mergeIn(['bookmark'], Immutable.fromJS({
            key: 123123123,
            type: 'bookmark-folder'
          }))

        bookmarkToolbarReducer(stateWithData, droppedBookmark)
        assert.equal(fakeMoveBookmarkFolder.calledOnce, true)
        fakeMoveBookmarkFolder.restore()
      })
    })
  })
})
