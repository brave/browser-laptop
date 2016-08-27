/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const tabState = require('./tabState')
const { makeImmutable } = require('./immutableUtil')

const loginRequiredDetail = 'loginRequiredDetail'
tabState.addTransientFields([loginRequiredDetail])

const basicAuthState = {
  setLoginRequiredDetail: (appState, tabId, detail) => {
    appState = makeImmutable(appState)
    detail = makeImmutable(detail)
    let tab = tabState.getOrCreateByTabId(appState, tabId)
    if (!detail || detail.size === 0) {
      tab = tab.delete(loginRequiredDetail)
    } else {
      tab = tab.set(loginRequiredDetail, detail)
    }
    return tabState.updateTab(appState, tabId, tab)
  },

  getLoginRequiredDetail: (appState, tabId) => {
    appState = makeImmutable(appState)
    let tab = tabState.getByTabId(appState, tabId)
    return tab && tab.get(loginRequiredDetail)
  },

  setLoginResponseDetail: (appState, tabId, detail) => {
    appState = makeImmutable(appState)
    let tab = tabState.getByTabId(appState, tabId)
    if (!tab) {
      return appState
    }
    tab = tab.delete(loginRequiredDetail)
    return tabState.updateTab(appState, tabId, tab)
  }
}

module.exports = basicAuthState
