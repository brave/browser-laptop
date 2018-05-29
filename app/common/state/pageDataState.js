/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// States
const tabState = require('./tabState')

// Utils
const pageDataUtil = require('../lib/pageDataUtil')
const {makeImmutable} = require('./immutableUtil')

const pageDataState = {
  addInfo: (state, data) => {
    if (data == null) {
      return state
    }

    data = makeImmutable(data)

    const key = pageDataUtil.getInfoKey(data.get('url'))

    data = data.set('key', key)
    state = state.setIn(['pageData', 'last', 'info'], key)
    return state.setIn(['pageData', 'info', key], data)
  },

  resetInfo: (state) => {
    return state.setIn(['pageData', 'last', 'info'], '')
  },

  getLastInfo: (state) => {
    const key = state.getIn(['pageData', 'last', 'info'])

    if (key == null) {
      return Immutable.Map()
    }

    return state.getIn(['pageData', 'info', key], Immutable.Map())
  },

  getLastActiveTabId: (state) => {
    return state.getIn(['pageData', 'last', 'tabId'])
  },

  setLastActiveTabId: (state, tabId) => {
    if (tabId == null) {
      tabId = tabState.TAB_ID_NONE
    }

    return state.setIn(['pageData', 'last', 'tabId'], tabId)
  },

  saveLastClosedTab: (state, tabValue) => {
    if (tabValue == null) {
      return state
    }

    if (tabValue.get('incognito')) {
      return state
    }

    return state.setIn(['pageData', 'last', 'closedTabValue'], tabValue)
  },

  getLastClosedTab: (state, tabId) => {
    if (tabId == null) {
      return Immutable.Map()
    }

    const lastTab = state.getIn(['pageData', 'last', 'closedTabValue']) || Immutable.Map()

    if (lastTab.get('id') === tabId) {
      return lastTab
    }

    return Immutable.Map()
  },

  resetPageData: (state) => {
    return state
      .setIn(['pageData', 'info'], Immutable.Map())
      .setIn(['pageData', 'last', 'info'], null)
      .setIn(['pageData', 'last', 'tabId'], null)
      .setIn(['pageData', 'last', 'closedTabValue'], null)
  }
}

module.exports = pageDataState
