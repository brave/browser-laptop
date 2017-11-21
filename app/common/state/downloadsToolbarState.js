/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const Immutable = require('immutable')

// State
const windowState = require('./windowState')

// Utils
const {makeImmutable, isList, isMap} = require('./immutableUtil')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isList(state.get('windows'), 'state must contain an Immutable.List of windows'))
  return state
}

const downloadsBarState = {
  setVisibility: (state, windowId, visible) => {
    validateState(state)
    const windowIndex = windowState.getWindowIndexByWindowId(state, windowId)

    if (!state.hasIn(['windows', windowIndex])) {
      return state
    }

    return state
      .setIn(['windows', windowIndex, 'downloadsToolbar', 'isVisible'], visible)
  },

  isVisible: (state, windowId) => {
    const index = windowState.getWindowIndexByWindowId(state, windowId)
    const isVisible = state.getIn(['windows', index, 'downloadsToolbar', 'isVisible']) || false
    return isVisible && state.get('downloads') && state.get('downloads').size > 0
  },

  getToolbar: (state, windowId) => {
    const index = windowState.getWindowIndexByWindowId(state, windowId)
    return state.getIn(['windows', index, 'downloadsToolbar'], Immutable.List())
  }
}

module.exports = downloadsBarState
