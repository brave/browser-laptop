/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const { makeImmutable, isMap, isList } = require('./immutableUtil')
const assert = require('assert')

// TODO(bridiver) - make these generic validation functions
const validateId = function (propName, id) {
  assert(id, `${propName} cannot be null`)
  id = parseInt(id)
  assert(id > 0, `${propName} must be positive`)
  return id
}

const validateState = function (state) {
  state = makeImmutable(state)
  assert(isMap(state), 'state must be an Immutable.Map')
  assert(isList(state.get('windows')), 'state must contain an Immutable.List of windows')
  return state
}

const validateWindowValue = function (windowValue) {
  windowValue = makeImmutable(windowValue)
  assert(isMap(windowValue), 'windowValue must be an Immutable.Map')
  assert(windowValue.get('windowId'), 'window must have a windowId')
  return windowValue
}

const validateAction = function (action) {
  action = makeImmutable(action)
  assert(isMap(action), 'action must be an Immutable.Map')
  return action
}

const api = {
  getWindowIndex: (state, windowValue) => {
    state = validateState(state)

    let windowId = validateId('windowId', windowValue.get('windowId'))
    return api.getWindowIndexByWindowId(state, windowId)
  },

  insertWindow: (state, action) => {
    action = validateAction(action)
    state = validateState(state)
    let windowValue = validateWindowValue(action.get('windowValue'))
    assert(!api.getWindow(state, windowValue), 'Window already exists')
    return state.set('windows', state.get('windows').push(windowValue))
  },

  getWindow: (state, windowValue) => {
    state = validateState(state)
    windowValue = validateWindowValue(windowValue)
    let windowId = windowValue.get('windowId')
    return api.getByWindowId(state, windowId)
  },

  maybeCreateWindow: (state, action) => {
    action = validateAction(action)
    state = validateState(state)
    let windowValue = validateWindowValue(action.get('windowValue'))

    if (api.getWindow(state, windowValue)) {
      return api.updateWindow(state, action)
    } else {
      return api.insertWindow(state, action)
    }
  },

  getByWindowId: (state, windowId) => {
    state = validateState(state)
    windowId = validateId('windowId', windowId)
    return state.get('windows').find((win) => win.get('windowId') === windowId)
  },

  getWindowIndexByWindowId: (state, windowId) => {
    state = validateState(state)
    windowId = validateId('windowId', windowId)
    return state.get('windows').findIndex((win) => win.get('windowId') === windowId)
  },

  removeWindowByWindowId: (state, windowId) => {
    windowId = validateId('windowId', windowId)
    state = validateState(state)

    let index = api.getWindowIndexByWindowId(state, windowId)
    if (index === -1) {
      return state
    }
    return api.removeWindowByIndex(state, index)
  },

  removeWindowByIndex: (state, index) => {
    index = parseInt(index)
    assert(index >= 0, 'index must be positive')
    state = validateState(state)
    return state.set('windows', state.get('windows').delete(index))
  },

  removeWindow: (state, action) => {
    action = validateAction(action)
    state = validateState(state)
    let windowValue = validateWindowValue(action.get('windowValue'))
    let windowId = validateId('windowId', windowValue.get('windowId'))
    return api.removeWindowByWindowId(state, windowId)
  },

  updateWindow: (state, action) => {
    action = validateAction(action)
    state = validateState(state)
    let windowValue = validateWindowValue(action.get('windowValue'))

    let windows = state.get('windows')
    let index = api.getWindowIndex(state, windowValue)
    if (index === -1) {
      return state
    }

    let currentWindowValue = windows.get(index)

    let windowId = windowValue.get('windowId')
    if (windowId) {
      windowId = validateId('windowId', windowId)
      let currentWindowId = currentWindowValue.get('windowId')
      if (currentWindowId) {
        assert(windowId === currentWindowId, 'Changing a windowId is not allowed')
      }
    }
    if (!action.get('replace')) {
      windowValue = currentWindowValue.mergeDeep(windowValue)
    }
    return state.set('windows', windows.delete(index).insert(index, windowValue))
  },

  getWindows: (state) => {
    state = validateState(state)
    return state.get('windows')
  },

  getPersistentState: (state) => {
    // TODO(bridiver) handle restoring state
    state = makeImmutable(state)
    return state.delete('windows')
  }
}

module.exports = api
