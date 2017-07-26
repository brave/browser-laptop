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

require('../../../braveUnit')

describe('bookmarkUtil test', function () {
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
})
