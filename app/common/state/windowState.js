/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const assert = require('assert')
const { createSelector } = require('reselect')
const { makeImmutable, isMap, isList } = require('./immutableUtil')

// TODO(bridiver) - make these generic validation functions
const validateId = function (propName, id) {
  assert.ok(id, `${propName} cannot be null`)
  id = parseInt(id)
  assert.ok(id === -1 || id >= 1, `${propName} must be positive or -1`)
  return id
}

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isList(state.get('windows')), 'state must contain an Immutable.List of windows')
  return state
}

const validateWindowValue = function (windowValue) {
  windowValue = makeImmutable(windowValue)
  assert.ok(isMap(windowValue), 'windowValue must be an Immutable.Map')
  assert.ok(windowValue.get('windowId'), 'window must have a windowId')
  return windowValue
}

const validateAction = function (action) {
  action = makeImmutable(action)
  assert.ok(isMap(action), 'action must be an Immutable.Map')
  return action
}

const api = {
  WINDOW_ID_NONE: -1,
  WINDOW_ID_CURRENT: -2,

  getWindowIndex: (state, windowValue) => {
    state = validateState(state)

    let windowId = validateId('windowId', windowValue.get('windowId'))
    return api.getWindowIndexByWindowId(state, windowId)
  },

  insertWindow: (state, action) => {
    action = validateAction(action)
    state = validateState(state)
    let windowValue = validateWindowValue(action.get('windowValue'))
    assert.ok(!api.getWindow(state, windowValue), 'Window already exists')
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

  getActiveWindow: (state) => {
    state = validateState(state)
    return state.get('windows').find((win) => win.get('focused') === true)
  },

  getActiveWindowId: (state) => {
    const win = api.getActiveWindow(state)
    return (win && win.get('windowId')) || api.WINDOW_ID_NONE
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
    assert.ok(index >= 0, 'index must be positive')
    state = validateState(state)
    return state.set('windows', state.get('windows').delete(index))
  },

  removeWindow: (state, action) => {
    action = validateAction(action)
    state = validateState(state)
    const windowId = action.get('windowId')
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
        assert.ok(windowId === currentWindowId, 'Changing a windowId is not allowed')
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
    return state.set('windows', Immutable.List())
  },

  // TODO (nejc) we should only pass in one state
  // refactor when window state is merged into app state
  shouldAllowWindowDrag: (state, windowState, frame, isFocused) => {
    const shieldState = require('./shieldState')
    const defaultBrowserState = require('./defaultBrowserState')
    const braveryPanelIsVisible = shieldState.braveShieldsEnabled(frame) &&
      windowState.get('braveryPanelDetail')
    const checkDefaultBrowserDialogIsVisible = isFocused &&
      defaultBrowserState.shouldDisplayDialog(state)

    return !windowState.has('contextMenuDetail') &&
      !windowState.get('popupWindowDetail') &&
      !windowState.get('bookmarkDetail') &&
      !windowState.getIn(['ui', 'siteInfo', 'isVisible']) &&
      !braveryPanelIsVisible &&
      !windowState.getIn(['ui', 'isClearBrowsingDataPanelVisible']) &&
      !windowState.get('importBrowserDataDetail') &&
      !windowState.getIn(['widevinePanelDetail', 'shown']) &&
      !windowState.get('autofillAddressDetail') &&
      !windowState.get('autofillCreditCardDetail') &&
      !windowState.getIn(['ui', 'releaseNotes', 'isVisible']) &&
      !checkDefaultBrowserDialogIsVisible &&
      !windowState.getIn(['ui', 'noScriptInfo', 'isVisible']) &&
      frame && !frame.getIn(['security', 'loginRequiredDetail']) &&
      !windowState.getIn(['ui', 'menubar', 'selectedIndex'])
  },

  /**
   * Allows a selector to be created from appStore state, that can call
   * a child selector which expects windowStore state. Must be called from renderer
   * component, which stores windowState on appState.currentWindow
   */
  generateWindowStateSelector: function generateWindowStateSelector (resultFunc) {
    return createSelector(
      state => state.get('currentWindow'),
      resultFunc
    )
  }
}

module.exports = api
