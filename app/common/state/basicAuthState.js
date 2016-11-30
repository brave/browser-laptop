/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const tabState = require('./tabState')
const {makeImmutable} = require('./immutableUtil')

const loginRequiredDetail = 'loginRequiredDetail'

const basicAuthState = {
  setLoginRequiredDetail: (state, action) => {
    state = makeImmutable(state)
    action = makeImmutable(action)
    let tabId = action.get('tabId')
    let detail = action.get('detail')
    let tabValue = tabState.getByTabId(state, tabId)

    if (!tabValue) {
      return state
    }

    if (!detail || detail.size === 0) {
      tabValue = tabValue.delete(loginRequiredDetail)
    } else {
      tabValue = tabValue.set(loginRequiredDetail, detail)
    }
    return tabState.updateTab(state, {tabValue, replace: true})
  },

  getLoginRequiredDetail: (state, tabId) => {
    if (!tabId) {
      return
    }
    state = makeImmutable(state)
    let tabValue = tabState.getByTabId(state, tabId)
    return tabValue && tabValue.get(loginRequiredDetail)
  },

  setLoginResponseDetail: (state, action) => {
    state = makeImmutable(state)
    action = makeImmutable(action)
    let tabId = action.get('tabId')
    let tabValue = tabState.getByTabId(state, tabId)

    if (!tabValue) {
      return state
    }

    tabValue = tabValue.delete(loginRequiredDetail)
    return tabState.updateTab(state, {tabValue, replace: true})
  }
}

module.exports = basicAuthState
