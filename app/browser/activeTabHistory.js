/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

// static
const activeTabsByWindow = new Map()

const api = {
  /**
   * Inform this store that a tab is active for a window.
   * This information will be added to index 0 in the
   * active-tab history for the window.
   */
  setActiveTabForWindow: function (windowId, tabId) {
    const existing = activeTabsByWindow.get(windowId)
    if (existing) {
      existing.unshift(tabId)
    } else {
      activeTabsByWindow.set(windowId, [ tabId ])
    }
  },

  /**
   * Retrieve the tabId that was active at the specified history index,
   * 0 for most recent (default)
   */
  getActiveTabForWindow: function (windowId, historyIndex = 0) {
    // get history of active tabs for specified window
    const windowActiveTabs = activeTabsByWindow.get(windowId)
    // handle no history for specified window
    if (!windowActiveTabs || !windowActiveTabs.length) {
      return null
    }
    // verify specified index in active-tab history exists
    const lastIndex = windowActiveTabs.length - 1
    if (lastIndex < historyIndex) {
      return null
    }
    // get tabId at specified index in active-tab history
    return windowActiveTabs[historyIndex]
  },

  /**
   * Removes specified tab from active-tab history in specified window
   */
  clearTabFromWindow: function (windowId, tabId) {
    const windowActiveTabs = activeTabsByWindow.get(windowId)
    if (windowActiveTabs && windowActiveTabs.length) {
      activeTabsByWindow.set(windowId, windowActiveTabs.filter(previousTabId => previousTabId !== tabId))
    }
  },

  /**
   * Forget history of active tabs for specified window
   */
  clearTabbedWindow: function (windowId) {
    activeTabsByWindow.delete(windowId)
  }
}

module.exports = api
