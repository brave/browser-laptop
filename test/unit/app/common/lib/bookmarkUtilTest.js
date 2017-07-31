/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after */
const assert = require('assert')
const mockery = require('mockery')
const Immutable = require('immutable')
const bookmarkUtil = require('../../../../../app/common/lib/bookmarkUtil')
const {makeImmutable} = require('../../../../../app/common/state/immutableUtil')
const {bookmarksToolbarMode} = require('../../../../../app/common/constants/settingsEnums')
const dragTypes = require('../../../../../js/constants/dragTypes')
const siteTags = require('../../../../../js/constants/siteTags')

require('../../../braveUnit')

describe('bookmarkUtil unit test', function () {
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
    let bookmarkUtilMock, settingDefaultValue

    before(function () {
      mockery.enable({
        warnOnReplace: false,
        warnOnUnregistered: false,
        useCleanCache: true
      })
      mockery.registerMock('../../../js/settings', {
        getSetting: () => {
          return settingDefaultValue
        }
      })
      bookmarkUtilMock = require('../../../../../app/common/lib/bookmarkUtil')
    })

    after(function () {
      mockery.disable()
    })

    it('BOOKMARKS_TOOLBAR_MODE is FAVICONS_ONLY', function () {
      settingDefaultValue = bookmarksToolbarMode.FAVICONS_ONLY
      const result = bookmarkUtilMock.showOnlyFavicon()
      assert.equal(result, true)
    })

    it('BOOKMARKS_TOOLBAR_MODE is not FAVICONS_ONLY', function () {
      settingDefaultValue = bookmarksToolbarMode.TEXT_ONLY
      const result = bookmarkUtilMock.showOnlyFavicon()
      assert.equal(result, false)
    })
  })

  describe('showFavicon', function () {
    let bookmarkUtilMock, settingDefaultValue

    before(function () {
      mockery.enable({
        warnOnReplace: false,
        warnOnUnregistered: false,
        useCleanCache: true
      })
      mockery.registerMock('../../../js/settings', {
        getSetting: () => {
          return settingDefaultValue
        }
      })
      bookmarkUtilMock = require('../../../../../app/common/lib/bookmarkUtil')
    })

    after(function () {
      mockery.disable()
    })

    it('BOOKMARKS_TOOLBAR_MODE is FAVICONS_ONLY', function () {
      settingDefaultValue = bookmarksToolbarMode.FAVICONS_ONLY
      const result = bookmarkUtilMock.showFavicon()
      assert.equal(result, true)
    })

    it('BOOKMARKS_TOOLBAR_MODE is TEXT_AND_FAVICONS', function () {
      settingDefaultValue = bookmarksToolbarMode.TEXT_AND_FAVICONS
      const result = bookmarkUtilMock.showFavicon()
      assert.equal(result, true)
    })

    it('BOOKMARKS_TOOLBAR_MODE is not TEXT_AND_FAVICONS nor FAVICONS_ONLY', function () {
      settingDefaultValue = bookmarksToolbarMode.TEXT_ONLY
      const result = bookmarkUtilMock.showFavicon()
      assert.equal(result, false)
    })
  })

  describe('getDNDBookmarkData', function () {
    it('dragOverData is missing', function () {
      const state = makeImmutable({
        dragData: {}
      })
      const result = bookmarkUtil.getDNDBookmarkData(state, null)
      assert.equal(result, Immutable.Map())
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

  describe('getBookmarksByParentId', function () {

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

  })

  describe('updateActiveTabBookmarked', function () {

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
})
