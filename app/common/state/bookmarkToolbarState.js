/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const Immutable = require('immutable')

// State
const bookmarksState = require('./bookmarksState')
const windowState = require('./windowState')

// Utils
const {makeImmutable, isList, isMap} = require('./immutableUtil')
const bookmarkToolbarUtil = require('../lib/bookmarkToolbarUtil')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isList(state.get('windows'), 'state must contain an Immutable.List of windows'))
  return state
}

const bookmarkToolbarState = {
  setToolbars: (state) => {
    validateState(state)
    const bookmarks = bookmarksState.getBookmarksWithFolders(state, 0)

    state.get('windows').forEach((item, index) => {
      const width = state.getIn(['windows', index, 'width'])
      const data = bookmarkToolbarUtil.getBookmarkKeys(width, bookmarks)

      if (!state.hasIn(['windows', index])) {
        return state
      }

      state = state
        .setIn(['windows', index, 'bookmarksToolbar', 'toolbar'], data.toolbar)
        .setIn(['windows', index, 'bookmarksToolbar', 'other'], data.other)
    })

    return state
  },

  setToolbar: (state, windowId) => {
    validateState(state)
    const bookmarks = bookmarksState.getBookmarksWithFolders(state, 0)
    const windowIndex = windowState.getWindowIndexByWindowId(state, windowId)

    if (!state.hasIn(['windows', windowIndex])) {
      return state
    }

    const width = state.getIn(['windows', windowIndex, 'width'])
    const data = bookmarkToolbarUtil.getBookmarkKeys(width, bookmarks)

    return state
      .setIn(['windows', windowIndex, 'bookmarksToolbar', 'toolbar'], data.toolbar)
      .setIn(['windows', windowIndex, 'bookmarksToolbar', 'other'], data.other)
  },

  getToolbar: (state, windowId) => {
    const index = windowState.getWindowIndexByWindowId(state, windowId)
    return state.getIn(['windows', index, 'bookmarksToolbar', 'toolbar'], Immutable.List())
  },

  getOther: (state, windowId) => {
    const index = windowState.getWindowIndexByWindowId(state, windowId)
    return state.getIn(['windows', index, 'bookmarksToolbar', 'other'], Immutable.List())
  }
}

module.exports = bookmarkToolbarState
