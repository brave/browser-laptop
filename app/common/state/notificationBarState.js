/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const Immutable = require('immutable')
const {makeImmutable, isMap} = require('./immutableUtil')

const api = {
  validateState: function (state) {
    state = makeImmutable(state)
    assert.ok(isMap(state), 'state must be an Immutable.Map')
    return state
  }
}

const notificationBarState = {
  /**
   * Gets an immutable list of notifications
   * @param {Map} appState - The app state object
   * @return {List} - immutable list of notifications
   */
  getNotifications: (state) => {
    state = api.validateState(state)
    return state.get('notifications', Immutable.List())
  },

  /**
   * Gets an immutable list of ledger notifications
   * @param {Map} appState - The app state object
   * @return {List} - immutable list of ledger notifications
   */
  getLedgerNotifications: (state) => {
    const notifications = notificationBarState.getNotifications(state)
    return notifications.filter(item => item.get('from') === 'ledger')
  }
}

module.exports = notificationBarState
