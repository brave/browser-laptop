/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const tabState = require('./tabState')
const {makeImmutable} = require('./immutableUtil')

const messageBoxDetail = 'messageBoxDetail'

const messageBoxState = {
  show: (state, action) => {
    state = makeImmutable(state)
    action = makeImmutable(action)
    let tabId = action.get('tabId')
    let detail = action.get('detail')
    let tabValue = tabState.getByTabId(state, tabId)

    if (!tabValue) {
      return state
    }

    if (!detail || detail.size === 0) {
      tabValue = tabValue.delete(messageBoxDetail)
    } else {
      tabValue = tabValue.set(messageBoxDetail, detail)
    }
    return tabState.updateTab(state, {tabValue, replace: true})
  },

  update: (state, action) => {
    return messageBoxState.show(state, action)
  },

  getDetail: (state, tabId) => {
    if (!tabId) {
      return
    }

    state = makeImmutable(state)
    let tabValue = tabState.getByTabId(state, tabId)
    return tabValue && tabValue.get(messageBoxDetail)
  },

  removeDetail: (state, action) => {
    state = makeImmutable(state)
    action = makeImmutable(action)
    let tabId = action.get('tabId')
    let tabValue = tabState.getByTabId(state, tabId)

    if (!tabValue) {
      return state
    }

    tabValue = tabValue.delete(messageBoxDetail)
    return tabState.updateTab(state, {tabValue, replace: true})
  }
}

module.exports = messageBoxState
