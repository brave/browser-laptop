/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const { makeImmutable } = require('./immutableUtil')

let transientFields = ['tabId', 'windowId']

const tabState = {
  defaultTabState: makeImmutable({
    windowId: -1,
    frameKey: -1,
    tabId: -1
  }),

  getTabIndexByTabId: (state, tabId) => {
    return state.get('tabs').findIndex((tab) => tab.get('tabId') === tabId)
  },

  createTab: (props) => {
    props = makeImmutable(props)
    return tabState.defaultTabState.merge(props)
  },

  getOrCreateByTabId: (state, tabId) => {
    let tab = tabState.getByTabId(state, tabId)
    return tab || tabState.createTab({tabId})
  },

  getByTabId: (state, tabId) => {
    return state.get('tabs').find((tab) => tab.get('tabId') === tabId)
  },

  closeTab: (state, tabId) => {
    let index = tabState.getTabIndexByTabId(state, tabId)
    if (index === -1) {
      return state
    }

    let tabs = state.get('tabs').delete(index)
    state = state.set('tabs', tabs)
    return state
  },

  updateTab: (state, tabId, tab) => {
    let tabs = state.get('tabs')
    let index = tabState.getTabIndexByTabId(state, tabId)
    tabs = tabs.delete(index).insert(index, tab)
    return state.set('tabs', tabs)
  },

  addTransientFields: (fields) => {
    transientFields = transientFields.concat(fields)
  },

  getTransientFields: () => {
    return transientFields
  },

  getPersistentTabState: (tab) => {
    tab = makeImmutable(tab)
    tabState.getTransientFields().forEach((field) => {
      tab = tab.delete(field)
    })
    return tab
  }
}

module.exports = tabState
