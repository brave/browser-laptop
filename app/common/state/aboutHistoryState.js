/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {makeImmutable} = require('./immutableUtil')
const historyUtil = require('../lib/historyUtil')

const aboutHistoryState = {
  getHistory: (state) => {
    state = makeImmutable(state)
    return state.getIn(['about', 'history'])
  },
  setHistory: (state) => {
    state = makeImmutable(state)
    state = state.setIn(['about', 'history', 'entries'],
      historyUtil.getHistory(state.get('sites')))
    return state.setIn(['about', 'history', 'updatedStamp'], new Date().getTime())
  }
}

module.exports = aboutHistoryState
