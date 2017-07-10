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
    const detail = makeImmutable({
      location: 'https://ww.brave.com'
    })

    it('returns default if isFolder and shouldShowLocation are not provided', function () {
      assert.equal(bookmarkUtil.bookmarkHangerHeading(detail), 'bookmarkAdded')
    })

    describe('is folder', function () {
      it('returns editing mode when shouldShowLocation is not provided', function () {
        assert.equal(bookmarkUtil.bookmarkHangerHeading(detail, true, true), 'bookmarkFolderEditing')
      })

      it('returns editing mode when shouldShowLocation is true', function () {
        assert.equal(bookmarkUtil.bookmarkHangerHeading(detail, true, true), 'bookmarkFolderEditing')
      })

      it('returns add mode when shouldShowLocation is false', function () {
        assert.equal(bookmarkUtil.bookmarkHangerHeading(detail, true, false), 'bookmarkFolderAdding')
      })
    })

    describe('is bookmark', function () {
      it('returns add mode when shouldShowLocation is false', function () {
        assert.equal(bookmarkUtil.bookmarkHangerHeading(detail, false, false), 'bookmarkAdded')
      })

      it('returns create mode when details is empty', function () {
        assert.equal(bookmarkUtil.bookmarkHangerHeading(makeImmutable({}), false, true), 'bookmarkCreateNew')
      })

      it('returns edit mode when details is provided', function () {
        assert.equal(bookmarkUtil.bookmarkHangerHeading(detail, false, true), 'bookmarkEdit')
      })
    })
  })

  describe('displayBookmarkName', function () {
    it('custom title', function () {
      it('is not provided', function () {
        assert.equal(bookmarkUtil.displayBookmarkName(makeImmutable({
          title: 'brave'
        })), 'brave')
      })

      it('is null', function () {
        assert.equal(bookmarkUtil.displayBookmarkName(makeImmutable({
          customTitle: null
        })), '')
      })

      it('is provided', function () {
        assert.equal(bookmarkUtil.displayBookmarkName(makeImmutable({
          customTitle: 'custom brave'
        })), 'custom brave')
      })
    })

    it('regular title', function () {
      it('is not provided', function () {
        assert.equal(bookmarkUtil.displayBookmarkName(makeImmutable({})), '')
      })

      it('is null', function () {
        assert.equal(bookmarkUtil.displayBookmarkName(makeImmutable({
          title: null
        })), '')
      })

      it('is provided', function () {
        assert.equal(bookmarkUtil.displayBookmarkName(makeImmutable({
          title: 'brave'
        })), 'brave')
      })
    })
  })

  describe('isBookmarkNameValid', function () {
    describe('for folder', function () {
      it('title and custom title is not provided', function () {
        assert.equal(bookmarkUtil.isBookmarkNameValid(makeImmutable({
          location: 'https://ww.brave.com'
        }), true), false)
      })

      it('title and custom title are null', function () {
        assert.equal(bookmarkUtil.isBookmarkNameValid(makeImmutable({
          title: null,
          customTitle: null
        }), true), false)
      })

      it('title is empty string', function () {
        assert.equal(bookmarkUtil.isBookmarkNameValid(makeImmutable({
          title: ''
        }), true), false)
      })

      it('title is null, but customTitle is ok', function () {
        assert.equal(bookmarkUtil.isBookmarkNameValid(makeImmutable({
          title: null,
          customTitle: 'custom brave'
        }), true), true)
      })

      it('title and customTitle are ok', function () {
        assert.equal(bookmarkUtil.isBookmarkNameValid(makeImmutable({
          title: 'brave',
          customTitle: 'custom brave'
        }), true), true)
      })
    })

    describe('for bookmark', function () {
      it('location is not provided', function () {
        assert.equal(bookmarkUtil.isBookmarkNameValid(makeImmutable({}), true), false)
      })

      it('location is null', function () {
        assert.equal(bookmarkUtil.isBookmarkNameValid(makeImmutable({
          location: null
        }), false), false)
      })

      it('location is empty string', function () {
        assert.equal(bookmarkUtil.isBookmarkNameValid(makeImmutable({
          location: ''
        }), false), false)
      })

      it('location is provided', function () {
        assert.equal(bookmarkUtil.isBookmarkNameValid(makeImmutable({
          location: 'https://ww.brave.com'
        }), false), true)
      })
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
