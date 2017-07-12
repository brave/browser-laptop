/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')

const appConstants = require('../../../../../js/constants/appConstants')
const siteTags = require('../../../../../js/constants/siteTags')
require('../../../braveUnit')

describe('bookmarksReducer unit test', function () {
  let bookmarksReducer, bookmarksState, bookmarkLocationCache

  const state = Immutable.fromJS({
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
      'https://clifton.io/|0|0': {
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
    },
    bookmarkFolders: {},
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

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    bookmarksReducer = require('../../../../../app/browser/reducers/bookmarksReducer')
    bookmarksState = require('../../../../../app/common/state/bookmarksState')
    bookmarkLocationCache = require('../../../../../app/common/cache/bookmarkLocationCache')
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_SET_STATE', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('function is called', function () {
      spy = sinon.spy(bookmarkLocationCache, 'generateCache')
      const customState = stateWithData.setIn(['cache', 'bookmarkLocation'], Immutable.Map())
      const newState = bookmarksReducer(customState, {
        actionType: appConstants.APP_SET_STATE
      })
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), stateWithData.toJS())
    })
  })

  describe('APP_ADD_BOOKMARK', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(bookmarksState, 'addBookmark')
      const newState = bookmarksReducer(state, {
        actionType: appConstants.APP_ADD_BOOKMARK
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(state, newState)
    })

    it('bookmark data is map (single bookmark)', function () {
      spy = sinon.spy(bookmarksState, 'addBookmark')
      const newState = bookmarksReducer(state, {
        actionType: appConstants.APP_ADD_BOOKMARK,
        siteDetail: {
          title: 'Clifton',
          location: 'https://clifton.io/',
          parentId: 0
        }
      })
      const expectedState = state
        .set('bookmarks', Immutable.fromJS({
          'https://clifton.io/|0|0': {
            favicon: undefined,
            location: 'https://clifton.io/',
            parentFolderId: 0,
            partitionNumber: 0,
            objectId: null,
            themeColor: undefined,
            title: 'Clifton',
            type: siteTags.BOOKMARK,
            key: 'https://clifton.io/|0|0'
          }
        }))
        .setIn(['cache', 'bookmarkLocation'], Immutable.fromJS({
          'https://clifton.io/': [
            'https://clifton.io/|0|0'
          ]
        }))
        .setIn(['cache', 'bookmarkOrder'], Immutable.fromJS({
          '0': [
            {
              key: 'https://clifton.io/|0|0',
              order: 0,
              type: siteTags.BOOKMARK
            }
          ]
        }))
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })

    it('bookmark data is list (multiple bookmarks)', function () {
      spy = sinon.spy(bookmarksState, 'addBookmark')
      const newState = bookmarksReducer(state, {
        actionType: appConstants.APP_ADD_BOOKMARK,
        siteDetail: [
          {
            title: 'Clifton',
            location: 'https://clifton.io/',
            parentId: 0
          },
          {
            title: 'Bondy',
            location: 'https://brianbondy.com/',
            parentId: 0
          }
        ]
      })

      const expectedState = state
        .set('bookmarks', Immutable.fromJS({
          'https://clifton.io/|0|0': {
            favicon: undefined,
            location: 'https://clifton.io/',
            parentFolderId: 0,
            partitionNumber: 0,
            objectId: null,
            themeColor: undefined,
            title: 'Clifton',
            type: siteTags.BOOKMARK,
            key: 'https://clifton.io/|0|0'
          },
          'https://brianbondy.com/|0|0': {
            favicon: undefined,
            location: 'https://brianbondy.com/',
            parentFolderId: 0,
            partitionNumber: 0,
            objectId: null,
            themeColor: undefined,
            title: 'Bondy',
            type: siteTags.BOOKMARK,
            key: 'https://brianbondy.com/|0|0'
          }
        }))
        .setIn(['cache', 'bookmarkLocation'], Immutable.fromJS({
          'https://clifton.io/': [
            'https://clifton.io/|0|0'
          ],
          'https://brianbondy.com/': [
            'https://brianbondy.com/|0|0'
          ]
        }))
        .setIn(['cache', 'bookmarkOrder'], Immutable.fromJS({
          '0': [
            {
              key: 'https://clifton.io/|0|0',
              order: 0,
              type: siteTags.BOOKMARK
            },
            {
              key: 'https://brianbondy.com/|0|0',
              order: 1,
              type: siteTags.BOOKMARK
            }
          ]
        }))
      assert.equal(spy.callCount, 2)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('APP_EDIT_BOOKMARK', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(bookmarksState, 'editBookmark')
      const newState = bookmarksReducer(state, {
        actionType: appConstants.APP_EDIT_BOOKMARK
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(state, newState)
    })

    it('bookmark data is missing', function () {
      spy = sinon.spy(bookmarksState, 'editBookmark')
      const newState = bookmarksReducer(state, {
        actionType: appConstants.APP_EDIT_BOOKMARK,
        editKey: 'https://clifton.io|0|0'
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(state, newState)
    })

    it('bookmark key is missing', function () {
      spy = sinon.spy(bookmarksState, 'editBookmark')
      const newState = bookmarksReducer(state, {
        actionType: appConstants.APP_EDIT_BOOKMARK,
        siteDetail: {
          location: 'https://brianbondy.com/',
          title: 'Bondy'
        }
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(state, newState)
    })

    it('bookmark data is correct', function () {
      spy = sinon.spy(bookmarksState, 'editBookmark')
      const newState = bookmarksReducer(stateWithData, {
        actionType: appConstants.APP_EDIT_BOOKMARK,
        siteDetail: {
          title: 'Bondy'
        },
        editKey: 'https://clifton.io/|0|0'
      })
      const expectedState = stateWithData
        .setIn(['bookmarks', 'https://clifton.io/|0|0', 'title'], 'Bondy')
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('APP_MOVE_BOOKMARK', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(bookmarksState, 'moveBookmark')
      const newState = bookmarksReducer(state, {
        actionType: appConstants.APP_MOVE_BOOKMARK
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(state, newState)
    })

    it('data is correct', function () {
      spy = sinon.spy(bookmarksState, 'moveBookmark')
      const newState = bookmarksReducer(stateWithData, {
        actionType: appConstants.APP_MOVE_BOOKMARK,
        bookmarkKey: 'https://clifton.io/|0|0',
        destinationKey: 'https://brave.com/|0|0',
        append: false
      })
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
          }
        ]))
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('APP_REMOVE_BOOKMARK', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(bookmarksState, 'removeBookmark')
      const newState = bookmarksReducer(state, {
        actionType: appConstants.APP_REMOVE_BOOKMARK
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(state, newState)
    })

    it('check if delete is working', function () {
      spy = sinon.spy(bookmarksState, 'removeBookmark')
      const newState = bookmarksReducer(stateWithData, {
        actionType: appConstants.APP_REMOVE_BOOKMARK,
        bookmarkKey: 'https://clifton.io/|0|0'
      })
      const expectedState = stateWithData
        .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
          {
            key: 'https://brave.com/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          }
        ]))
        .deleteIn(['bookmarks', 'https://clifton.io/|0|0'])
        .deleteIn(['cache', 'bookmarkLocation', 'https://clifton.io/'])
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })
})
