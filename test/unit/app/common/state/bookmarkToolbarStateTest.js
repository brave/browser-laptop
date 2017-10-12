/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global before, after, describe, it */
const Immutable = require('immutable')
const assert = require('assert')
const mockery = require('mockery')

describe('bookmarkToolbarState unit test', function () {
  let bookmarkToolbarState

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
    windows: [
      {
        windowId: 1
      },
      {
        windowId: 2
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

  const stateWithToolbar = Immutable.fromJS({
    windows: [
      {
        windowId: 1,
        bookmarksToolbar: {
          toolbar: ['1'],
          other: ['2']
        }
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

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../lib/bookmarkToolbarUtil', {
      getBookmarkKeys: () => {
        return {
          toolbar: Immutable.fromJS(['1']),
          other: Immutable.fromJS(['2'])
        }
      }
    })
    bookmarkToolbarState = require('../../../../../app/common/state/bookmarkToolbarState')
  })

  after(function () {
    mockery.disable()
  })

  describe('setToolbars', function () {
    it('null case', function () {
      const newState = bookmarkToolbarState.setToolbars(state)
      assert.deepEqual(newState, state)
    })

    it('set data', function () {
      const newState = bookmarkToolbarState.setToolbars(stateWithData)
      const expectedState = stateWithData
        .setIn(['windows', 0, 'bookmarksToolbar'], Immutable.fromJS({
          'other': [
            '2'
          ],
          'toolbar': [
            '1'
          ]
        }))
        .setIn(['windows', 1, 'bookmarksToolbar'], Immutable.fromJS({
          'other': [
            '2'
          ],
          'toolbar': [
            '1'
          ]
        }))
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('setToolbar', function () {
    it('null case', function () {
      const newState = bookmarkToolbarState.setToolbar(state, 1)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('set data', function () {
      const newState = bookmarkToolbarState.setToolbar(stateWithData, 2)
      const expectedState = stateWithData
        .setIn(['windows', 1, 'bookmarksToolbar'], Immutable.fromJS({
          'other': [
            '2'
          ],
          'toolbar': [
            '1'
          ]
        }))
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('getToolbar', function () {
    it('null case', function () {
      const newState = bookmarkToolbarState.getToolbar(state, 1)
      assert.deepEqual(newState, Immutable.List())
    })

    it('return data', function () {
      const newState = bookmarkToolbarState.getToolbar(stateWithToolbar, 1)
      assert.deepEqual(newState, Immutable.fromJS(['1']))
    })
  })

  describe('getOther', function () {
    it('null case', function () {
      const newState = bookmarkToolbarState.getOther(state, 1)
      assert.deepEqual(newState, Immutable.List())
    })

    it('return data', function () {
      const newState = bookmarkToolbarState.getOther(stateWithToolbar, 1)
      assert.deepEqual(newState, Immutable.fromJS(['2']))
    })
  })
})
