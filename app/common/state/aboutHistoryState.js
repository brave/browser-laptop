/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const {makeImmutable} = require('./immutableUtil')
const historyUtil = require('../lib/historyUtil')

const aboutHistoryState = {
  getHistory: (state) => {
    state = makeImmutable(state)
    return state.getIn(['about', 'history'])
  },

  setHistory: (state, sites) => {
    state = makeImmutable(state)
    state = state.setIn(['about', 'history', 'entries'], historyUtil.getHistory(sites))
    return state.setIn(['about', 'history', 'updatedStamp'], new Date().getTime())
  },

  clearHistory: (state) => {
    state = makeImmutable(state)
    state = state.setIn(['about', 'history', 'entries'], Immutable.Map())
    return state.setIn(['about', 'history', 'updatedStamp'], new Date().getTime())
  }
}

module.exports = aboutHistoryState
