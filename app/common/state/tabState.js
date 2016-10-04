/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const { makeImmutable, isMap, isList } = require('./immutableUtil')
const assert = require('assert')

const validateId = function (propName, id) {
  assert(id, `${propName} cannot be null`)
  id = parseInt(id)
  assert(id === -1 || id > 0, `${propName} must be positive`)
  return id
}

const validateTabs = function (tabs) {
  tabs = makeImmutable(tabs)
  assert(isList(tabs), 'tabs must be an Immutable.List')
  tabs.forEach((tab) => validateTabValue(tab))
  return tabs
}

const validateState = function (state) {
  state = makeImmutable(state)
  assert(isMap(state), 'state must be an Immutable.Map')
  assert(isList(state.get('tabs')), 'state must contain an Immutable.List of tabs')
  return state
}

const validateWindowValue = function (windowValue) {
  windowValue = makeImmutable(windowValue)
  assert(isMap(windowValue), 'windowValue must be an Immutable.Map')
  assert(windowValue.get('windowId'), 'window must have a windowId')
  return windowValue
}

const validateTabValue = function (tabValue) {
  tabValue = makeImmutable(tabValue)
  assert(isMap(tabValue), 'tabValue must be an Immutable.Map')
  assert(tabValue.get('tabId'), 'tab must have a tabId')
  return tabValue
}

const validateAction = function (action) {
  action = makeImmutable(action)
  assert(isMap(action), 'action must be an Immutable.Map')
  return action
}

const api = {
  getTabIndex: (state, tabValue) => {
    state = validateState(state)
    tabValue = validateTabValue(tabValue)
    let tabId = validateId('tabId', tabValue.get('tabId'))
    return api.getTabIndexByTabId(state, tabId)
  },

  getTabIndexByTabId: (state, tabId) => {
    tabId = validateId('tabId', tabId)
    state = validateState(state)

    return state.get('tabs').findIndex((tab) => tab.get('tabId') === tabId)
  },

  removeTabByTabId: (state, tabId) => {
    tabId = validateId('tabId', tabId)
    state = validateState(state)

    let index = api.getTabIndexByTabId(state, tabId)
    if (index === -1) {
      return state
    }
    return api.removeTabByIndex(state, index)
  },

  removeTabByIndex: (state, index) => {
    index = parseInt(index)
    assert(index >= 0, 'index must be positive')
    state = validateState(state)
    return state.set('tabs', state.get('tabs').delete(index))
  },

  closeFrame: (state, action) => {
    let tabId = makeImmutable(action).getIn(['frameProps', 'tabId'])
    return api.removeTabByTabId(state, tabId)
  },

  removeTab: (state, action) => {
    action = validateAction(action)
    state = validateState(state)
    let tabValue = validateTabValue(action.get('tabValue'))
    let tabId = validateId('tabId', tabValue.get('tabId'))
    return api.removeTabByTabId(state, tabId)
  },

  insertTab: (state, action) => {
    action = validateAction(action)
    state = validateState(state)
    let tabValue = validateTabValue(action.get('tabValue'))
    assert(!api.getTab(state, tabValue), 'Tab already exists')
    return state.set('tabs', state.get('tabs').push(tabValue))
  },

  maybeCreateTab: (state, action) => {
    action = validateAction(action)
    state = validateState(state)
    let tabValue = validateTabValue(action.get('tabValue'))

    if (api.getTab(state, tabValue)) {
      return api.updateTab(state, action)
    } else {
      return api.insertTab(state, action)
    }
  },

  getTabsByWindowId: (state, windowId) => {
    state = validateState(state)
    windowId = validateId('windowId', windowId)
    return state.get('tabs').filter((tab) => tab.get('windowId') === windowId)
  },

  getTabsByWindow: (state, windowValue) => {
    state = validateState(state)
    windowValue = validateWindowValue(windowValue)
    let windowId = validateId('windowId', windowValue.get('windowId'))
    return state.get('tabs').filter((tab) => tab.get('windowId') === windowId)
  },

  getByTabId: (state, tabId) => {
    tabId = validateId('tabId', tabId)
    state = validateState(state)

    return state.get('tabs').find((tab) => tab.get('tabId') === tabId)
  },

  getTab: (state, tabValue) => {
    state = validateState(state)
    tabValue = validateTabValue(tabValue)
    let tabId = validateId('tabId', tabValue.get('tabId'))
    return api.getByTabId(state, tabId)
  },

  updateTab: (state, action) => {
    state = validateAction(state)
    action = validateAction(action)
    let tabValue = validateTabValue(action.get('tabValue'))
    let tabs = state.get('tabs')
    let index = api.getTabIndex(state, tabValue)
    if (index === -1) {
      return state
    }

    let currentTabValue = tabs.get(index)

    let tabId = tabValue.get('tabId')
    if (tabId) {
      tabId = validateId('tabId', tabId)
      let currentTabId = currentTabValue.get('tabId')
      if (currentTabId) {
        assert(tabId === currentTabId, 'Changing a tabId is not allowed')
      }
    }
    if (!action.get('replace')) {
      tabValue = currentTabValue.mergeDeep(tabValue)
    }
    return state.set('tabs', tabs.delete(index).insert(index, tabValue))
  },

  getTabs: (state) => {
    state = validateState(state)
    return state.get('tabs')
  },

  setTabs: (state, tabs) => {
    state = validateState(state)
    tabs = validateTabs(tabs)
    return state.set('tabs', tabs)
  },

  getPersistentState: (state) => {
    // TODO(bridiver) - handle restoring tabs
    state = makeImmutable(state)
    return state.delete('tabs')
  }
}

module.exports = api
