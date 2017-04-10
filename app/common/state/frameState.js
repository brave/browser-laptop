/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const { makeImmutable, isMap } = require('./immutableUtil')
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

const api = {
  getPathByFrameKey: (state, frameKey) => {
    state = validateAppState(state)
    frameKey = validateId('frameKey', frameKey)
    let path = makeImmutable([])
    const currentWindow = state.get('currentWindow')
    if (currentWindow) {
      state = currentWindow
      // in ReduxComponent
      path = path.push('currentWindow')
    }

    if (state.get('frames')) {
      // in WindowState
      const index = state.get('frames').findIndex((frame) => frame.get('key') === frameKey)
      if (index === -1) {
        return path.concat('nosuchframe')
      }
      return path.concat(['frames', index])
    } else {
      // in AppState
      const index = state.get('tabs').findIndex((tab) => tab.getIn(['frame', 'key']) === frameKey)
      if (index === -1) {
        return path.concat('nosuchtab')
      }
      return makeImmutable(['tabs', index, 'frame'])
    }
  },

  getPathByTabId: (state, tabId) => {
    state = validateAppState(state)
    tabId = validateId('tabId', tabId)
    let path = makeImmutable([])
    const currentWindow = state.get('currentWindow')
    if (currentWindow) {
      // in ReduxComponent
      path = path.push('currentWindow')
      state = currentWindow
    }

    // in WindowState
    const index = state.get('frames').findIndex((frame) => frame.get('tabId') === tabId)
    if (index === -1) {
      return makeImmutable(['nosuchframe'])
    }
    return path.concat(['frames', index])
  },

  getByFrameKey: (state, frameKey) => {
    return state.getIn(api.getPathByFrameKey(state, frameKey))
  },

  getByTabId: (state, tabId) => {
    return state.getIn(api.getPathByTabId(state, tabId))
  },

  getTabIdByFrameKey: (state, frameKey) => {
    return state.getIn(api.getPathByFrameKey(state, frameKey).concat('tabId')) || -1
  }
}

module.exports = api
