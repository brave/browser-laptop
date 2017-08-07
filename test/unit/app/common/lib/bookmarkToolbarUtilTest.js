/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after */
const assert = require('assert')
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const siteTags = require('../../../../../js/constants/siteTags')

require('../../../braveUnit')

describe('bookmarkToolbarUtil unit test', function () {
  let bookmarkToolbarUtil, bookmarkUtil

  const generateBookmarks = (num) => {
    return Immutable.fromJS(new Array(num).fill().map((_, i) => {
      return {
        type: siteTags.BOOKMARK,
        title: `Bookmark ${i}`,
        key: `bookmark-${i}|0|0`,
        width: 10 * i
      }
    }))
  }

  const generateBookmarksKeys = (num, skip = 0) => {
    return Immutable.fromJS(new Array(num).fill().map((_, i) => {
      const id = skip + i
      return `bookmark-${id}|0|0`
    }))
  }

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    bookmarkToolbarUtil = require('../../../../../app/common/lib/bookmarkToolbarUtil')
    bookmarkUtil = require('../../../../../app/common/lib/bookmarkUtil')
  })

  after(function () {
    mockery.disable()
  })

  describe('getToolbarBookmarks', function () {
    let showOnlyText

    before(function () {
      showOnlyText = sinon.stub(bookmarkUtil, 'showOnlyText', () => true)
    })

    after(function () {
      showOnlyText.restore()
    })

    it('null scenario', function () {
      assert.deepEqual(bookmarkToolbarUtil.getBookmarkKeys(), {
        toolbar: Immutable.List(),
        other: Immutable.List()
      })
    })

    it('we only have bookmark for the toolbar', function () {
      const bookmarks = generateBookmarks(5)

      assert.deepEqual(bookmarkToolbarUtil.getBookmarkKeys(500, bookmarks), {
        toolbar: generateBookmarksKeys(5),
        other: Immutable.List()
      })
    })

    it('we have bookmarks for toolbar and other', function () {
      const bookmarks = generateBookmarks(50)

      assert.deepEqual(bookmarkToolbarUtil.getBookmarkKeys(500, bookmarks), {
        toolbar: generateBookmarksKeys(8),
        other: generateBookmarksKeys(42, 8)
      })
    })

    it('other limit is set to 100', function () {
      const bookmarks = generateBookmarks(500)

      assert.deepEqual(bookmarkToolbarUtil.getBookmarkKeys(500, bookmarks), {
        toolbar: generateBookmarksKeys(8),
        other: generateBookmarksKeys(100, 8)
      })
    })
  })
})
