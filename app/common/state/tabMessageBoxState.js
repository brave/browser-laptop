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
    const detail = action.get('detail')
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
    return tabMessageBoxState.show(state, action)
  },

  removeDetail: (state, action) => {
    state = makeImmutable(state)
    action = makeImmutable(action)
    const tabId = action.get('tabId')
    let tabValue = tabState.getByTabId(state, tabId)

    if (!tabValue) {
      return state
    }

    tabValue = tabValue.delete(messageBoxDetail)
    return tabState.updateTab(state, {tabValue, replace: true})
  }
}

module.exports = tabMessageBoxState
