/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const tabState = require('./tabState')
const {makeImmutable} = require('./immutableUtil')

const messageBoxDetail = 'messageBoxDetail'

const tabMessageBoxState = {
  show: (state, action) => {
    state = makeImmutable(state)
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    let tabValue = tabId && tabState.getByTabId(state, tabId)

    if (!tabValue) {
      return state
    }

    let detail = action.get('detail')
    if (!detail || detail.size === 0) {
      tabValue = tabValue.delete(messageBoxDetail)
    } else {
      detail = detail.set('opener', tabValue.get('url'))
      tabValue = tabValue.set(messageBoxDetail, detail)
    }
    return tabState.updateTab(state, {tabValue, replace: true})
  },

  getDetail: (state, tabId) => {
    if (typeof tabId !== 'number') {
      return null
    }

    const tabValue = tabState.getByTabId(state, tabId)
    if (tabValue) {
      return tabValue.get(messageBoxDetail) || null
    }
    return null
  },

  update: (state, action) => {
    return tabMessageBoxState.show(state, action)
  },

  removeDetail: (state, action) => {
    state = makeImmutable(state)
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    let tabValue = tabId && tabState.getByTabId(state, tabId)

    if (!tabValue) {
      return state
    }

    tabValue = tabValue.delete(messageBoxDetail)
    return tabState.updateTab(state, {tabValue, replace: true})
  }
}

module.exports = tabMessageBoxState
