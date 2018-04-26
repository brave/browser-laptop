/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const assert = require('assert')

// State
const frameState = require('./frameState')
const windowState = require('./windowState')

// utils
const { makeImmutable, isMap, isList } = require('./immutableUtil')
// this file should eventually replace frameStateUtil
const frameStateUtil = require('../../../js/state/frameStateUtil')

const validateId = function (propName, id) {
  assert.ok(id, `${propName} cannot be null`)
  id = parseInt(id)
  assert.ok(id >= -2, `${propName} must be a valid`)
  return id
}

const validateIndex = function (index) {
  index = parseInt(index)
  assert.ok(index >= -1)
  return index
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

const selectTabs = function (state) {
  return state.get('tabs', Immutable.List()).filter(tab => !tab.isEmpty())
}

const matchTab = function (queryInfo, tab) {
  queryInfo = queryInfo.toJS ? queryInfo.toJS() : queryInfo
  return !Object.keys(queryInfo).map((queryKey) => (tab.get(queryKey) === queryInfo[queryKey])).includes(false)
}

const updateLastActive = (state, oldTabValue, newTabValue) => {
  if (!newTabValue.get('active')) {
    return state
  }

  const oldTabId = validateId('tabId', oldTabValue.get('tabId'))
  const oldWindowId = validateId('windowId', oldTabValue.get('windowId'))

  const tabId = validateId('tabId', newTabValue.get('tabId'))
  const windowId = validateId('windowId', newTabValue.get('windowId'))

  if (oldWindowId !== -1 && oldTabId !== tabState.TAB_ID_NONE) {
    let oldActiveList = state.getIn(['tabsInternal', 'lastActive', oldWindowId.toString()], Immutable.OrderedSet())
    oldActiveList = oldActiveList.remove(oldTabId)
    state = state.setIn(['tabsInternal', 'lastActive', oldWindowId.toString()], oldActiveList)
  }

  if (windowId !== -1 && tabId !== tabState.TAB_ID_NONE) {
    let activeList = state.getIn(['tabsInternal', 'lastActive', windowId.toString()], Immutable.OrderedSet())
    activeList = activeList.add(tabId)
    state = state.setIn(['tabsInternal', 'lastActive', windowId.toString()], activeList)
  }

  return state
}

// index for looking up tabIds by their display index
const getTabIdByDisplayIndex = (state, windowId, index) => {
  index = validateIndex(index)
  windowId = validateId('windowId', windowId)
  const tabValue = tabState.queryTab(state, {windowId, index})
  if (!tabValue) {
    return tabState.TAB_ID_NONE
  }
  return tabValue.get('tabId')
}

// The internal index is the location of the tabId in the tabs array
const getTabInternalIndexByTabId = (state, tabId) => {
  tabId = validateId('tabId', tabId)
  state = validateState(state)

  const index = state.getIn(['tabsInternal', 'index', tabId.toString()])
  return index == null ? -1 : index
}

const deleteTabsInternalIndex = (state, tabValue) => {
  const tabId = validateId('tabId', tabValue.get('tabId'))
  if (tabId === tabState.TAB_ID_NONE) {
    return state
  }
  const windowId = validateId('windowId', tabValue.get('windowId'))
  if (windowId !== windowState.WINDOW_ID_NONE) {
    let activeList = state.getIn(['tabsInternal', 'lastActive', windowId.toString()], Immutable.OrderedSet())
    activeList = activeList.remove(tabId)
    state = state.setIn(['tabsInternal', 'lastActive', windowId.toString()], activeList)
  }
  return state.deleteIn(['tabsInternal', 'index', tabId.toString()])
}

const updateTabsInternalIndex = (state, fromIndex) => {
  fromIndex = validateIndex(fromIndex)
  let tabsInternal = state.get('tabsInternal') || Immutable.Map()
  state.get('tabs').slice(fromIndex).forEach((tab, idx) => {
    if (tab.isEmpty()) {
      return
    }
    const tabId = validateId('tabId', tab.get('tabId')).toString()
    if (tabId !== tabState.TAB_ID_NONE) {
      tabsInternal = tabsInternal.setIn(['index', tabId], (idx + fromIndex).toString())
    }
  })
  return state.set('tabsInternal', tabsInternal)
}

const tabState = {
  queryTab: (state, queryInfo) => {
    state = validateState(state)
    return state.get('tabs').filter(matchTab.bind(null, queryInfo)).get(0)
  },

  TAB_ID_NONE: -1,
  TAB_ID_ACTIVE: -2,

  validateTabId: (tabId) => {
    validateId('tabId', tabId)
  },

  removeTabByTabId: (state, tabId) => {
    tabId = validateId('tabId', tabId)
    state = validateState(state)

    let index = getTabInternalIndexByTabId(state, tabId)
    if (index === tabState.TAB_ID_NONE) {
      return state
    }
    return tabState.removeTabByIndex(state, index)
  },

  removeTabByIndex: (state, index) => {
    index = parseInt(index)
    assert.ok(index >= 0, 'index must be positive')
    state = validateState(state)
    const tabValue = state.getIn(['tabs', index])
    if (!tabValue) {
      return state
    }
    state = deleteTabsInternalIndex(state, tabValue)
    state = state.setIn(['tabs', index], Immutable.Map())
    return updateTabsInternalIndex(state, index)
  },

  removeTab: (state, tabValue) => {
    state = validateState(state)
    tabValue = makeImmutable(tabValue)
    tabValue = validateTabValue(tabValue)
    let tabId = validateId('tabId', tabValue.get('tabId'))
    return tabState.removeTabByTabId(state, tabId)
  },

  insertTab: (state, action) => {
    action = validateAction(action)
    state = validateState(state)
    let tabValue = validateTabValue(action.get('tabValue'))
    assert.ok(!tabState.getTab(state, tabValue), 'Tab already exists')
    state = state.set('tabs', state.get('tabs').push(tabValue))
    state = updateLastActive(state, tabValue, tabValue)
    return updateTabsInternalIndex(state, state.get('tabs').size - 1)
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
    return selectTabs(state).filter((tab) => tab.get('windowId') === windowId)
  },

  getPinnedTabs: (state) => {
    state = validateState(state)
    return selectTabs(state).filter((tab) => !!tab.get('pinned'))
  },

  isTabPinned: (state, tabId) => {
    state = validateState(state)
    tabId = validateId('tabId', tabId)
    const tab = tabState.getByTabId(state, tabId)
    return tab != null ? !!tab.get('pinned') : false
  },

  getNonPinnedTabs: (state) => {
    state = validateState(state)
    return selectTabs(state).filter((tab) => !tab.get('pinned'))
  },

  getPinnedTabsByWindowId: (state, windowId) => {
    state = validateState(state)
    windowId = validateId('windowId', windowId)
    return tabState.getPinnedTabs(state).filter((tab) => tab.get('windowId') === windowId)
  },

  getNonPinnedTabsByWindowId: (state, windowId) => {
    state = validateState(state)
    windowId = validateId('windowId', windowId)
    return tabState.getNonPinnedTabs(state).filter((tab) => tab.get('windowId') === windowId)
  },

  getMatchingTab: (state, createProperties) => {
    state = validateState(state)
    const windowId = validateId('windowId', createProperties.get('windowId'))
    return state.get('tabs').find(
      (tab) => tab.get('windowId') === windowId &&
        tab.get('url') === createProperties.get('url') &&
        (tab.get('partition') || 'persist:default') === (createProperties.get('partition') || 'persist:default'))
  },

  getTabsByWindow: (state, windowValue) => {
    state = validateState(state)
    windowValue = validateWindowValue(windowValue)
    let windowId = validateId('windowId', windowValue.get('windowId'))
    return state.get('tabs').filter((tab) => tab.get('windowId') === windowId)
  },

  getPathByTabId: (state, tabId) => {
    tabId = tabState.resolveTabId(state, tabId)
    state = validateState(state)

    const index = getTabInternalIndexByTabId(state, tabId)
    if (index === tabState.TAB_ID_NONE) {
      return null
    }
    return ['tabs', index]
  },

  getByTabId: (state, tabId) => {
    if (tabId === tabState.TAB_ID_NONE) {
      return null
    }

    const path = tabState.getPathByTabId(state, tabId)
    if (path == null) {
      return null
    }
    return state.getIn(path)
  },

  getTabIdByIndex: (state, windowId, index) => {
    if (index === -1) {
      return tabState.TAB_ID_NONE
    }

    return getTabIdByDisplayIndex(state, windowId, index)
  },

  getNextTabIdByIndex: (state, windowId, index, includePinned = false) => {
    index = validateIndex(index)
    windowId = validateId('windowId', windowId)
    state = validateState(state)

    let nextTab = null
    let done = false
    let nextIndex = index + 1
    // first look for any tabs after the index
    do {
      nextTab = tabState.getTabByIndex(state, windowId, nextIndex++)
      if (nextTab) {
        if (!includePinned && nextTab.get('pinned')) {
          nextTab = null
        } else {
          done = true
        }
      } else {
        done = true
      }
    }
    while (!done)

    // if nothing after then check before
    if (!nextTab) {
      done = false
    }
    let previousIndex = index - 1
    while (previousIndex >= 0 && !done) {
      nextTab = tabState.getTabByIndex(state, windowId, previousIndex--)
      if (nextTab) {
        if (!includePinned && nextTab.get('pinned')) {
          nextTab = null
        } else {
          done = true
        }
      } else {
        done = true
      }
    }

    return nextTab ? nextTab.get('tabId') : tabState.TAB_ID_NONE
  },

  getTabByIndex: (state, windowId, index) => {
    const tabId = tabState.getTabIdByIndex(state, windowId, index)
    if (tabId === tabState.TAB_ID_NONE) {
      return null
    }

    return tabState.getByTabId(state, tabId)
  },

  getTab: (state, tabValue) => {
    state = validateState(state)
    tabValue = validateTabValue(tabValue)
    let tabId = validateId('tabId', tabValue.get('tabId'))
    return tabState.getByTabId(state, tabId)
  },

  updateTab: (state, action) => {
    state = validateState(state)
    action = validateAction(action)
    return tabState.updateTabValue(state, action.get('tabValue'), action.get('replace'))
  },

  getTabs: (state) => {
    state = validateState(state)
    return state.get('tabs')
  },

  getLastActiveTabId: (state, windowId) => {
    const tabId = tabState.getTabsByLastActivated(state, windowId).slice(-2).first()
    if (tabId == null) {
      return tabState.TAB_ID_NONE
    }
    return tabId
  },

  getTabsByLastActivated: (state, windowId) => {
    state = validateState(state)
    windowId = validateId('windowId', windowId)
    return state.getIn(['tabsInternal', 'lastActive', windowId.toString()], Immutable.OrderedSet())
  },

  setTabs: (state, tabs) => {
    state = validateState(state)
    tabs = validateTabs(tabs)
    return state.set('tabs', tabs)
  },

  updateTabValue: (state, tabValue, replace = false) => {
    tabValue = validateTabValue(tabValue)
    const tabs = state.get('tabs')
    const index = getTabInternalIndexByTabId(state, tabValue.get('tabId'))
    if (index === tabState.TAB_ID_NONE) {
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
    if (!replace) {
      tabValue = currentTabValue.mergeDeep(tabValue)
    }

    state = updateLastActive(state, currentTabValue, tabValue)
    return state.set('tabs', tabs.delete(index).insert(index, tabValue))
  },

  replaceTabValue: (state, tabId, newTabValue) => {
    state = validateState(state)
    newTabValue = makeImmutable(newTabValue)
    // update tab
    const index = getTabInternalIndexByTabId(state, tabId)
    const oldTabValue = state.getIn(['tabs', index])
    if (index == null || index === -1) {
      console.error(`tabState: cannot replace tab ${tabId} as tab's index did not exist in state`, { index })
      return state
    }
    let mergedTabValue = oldTabValue.mergeDeep(newTabValue)
    if (mergedTabValue.has('frame')) {
      mergedTabValue = mergedTabValue.mergeIn(['frame'], {
        tabId: newTabValue.get('tabId'),
        guestInstanceId: newTabValue.get('guestInstanceId')
      })
    }
    mergedTabValue = mergedTabValue.set('windowId', oldTabValue.get('windowId'))
    state = state.set('tabs', state.get('tabs').delete(index).insert(index, mergedTabValue))
    // update tabId at tabsInternal index
    state = deleteTabsInternalIndex(state, oldTabValue)
    state = updateTabsInternalIndex(state, 0)
    return state
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

  updateFrame: (state, action, shouldDebugTabEvents = false) => {
    state = validateState(state)
    action = validateAction(action)
    const tabId = action.getIn(['frame', 'tabId'])

    if (!tabId) {
      if (shouldDebugTabEvents) {
        console.log(`Tab [${tabId}] frame changed for tab - no tabId provided!`)
      }
      return state
    }

    let tabValue = tabState.getByTabId(state, tabId)
    if (!tabValue) {
      if (shouldDebugTabEvents) {
        console.log(`Tab [${tabId}] frame changed for tab - tab not found in state, probably a temporary frame`)
      }
      return state
    }

    if (shouldDebugTabEvents) {
      console.log(`Tab [${tabId}] frame changed for tab`)
    }
    const frameValue = action.get('frame')
    tabValue = tabValue.set('frame', makeImmutable(frameValue))
    return tabState.updateTabValue(state, tabValue)
  },

  getTabPropertyByTabId: (state, tabId, property, defaultValue = null) => {
    state = validateState(state)
    tabId = validateId('tabId', tabId)
    if (tabId === tabState.TAB_ID_NONE) {
      return defaultValue
    }
    const tab = tabState.getByTabId(state, tabId)
    assert.ok(tab, `Could not find tab for ${tabId}`)
    const val = tab.get(property)
    return val == null ? defaultValue : val
  },

  getWindowId: (state, tabId) => {
    return tabState.getTabPropertyByTabId(state, tabId, 'windowId', windowState.WINDOW_ID_NONE)
  },

  isIncognito: (state, tabId) => {
    return tabState.getTabPropertyByTabId(state, tabId, 'incognito', false)
  },

  canGoForward: (state, tabId) => {
    try {
      return tabState.getTabPropertyByTabId(state, tabId, 'canGoForward', false)
    } catch (e) {
      return false
    }
  },

  canGoBack: (state, tabId) => {
    try {
      return tabState.getTabPropertyByTabId(state, tabId, 'canGoBack', false)
    } catch (e) {
      return false
    }
  },

  isShowingMessageBox: (state, tabId) => {
    try {
      return tabState.getTabPropertyByTabId(state, tabId, 'messageBoxDetail', false)
    } catch (e) {
      return false
    }
  },

  getTitle: (state, tabId) => {
    return tabState.getTabPropertyByTabId(state, tabId, 'title', '')
  },

  getOpenerTabId: (state, tabId) => {
    const openerTabId = tabState.getTabPropertyByTabId(state, tabId, 'openerTabId', tabState.TAB_ID_NONE)
    if (openerTabId !== tabState.TAB_ID_NONE) {
      // Validate that tab exists
      const tab = tabState.getByTabId(state, openerTabId)
      if (tab) {
        return openerTabId
      }
    }
    return tabState.TAB_ID_NONE
  },

  getIndex: (state, tabId) => {
    return tabState.getTabPropertyByTabId(state, tabId, 'index', -1)
  },

  isActive: (state, tabId) => {
    return tabState.getTabPropertyByTabId(state, tabId, 'active', false)
  },

  // TOOD(bridiver) - make everything work with TAB_ID_ACTIVE
  resolveTabId: (state, tabId) => {
    if (tabId == null) {
      tabId = tabState.TAB_ID_NONE
    }
    if (tabId === tabState.TAB_ID_ACTIVE) {
      tabId = tabState.getActiveTabId(state)
    }
    return validateId('tabId', tabId)
  },

  getFramePathByTabId: (state, tabId) => {
    tabId = tabState.resolveTabId(state, tabId)
    state = makeImmutable(state)

    if (tabId === tabState.TAB_ID_NONE) {
      return null
    }

    if (state.get('tabs') && !state.get('frames')) {
      const path = tabState.getPathByTabId(state, tabId)
      if (path == null) {
        return null
      }
      return path.concat(['frame'])
    } else {
      return frameState.getPathByTabId(state, tabId)
    }
  },

  getActiveTab: (state, windowId = windowState.getActiveWindowId(state)) => {
    state = validateState(state)
    windowId = validateId('windowId', windowId)
    return state.get('tabs').find((tab) => tab.get('active') === true && tab.get('windowId') === windowId)
  },

  getActiveTabId: (state, windowId = windowState.getActiveWindowId(state)) => {
    const tab = tabState.getActiveTab(state, windowId)
    return tab ? tab.get('tabId') : tabState.TAB_ID_NONE
  },

  getFrameByTabId: (state, tabId) => {
    const path = tabState.getFramePathByTabId(state, tabId)
    if (path == null) {
      return null
    }
    return state.getIn(tabState.getFramePathByTabId(state, tabId))
  },

  isSecure: (state, tabId) => {
    const frame = tabState.getFrameByTabId(state, tabId)
    return frame ? frameStateUtil.isFrameSecure(frame) : null
  },

  isLoading: (state, tabId) => {
    const frame = tabState.getFrameByTabId(state, tabId)
    return frame ? frameStateUtil.isFrameLoading(frame) : null
  },

  startLoadTime: (state, tabId) => {
    const frame = tabState.getFrameByTabId(state, tabId)
    return frame ? frameStateUtil.startLoadTime(frame) : null
  },

  endLoadTime: (state, tabId) => {
    const frame = tabState.getFrameByTabId(state, tabId)
    return frame ? frameStateUtil.endLoadTime(frame) : null
  },

  getHistory: (state, tabId) => {
    const frame = tabState.getFrameByTabId(state, tabId)
    return frame ? frameStateUtil.getHistory(frame) : null
  },

  getLocation: (state, tabId) => {
    const frame = tabState.getFrameByTabId(state, tabId)
    return (frame && frame.get('location')) || ''
  },

  getPersistentState: (state) => {
    state = makeImmutable(state)

    state = tabState.removeTabField(state, 'messageBoxDetail')
    state = tabState.removeTabField(state, 'frame')
    state = state.delete('tabsInternal')
    return state.set('tabs', Immutable.List())
  },

  setNavigationState: (state, tabId, navigationState) => {
    const tabValue = tabState.getByTabId(state, tabId)
    if (!tabValue) {
      return state
    }
    const path = tabState.getPathByTabId(state, tabId)
    return path ? state.setIn(path.concat(['navigationState']), navigationState) : state
  },

  setNavigationProgressPercent: (state, tabId, navigationProgressPercent) => {
    const path = tabState.getPathByTabId(state, tabId)
    if (path) {
      state = state.setIn(path.concat(['navigationProgressPercent']), navigationProgressPercent)
    }
    return state
  },

  getNavigationProgressPercent: (state, tabId, navigationProgressPercent) => {
    const path = tabState.getPathByTabId(state, tabId)
    return path
      ? state.getIn(path.concat(['navigationProgressPercent']), null)
      : null
  },

  getNavigationState: (state, tabId) => {
    const path = tabState.getPathByTabId(state, tabId)
    return path ? state.getIn(path.concat(['navigationState']), Immutable.Map()) : null
  },

  getVisibleEntry: (state, tabId) => {
    const navigationState = tabState.getNavigationState(state, tabId)
    return navigationState ? navigationState.get('visibleEntry', '') : null
  },

  getVisibleURL: (state, tabId) => {
    const entry = tabState.getVisibleEntry(state, tabId)
    return entry ? entry.get('url') : ''
  },

  getVisibleOrigin: (state, tabId) => {
    const entry = tabState.getVisibleEntry(state, tabId)
    // plain js in browser, immutable in renderer
    const origin = entry ? entry.get ? entry.get('origin') : entry.origin : ''
    // TODO(bridiver) - all origins in browser-laptop should be changed to have a trailing slash to match chromium
    return (origin || '').replace(/\/$/, '')
  },

  getVisibleVirtualURL: (state, tabId) => {
    const entry = tabState.getVisibleEntry(state, tabId)
    return entry ? entry.get('virtualURL') : ''
  },

  setTabStripWindowId: (state, tabId, windowId) => {
    let path = tabState.getPathByTabId(state, tabId)
    if (!path) {
      console.error(`setTabStripWindowId: tab with ID ${tabId} not found!`)
      return state
    }
    path = [...path, 'tabStripWindowId']
    // handle clear window
    if (windowId == null || windowId === -1) {
      return state.deleteIn(path)
    }
    // handle set window
    return state.setIn(path, windowId)
  },

  setZoomPercent: (state, tabId, zoomPercent) => {
    let path = tabState.getPathByTabId(state, tabId)
    if (!path) {
      console.error(`setZoomPercent: tab with ID ${tabId} not found!`)
      return state
    }
    if (typeof zoomPercent !== 'number') {
      console.error(`setZoomPercent: bad value for zoomPercent: ${zoomPercent}`)
      return state
    }
    path = [...path, 'zoomPercent']
    return state.setIn(path, zoomPercent)
  }
}

module.exports = tabState
