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
require('../../../braveUnit')

describe('bookmarksReducer unit test', function () {
  let bookmarksReducer, bookmarksState, bookmarkLocationCache

  const state = Immutable.fromJS({
    windows: [
      {
        windowId: 1,
        width: 100
      }
    ],
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
    windows: [
      {
        windowId: 1,
        width: 100
      }
    ],
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
      },
      'https://brianbondy.com/|0|1': {
        favicon: undefined,
        title: 'Clifton',
        location: 'https://brianbondy.com/',
        key: 'https://brianbondy.com/|0|1',
        parentFolderId: 1,
        partitionNumber: 0,
        objectId: null,
        themeColor: undefined,
        type: siteTags.BOOKMARK
      },
      'https://test.com/|0|2': {
        favicon: undefined,
        title: 'Clifton',
        location: 'https://test.com/',
        key: 'https://test.com/|0|2',
        parentFolderId: 2,
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
        ],
        '1': [
          {
            key: 'https://brianbondy.com/|0|1',
            order: 0,
            type: siteTags.BOOKMARK
          }
        ],
        '2': [
          {
            key: 'https://test.com/|0|2',
            order: 0,
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
        ],
        'https://brianbondy.com/': [
          'https://brianbondy.com/|0|1'
        ],
        'https://test.com/': [
          'https://test.com/|0|2'
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
            skipSync: null,
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
            skipSync: null,
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
            skipSync: null,
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

    it('add a bookmark with a close bookmark prepending', function () {
      const newState = state.set('bookmarks', Immutable.fromJS({
        'https://www.clifton.io|0|0': {
          lastAccessedTime: 0,
          objectId: null,
          title: 'Brave',
          location: 'https://www.brave.com',
          parentFolderId: 0
        },
        'https://www.bbondy.io|0|0': {
          lastAccessedTime: 0,
          objectId: null,
          title: 'Brave',
          location: 'https://www.bbondy.io',
          parentFolderId: 0
        },
        'https://www.bridiver.io|0|0': {
          lastAccessedTime: 0,
          objectId: null,
          title: 'Brave',
          location: 'https://www.bridiver.io',
          parentFolderId: 0
        }
      }))
      .setIn(['cache', 'bookmarkOrder', '0'], Immutable.fromJS([
        {
          key: 'https://clifton.io/|0|0',
          order: 0,
          type: siteTags.BOOKMARK
        },
        {
          key: 'https://www.bbondy.io|0|0',
          order: 1,
          type: siteTags.BOOKMARK
        },
        {
          key: 'https://www.bridiver.io|0|0',
          order: 2,
          type: siteTags.BOOKMARK
        }
      ]))
      const action = {
        actionType: appConstants.APP_ADD_BOOKMARK,
        siteDetail: Immutable.fromJS({
          parentFolderId: 0,
          title: 'Brave',
          location: 'https://www.brave.com'
        }),
        tag: siteTags.BOOKMARK,
        closestKey: 'https://www.bbondy.io|0|0',
        isLeftSide: true
      }

      const newBookmarks = {
        'https://www.clifton.io|0|0': {
          lastAccessedTime: 0,
          objectId: null,
          title: 'Brave',
          location: 'https://www.brave.com',
          parentFolderId: 0
        },
        'https://www.bbondy.io|0|0': {
          lastAccessedTime: 0,
          objectId: null,
          title: 'Brave',
          location: 'https://www.bbondy.io',
          parentFolderId: 0
        },
        'https://www.brave.com|0|0': {
          favicon: undefined,
          key: 'https://www.brave.com|0|0',
          objectId: null,
          title: 'Brave',
          location: 'https://www.brave.com',
          parentFolderId: 0,
          partitionNumber: 0,
          skipSync: null,
          themeColor: undefined,
          type: 'bookmark'
        },
        'https://www.bridiver.io|0|0': {
          lastAccessedTime: 0,
          objectId: null,
          title: 'Brave',
          location: 'https://www.bridiver.io',
          parentFolderId: 0
        }
      }

      const newBookmarksOrder = [
        {
          key: 'https://clifton.io/|0|0',
          order: 0,
          type: siteTags.BOOKMARK
        },
        {
          key: 'https://www.brave.com|0|0',
          order: 1,
          type: siteTags.BOOKMARK
        },
        {
          key: 'https://www.bbondy.io|0|0',
          order: 2,
          type: siteTags.BOOKMARK
        },
        {
          key: 'https://www.bridiver.io|0|0',
          order: 3,
          type: siteTags.BOOKMARK
        }]
      const result = bookmarksReducer(newState, action)
      assert.deepEqual(result.get('bookmarks').toJS(), newBookmarks)
      assert.deepEqual(result.getIn(['cache', 'bookmarkOrder', '0']).toJS(), newBookmarksOrder)
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
