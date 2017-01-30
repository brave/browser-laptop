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

const validateTabs = function (tabs) {
  tabs = makeImmutable(tabs)
  assert.ok(isList(tabs), 'tabs must be an Immutable.List')
  tabs.forEach((tab) => validateTabValue(tab))
  return tabs
}

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isList(state.get('tabs')), 'state must contain an Immutable.List of tabs')
  return state
}

const validateWindowValue = function (windowValue) {
  windowValue = makeImmutable(windowValue)
  assert.ok(isMap(windowValue), 'windowValue must be an Immutable.Map')
  assert.ok(windowValue.get('windowId'), 'window must have a windowId')
  return windowValue
}

const validateTabValue = function (tabValue) {
  tabValue = makeImmutable(tabValue)
  assert.ok(isMap(tabValue), 'tabValue must be an Immutable.Map')
  assert.ok(tabValue.get('tabId'), 'tab must have a tabId')
  return tabValue
}

const validateAction = function (action) {
  action = makeImmutable(action)
  assert.ok(isMap(action), 'action must be an Immutable.Map')
  return action
}

const matchTab = function (queryInfo, tab) {
  queryInfo = queryInfo.toJS ? queryInfo.toJS() : queryInfo
  return !Object.keys(queryInfo).map((queryKey) => (tab.get(queryKey) === queryInfo[queryKey])).includes(false)
}

const tabState = {
  queryTab: (state, queryInfo) => {
    state = validateState(state)
    return state.get('tabs').filter(matchTab.bind(null, queryInfo)).get(0)
  },

  getTabIndex: (state, tabValue) => {
    state = validateState(state)
    tabValue = validateTabValue(tabValue)
    let tabId = validateId('tabId', tabValue.get('tabId'))
    return tabState.getTabIndexByTabId(state, tabId)
  },

  getTabIndexByTabId: (state, tabId) => {
    tabId = validateId('tabId', tabId)
    state = validateState(state)

    return state.get('tabs').findIndex((tab) => tab.get('tabId') === tabId)
  },

  getActiveTabValue: (state, windowId) => {
    windowId = validateId('windowId', windowId)
    state = validateState(state)
    return state.get('tabs').find((tab) => tab.get('windowId') === windowId && tab.get('active'))
  },

  removeTabByTabId: (state, tabId) => {
    tabId = validateId('tabId', tabId)
    state = validateState(state)

    let index = tabState.getTabIndexByTabId(state, tabId)
    if (index === -1) {
      return state
    }
    return tabState.removeTabByIndex(state, index)
  },

  removeTabByIndex: (state, index) => {
    index = parseInt(index)
    assert.ok(index >= 0, 'index must be positive')
    state = validateState(state)
    return state.set('tabs', state.get('tabs').delete(index))
  },

  closeFrame: (state, action) => {
    const frameProps = makeImmutable(action).getIn(['frameProps'])
    // Unloaded tabs have no tab state because the webcontents isn't created yet.
    if (frameProps.get('unloaded')) {
      return state
    }
    return tabState.removeTabByTabId(state, frameProps.get('tabId'))
  },

  removeTab: (state, action) => {
    action = validateAction(action)
    state = validateState(state)
    let tabValue = validateTabValue(action.get('tabValue'))
    let tabId = validateId('tabId', tabValue.get('tabId'))
    return tabState.removeTabByTabId(state, tabId)
  },

  insertTab: (state, action) => {
    action = validateAction(action)
    state = validateState(state)
    let tabValue = validateTabValue(action.get('tabValue'))
    assert.ok(!tabState.getTab(state, tabValue), 'Tab already exists')
    return state.set('tabs', state.get('tabs').push(tabValue))
  },

  maybeCreateTab: (state, action) => {
    action = validateAction(action)
    state = validateState(state)
    let tabValue = validateTabValue(action.get('tabValue'))

    if (tabState.getTab(state, tabValue)) {
      return tabState.updateTab(state, action)
    } else {
      return tabState.insertTab(state, action)
    }
  },

  getTabsByWindowId: (state, windowId) => {
    state = validateState(state)
    windowId = validateId('windowId', windowId)
    return state.get('tabs').filter((tab) => tab.get('windowId') === windowId)
  },

  getPinnedTabs: (state) => {
    state = validateState(state)
    return state.get('tabs').filter((tab) => tab.get('pinned'))
  },

  getMatchingTab: (state, createProperties) => {
    state = validateState(state)
    const windowId = validateId('windowId', createProperties.get('windowId'))
    return state.get('tabs').find(
      (tab) => tab.get('windowId') === windowId &&
        tab.get('url') === createProperties.get('url') &&
        (tab.get('partition') || 'default') === (createProperties.get('partition') || 'default'))
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
    return tabState.getByTabId(state, tabId)
  },

  updateTab: (state, action) => {
    state = validateAction(state)
    action = validateAction(action)
    let tabValue = validateTabValue(action.get('tabValue'))
    let tabs = state.get('tabs')
    let index = tabState.getTabIndex(state, tabValue)
    if (index === -1) {
      return state
    }

    let currentTabValue = tabs.get(index)

    let tabId = tabValue.get('tabId')
    if (tabId) {
      tabId = validateId('tabId', tabId)
      let currentTabId = currentTabValue.get('tabId')
      if (currentTabId) {
        assert.ok(tabId === currentTabId, 'Changing a tabId is not allowed')
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

  removeTabField: (state, field) => {
    state = makeImmutable(state)

    let tabs = state.get('tabs')
    if (!tabs) {
      return state
    }
    for (let i = 0; i < tabs.size; i++) {
      tabs = tabs.deleteIn([i, field])
    }
    return state.set('tabs', tabs)
  },

  getPersistentState: (state) => {
    state = makeImmutable(state)

    state = tabState.removeTabField(state, 'messageBoxDetail')

    // TOOD: Once we persist tabs, we can refactor this away
    state = state.set('pinnedTabs', state.get('tabs')
      .filter((tab) => tab.get('pinned')))

    // TODO(bridiver) - handle restoring tabs
    return state.delete('tabs')
  }
}

module.exports = tabState
