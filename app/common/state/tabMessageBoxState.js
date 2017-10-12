/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const tabState = require('./tabState')
const config = require('../../../js/constants/config.js')
const {makeImmutable, isList, isMap} = require('./immutableUtil')

const messageBoxDetail = 'messageBoxDetail'

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isList(state.get('tabs')), 'state must contain an Immutable.List of tabs')
  return state
}

const validateId = function (propName, id) {
  assert.ok(id, `${propName} cannot be null`)
  id = parseInt(id)
  assert.ok(id === -1 || id > 0, `${propName} must be positive`)
  return id
}

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

  hasMessageBoxDetail: (state, tabId) => {
    return tabMessageBoxState.getDetail(state, tabId) != null
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
  },

  getPropertyByTabId: (state, tabId, property) => {
    state = validateState(state)
    tabId = validateId('tabId', tabId)
    const tab = tabState.getByTabId(state, tabId)

    if (tab) {
      return tab.getIn([messageBoxDetail, property])
    }

    return undefined
  },

  getSuppress: (state, tabId) => {
    return tabMessageBoxState.getPropertyByTabId(state, tabId, 'suppress') || false
  },

  getShowSuppress: (state, tabId) => {
    return tabMessageBoxState.getPropertyByTabId(state, tabId, 'showSuppress') || false
  },

  getTitle: (state, tabId) => {
    const title = tabMessageBoxState.getPropertyByTabId(state, tabId, 'title') || ''
    return title.replace(config.braveExtensionId, 'Brave')
  },

  getButtons: (state, tabId) => {
    return tabMessageBoxState.getPropertyByTabId(state, tabId, 'buttons') || makeImmutable(['ok'])
  }
}

module.exports = tabMessageBoxState
