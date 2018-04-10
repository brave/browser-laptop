/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, beforeEach, after, afterEach */
const assert = require('assert')
const mockery = require('mockery')
const Immutable = require('immutable')
const {makeImmutable} = require('../../../../../app/common/state/immutableUtil')
const {bookmarksToolbarMode} = require('../../../../../app/common/constants/settingsEnums')
const dragTypes = require('../../../../../js/constants/dragTypes')
const siteTags = require('../../../../../js/constants/siteTags')
const tabState = require('../../../../../app/common/state/tabState')
const sinon = require('sinon')

require('../../../braveUnit')

describe('bookmarkUtil unit test', function () {
  let bookmarkUtil, settingDefaultValue

  const state = Immutable.fromJS({
    windows: [],
    bookmarks: {},
    bookmarkFolders: {},
    cache: {
      bookmarkOrder: {},
      bookmarkLocation: {}
    },
    historySites: {},
    tabs: [],
    tabsInternal: {}
  })

  const stateWithData = Immutable.fromJS({
    windows: [{
      windowId: 1,
      windowUUID: 'uuid',
      focused: true
    }],
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
    tabs: [{
      index: 0,
      tabId: 1,
      windowId: 1,
      windowUUID: 'uuid',
      url: 'https://brave.com/',
      title: 'Brave',
      active: true,
      bookmarked: false,
      frame: {
        partitionNumber: 2,
        icon: 'ico',
        themeColor: '#FFF'
      }
    }],
    tabsInternal: {
      index: {
        1: 0
      },
      displayIndex: {
        1: {
          0: 1
        }
      }
    }
  })

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../state/tabState', tabState)
    mockery.registerMock('../../../js/settings', {
      getSetting: () => {
        return settingDefaultValue
      }
    })
    bookmarkUtil = require('../../../../../app/common/lib/bookmarkUtil')
  })

  after(function () {
    mockery.disable()
  })

  describe('bookmarkHangerHeading', function () {
    it('returns default if isFolder and editKey are not provided', function () {
      assert.equal(bookmarkUtil.bookmarkHangerHeading(), 'bookmarkCreateNew')
    })

    it('if bookmark was newly added', function () {
      assert.equal(bookmarkUtil.bookmarkHangerHeading(false, true), 'bookmarkAdded')
    })

    describe('is bookmark', function () {
      it('returns create mode when not in edit mode', function () {
        assert.equal(bookmarkUtil.bookmarkHangerHeading(false), 'bookmarkCreateNew')
      })

      it('returns edit mode when in edit mode', function () {
        assert.equal(bookmarkUtil.bookmarkHangerHeading(true), 'bookmarkEdit')
      })
    })
  })

  describe('isBookmarkNameValid', function () {
    it('location is not provided', function () {
      assert.equal(bookmarkUtil.isBookmarkNameValid(), false)
    })

    it('location is null', function () {
      assert.equal(bookmarkUtil.isBookmarkNameValid(null), false)
    })

    it('location is empty string', function () {
      assert.equal(bookmarkUtil.isBookmarkNameValid(''), false)
    })

    it('location is provided', function () {
      assert.equal(bookmarkUtil.isBookmarkNameValid('https://www.brave.com'), true)
    })
  })

  describe('showOnlyFavicon', function () {
    it('BOOKMARKS_TOOLBAR_MODE is FAVICONS_ONLY', function () {
      settingDefaultValue = bookmarksToolbarMode.FAVICONS_ONLY
      const result = bookmarkUtil.showOnlyFavicon()
      assert.equal(result, true)
    })

    it('BOOKMARKS_TOOLBAR_MODE is not FAVICONS_ONLY', function () {
      settingDefaultValue = bookmarksToolbarMode.TEXT_ONLY
      const result = bookmarkUtil.showOnlyFavicon()
      assert.equal(result, false)
    })
  })

  describe('showFavicon', function () {
    it('BOOKMARKS_TOOLBAR_MODE is FAVICONS_ONLY', function () {
      settingDefaultValue = bookmarksToolbarMode.FAVICONS_ONLY
      const result = bookmarkUtil.showFavicon()
      assert.equal(result, true)
    })

    it('BOOKMARKS_TOOLBAR_MODE is TEXT_AND_FAVICONS', function () {
      settingDefaultValue = bookmarksToolbarMode.TEXT_AND_FAVICONS
      const result = bookmarkUtil.showFavicon()
      assert.equal(result, true)
    })

    it('BOOKMARKS_TOOLBAR_MODE is not TEXT_AND_FAVICONS nor FAVICONS_ONLY', function () {
      settingDefaultValue = bookmarksToolbarMode.TEXT_ONLY
      const result = bookmarkUtil.showFavicon()
      assert.equal(result, false)
    })
  })

  describe('showOnlyText', function () {
    it('BOOKMARKS_TOOLBAR_MODE is TEXT_ONLY', function () {
      settingDefaultValue = bookmarksToolbarMode.TEXT_ONLY
      const result = bookmarkUtil.showOnlyText()
      assert.equal(result, true)
    })

    it('BOOKMARKS_TOOLBAR_MODE is not TEXT_ONLY', function () {
      settingDefaultValue = bookmarksToolbarMode.FAVICONS_ONLY
      const result = bookmarkUtil.showOnlyText()
      assert.equal(result, false)
    })
  })

  describe('showTextAndFavicon', function () {
    it('BOOKMARKS_TOOLBAR_MODE is TEXT_AND_FAVICONS', function () {
      settingDefaultValue = bookmarksToolbarMode.TEXT_AND_FAVICONS
      const result = bookmarkUtil.showTextAndFavicon()
      assert.equal(result, true)
    })

    it('BOOKMARKS_TOOLBAR_MODE is not TEXT_AND_FAVICONS', function () {
      settingDefaultValue = bookmarksToolbarMode.TEXT_ONLY
      const result = bookmarkUtil.showTextAndFavicon()
      assert.equal(result, false)
    })
  })

  describe('getDNDBookmarkData', function () {
    it('dragOverData is missing', function () {
      const state = makeImmutable({
        dragData: {}
      })
      const result = bookmarkUtil.getDNDBookmarkData(state, null)
      assert.deepEqual(result, Immutable.Map())
    })

    it('draggingOverType is BOOKMARK, but draggingOverKey is missing', function () {
      const state = makeImmutable({
        dragData: {
          dragOverData: {
            draggingOverType: dragTypes.BOOKMARK
          }
        }
      })
      const result = bookmarkUtil.getDNDBookmarkData(state, null)
      assert.deepEqual(result, Immutable.Map())
    })

    it('draggingOverType is TAB', function () {
      const state = makeImmutable({
        dragData: {
          dragOverData: {
            draggingOverType: dragTypes.TAB
          }
        }
      })
      const result = bookmarkUtil.getDNDBookmarkData(state, null)
      assert.deepEqual(result, Immutable.Map())
    })

    it('draggingOverType is BOOKMARK and bookmark is the same', function () {
      const state = makeImmutable({
        dragData: {
          dragOverData: {
            draggingOverType: dragTypes.BOOKMARK,
            draggingOverKey: 'https://brave.com|0|0'
          }
        }
      })
      const bookmark = 'https://brave.com|0|0'
      const result = bookmarkUtil.getDNDBookmarkData(state, bookmark)
      assert.deepEqual(result, state.getIn(['dragData', 'dragOverData']))
    })

    it('draggingOverType is BOOKMARK and bookmark is different', function () {
      const state = makeImmutable({
        dragData: {
          dragOverData: {
            draggingOverType: dragTypes.BOOKMARK,
            draggingOverKey: 'https://brave.com|0|0'
          }
        }
      })
      const bookmark = 'https://clifton.io|0|0'
      const result = bookmarkUtil.getDNDBookmarkData(state, bookmark)
      assert.deepEqual(result, Immutable.Map())
    })
  })

  describe('getDetailFromFrame', function () {
    it('null check', function () {
      const siteDetail = bookmarkUtil.getDetailFromFrame()
      assert.equal(siteDetail, null)
    })

    it('returns an Immutable object with all expected properties', function () {
      const frame = Immutable.fromJS({
        location: 'https://brave.com',
        title: 'test123',
        partitionNumber: 8,
        type: siteTags.BOOKMARK,
        favicon: 'https://brave.comfavicon.ico'
      })
      const siteDetail = bookmarkUtil.getDetailFromFrame(frame)
      assert.equal(siteDetail.get('location'), frame.get('location'))
      assert.equal(siteDetail.get('title'), frame.get('title'))
      assert.equal(siteDetail.get('partitionNumber'), frame.get('partitionNumber'))
      assert.equal(siteDetail.get('icon'), frame.get('icon'))
    })
  })

  describe('isLocationBookmarked', function () {
    it('null case', function () {
      const result = bookmarkUtil.isLocationBookmarked(stateWithData)
      assert.equal(result, false)
    })

    it('cache key is not found', function () {
      const result = bookmarkUtil.isLocationBookmarked(stateWithData, 'https://brianbondy.com')
      assert.equal(result, false)
    })

    it('cache key is found', function () {
      const result = bookmarkUtil.isLocationBookmarked(stateWithData, 'https://clifton.io/')
      assert.equal(result, true)
    })
  })

  describe('toCreateProperties', function () {
    it('null check', function () {
      const result = bookmarkUtil.toCreateProperties()
      assert.equal(result, null)
    })

    it('returns a plain javascript object with location and partitionNumber', function () {
      const siteDetail = Immutable.fromJS({
        location: 'https://brave.com',
        partitionNumber: 5
      })
      const result = bookmarkUtil.toCreateProperties(siteDetail)
      assert.equal(result.url, siteDetail.get('location'))
      assert.equal(result.partitionNumber, siteDetail.get('partitionNumber'))
    })
  })

  describe('isBookmark', function () {
    it('null check', function () {
      const valid = bookmarkUtil.isBookmark()
      assert.equal(valid, false)
    })

    it('type is bookmark', function () {
      const valid = bookmarkUtil.isBookmark(Immutable.fromJS({type: siteTags.BOOKMARK}))
      assert.equal(valid, true)
    })

    it('type is bookmark folder', function () {
      const valid = bookmarkUtil.isBookmark(Immutable.fromJS({type: siteTags.BOOKMARK_FOLDER}))
      assert.equal(valid, false)
    })
  })

  describe('updateTabBookmarked', function () {
    let spy

    beforeEach(function () {
      spy = sinon.spy(tabState, 'updateTabValue')
    })

    afterEach(function () {
      spy.restore()
    })

    it('null check', function () {
      const newState = bookmarkUtil.updateTabBookmarked(state)
      assert.deepEqual(state.toJS(), newState.toJS())
    })

    it('tab is updated', function () {
      bookmarkUtil.updateTabBookmarked(stateWithData, Immutable.fromJS({
        index: 0,
        tabId: 1,
        windowId: 1,
        windowUUID: 'uuid',
        url: 'https://brave.com/',
        title: 'Brave',
        active: true,
        bookmarked: false
      }))
      assert.equal(spy.calledOnce, true)
    })
  })

  describe('updateActiveTabBookmarked', function () {
    let spy

    beforeEach(function () {
      spy = sinon.spy(bookmarkUtil, 'updateTabBookmarked')
    })

    afterEach(function () {
      spy.restore()
    })

    it('null check', function () {
      const newState = bookmarkUtil.updateActiveTabBookmarked(state)
      assert.deepEqual(state.toJS(), newState.toJS())
    })

    it('check if updateTabBookmarked is called', function () {
      bookmarkUtil.updateActiveTabBookmarked(stateWithData)
      assert.equal(spy.calledOnce, true)
    })
  })

  describe('getKey', function () {
    const testUrl1 = 'https://brave.com'

    it('returns key if location and partitionNumber match', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1,
        partitionNumber: 0
      })
      const key = bookmarkUtil.getKey(siteDetail)
      assert.equal(key, testUrl1 + '|0|0')
    })

    it('returns key if location matches and partitionNumber is NOT present', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1
      })
      const key = bookmarkUtil.getKey(siteDetail)
      assert.equal(key, testUrl1 + '|0|0')
    })

    it('returns null if location is missing', function () {
      const siteDetail = new Immutable.Map()
      const key = bookmarkUtil.getKey(siteDetail)
      assert.equal(key, null)
    })

    describe('prevent collision', function () {
      it('partition number', function () {
        const siteA = Immutable.fromJS({
          location: testUrl1 + '1',
          partitionNumber: 0
        })
        const siteB = Immutable.fromJS({
          location: testUrl1,
          partitionNumber: 10
        })
        const keyA = bookmarkUtil.getKey(siteA)
        const keyB = bookmarkUtil.getKey(siteB)
        assert.notEqual(keyA, keyB)
      })

      it('parent folder id', function () {
        const siteA = Immutable.fromJS({
          location: testUrl1 + '1',
          partitionNumber: 0,
          parentFolderId: 0
        })
        const siteB = Immutable.fromJS({
          location: testUrl1,
          partitionNumber: 10,
          parentFolderId: 0
        })
        const keyA = bookmarkUtil.getKey(siteA)
        const keyB = bookmarkUtil.getKey(siteB)
        assert.notEqual(keyA, keyB)
      })
    })
  })

  describe('buildBookmark', function () {
    it('use only defaults', function () {
      const bookmark = Immutable.fromJS({
        title: 'Brave',
        location: 'https://brave.com'
      })

      const expectedResult = {
        title: 'Brave',
        location: 'https://brave.com',
        parentFolderId: 0,
        partitionNumber: 0,
        objectId: null,
        favicon: undefined,
        themeColor: undefined,
        type: siteTags.BOOKMARK,
        key: 'https://brave.com|0|0',
        skipSync: null
      }

      assert.deepEqual(bookmarkUtil.buildBookmark(state, bookmark).toJS(), expectedResult)
    })

    it('bookmark data is in history', function () {
      const newState = state
        .setIn(['historySites', 'https://brave.com|0'], Immutable.fromJS({
          partitionNumber: 1,
          favicon: 'icon',
          themeColor: '#000'
        }))

      const bookmark = Immutable.fromJS({
        title: 'Brave',
        location: 'https://brave.com'
      })

      const expectedResult = {
        title: 'Brave',
        location: 'https://brave.com',
        parentFolderId: 0,
        partitionNumber: 1,
        objectId: null,
        favicon: 'icon',
        themeColor: '#000',
        type: siteTags.BOOKMARK,
        key: 'https://brave.com|0|0',
        skipSync: null
      }

      assert.deepEqual(bookmarkUtil.buildBookmark(newState, bookmark).toJS(), expectedResult)
    })

    it('bookmark data is in active tab', function () {
      const bookmark = Immutable.fromJS({
        title: 'Brave',
        location: 'https://brave.com/'
      })

      const expectedResult = {
        title: 'Brave',
        location: 'https://brave.com/',
        parentFolderId: 0,
        partitionNumber: 2,
        objectId: null,
        favicon: 'ico',
        themeColor: '#FFF',
        type: siteTags.BOOKMARK,
        key: 'https://brave.com/|0|0',
        skipSync: null
      }

      assert.deepEqual(bookmarkUtil.buildBookmark(stateWithData, bookmark).toJS(), expectedResult)
    })

    it('bookmark data is in topSites', function () {
      const bookmark = Immutable.fromJS({
        title: 'Brave',
        location: 'https://www.facebook.com/BraveSoftware/'
      })

      const expectedResult = {
        title: 'Brave',
        location: 'https://www.facebook.com/BraveSoftware/',
        parentFolderId: 0,
        partitionNumber: 0,
        objectId: null,
        favicon: 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/img/newtab/defaultTopSitesIcon/facebook.png',
        themeColor: 'rgb(59, 89, 152)',
        type: siteTags.BOOKMARK,
        key: 'https://www.facebook.com/BraveSoftware/|0|0',
        skipSync: null
      }

      assert.deepEqual(bookmarkUtil.buildBookmark(stateWithData, bookmark).toJS(), expectedResult)
    })
  })

  describe('buildEditBookmark', function () {
    it('bookmarkDetail is null', function () {
      const bookmark = Immutable.fromJS({
        title: 'Brave',
        type: siteTags.BOOKMARK
      })
      assert.deepEqual(bookmarkUtil.buildEditBookmark(bookmark).toJS(), bookmark.toJS())
    })

    it('old and new are merged, but key is the same', function () {
      const oldBookmark = Immutable.fromJS({
        title: 'Brave',
        location: 'http://brave.com',
        type: siteTags.BOOKMARK,
        parentFolderId: 0,
        key: 'http://brave.com|0|0'
      })

      const newBookmark = Immutable.fromJS({
        title: 'Brave 1',
        location: 'http://brave.com',
        type: siteTags.BOOKMARK,
        parentFolderId: 0
      })

      const expectedBookmark = newBookmark.set('key', oldBookmark.get('key'))
      assert.deepEqual(bookmarkUtil.buildEditBookmark(oldBookmark, newBookmark).toJS(), expectedBookmark.toJS())
    })

    it('old and new data is merged and new key is generated', function () {
      const oldBookmark = Immutable.fromJS({
        title: 'Brave',
        location: 'http://brave.com',
        type: siteTags.BOOKMARK,
        parentFolderId: 0
      })

      const newBookmark = Immutable.fromJS({
        title: 'Brave 1',
        location: 'http://new.brave.com',
        type: siteTags.BOOKMARK,
        parentFolderId: 1
      })

      const expectedBookmark = newBookmark.set('key', 'http://new.brave.com|0|1')
      assert.deepEqual(bookmarkUtil.buildEditBookmark(oldBookmark, newBookmark).toJS(), expectedBookmark.toJS())
    })
  })
})
