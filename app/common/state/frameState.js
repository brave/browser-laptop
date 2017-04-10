/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const { makeImmutable, isMap, isList } = require('./immutableUtil')
const assert = require('assert')

const validateId = function (propName, id) {
  assert.ok(id, `${propName} cannot be null`)
  id = parseInt(id)
  assert.ok(id === -1 || id > 0, `${propName} must be positive`)
  return id
}

const validateAppState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  return state
}

const validateWindowState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isList(state.get('frames')), 'state must contain an Immutable.List of frames')
  return state
}

const frameState = {
  getTabIdByFrameKey (state, frameKey) {
    state = validateAppState(state)
    const currentWindow = state.get('currentWindow')
    if (currentWindow) {
      state = currentWindow
    }
    state = validateWindowState(state)
    frameKey = validateId('key', frameKey)
    const frame = state.get('frames').find((frame) => frame.get('key') === frameKey)
    return (frame && frame.get('tabId')) || -1
  },

  getFrameByTabId: (state, tabId) => {
    state = validateAppState(state)
    const currentWindow = state.get('currentWindow')
    if (currentWindow) {
      state = currentWindow
    }
    state = validateWindowState(state)
    tabId = validateId('tabId', tabId)
    return state.get('frames').find((frame) => frame.get('tabId') === tabId)
  }
}

module.exports = frameState
