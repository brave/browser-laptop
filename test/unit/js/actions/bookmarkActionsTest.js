/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it, beforeEach, afterEach */

const assert = require('assert')
const mockery = require('mockery')
const sinon = require('sinon')

describe('BookmarkActions unit tests', function () {
  beforeEach(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
  })
  afterEach(function () {
    mockery.disable()
    mockery.deregisterAll()
  })
  describe('#openBookmarksInFolder', function () {
    describe('If less than or equal to 25 bookmarks', function () {
      it('should create new tab with item not active, for each item', function () {
        const createTabStub = sinon.stub()
        mockery.registerMock('../../app/common/state/bookmarksState', { getBookmarksByParentId: () => [
          { get: () => 'get item' }, { get: () => 'get item' }
        ]})
        mockery.registerMock('./appActions', { createTabRequested: createTabStub })
        mockery.registerMock('../../app/common/lib/bookmarkUtil', { toCreateProperties: () => '' })
        const { openBookmarksInFolder } = require('../../../../js/actions/bookmarkActions')
        openBookmarksInFolder({ get: () => '' })

        assert.equal(createTabStub.getCall(0).args[0].active, false)
        assert.equal(createTabStub.getCall(1).args[0].active, false)
      })
    })
    describe('If more than 25 bookmarks', function () {
      it('should create new tab with url and partition number and discarded, for each item', function () {
        const createTabStub = sinon.stub()
        mockery.registerMock('../../app/common/state/bookmarksState', { getBookmarksByParentId: () => [
          { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' },
          { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' },
          { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' },
          { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' },
          { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' },
          { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' }, { get: () => 'get item' }
        ]})
        mockery.registerMock('./appActions', { createTabRequested: createTabStub })
        mockery.registerMock('../../app/common/lib/bookmarkUtil', { toCreateProperties: () => '' })
        const { openBookmarksInFolder } = require('../../../../js/actions/bookmarkActions')
        openBookmarksInFolder({ get: () => '' })
        const expectedArguments = { url: 'get item', partitionNumber: 'get item', discarded: true }

        assert.deepEqual(createTabStub.getCall(29).args[0], expectedArguments)
      })
    })
  })
})
