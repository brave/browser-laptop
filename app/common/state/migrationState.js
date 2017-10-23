/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')

const {makeImmutable, isMap} = require('../../common/state/immutableUtil')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isMap(state.get('migrations')), 'state must contain an Immutable.Map of migrations')
  return state
}

const migrationState = {
  setTransitionStatus: (state, value) => {
    state = validateState(state)
    if (value == null) {
      return state
    }

    return state.setIn(['migrations', 'btc2BatTransitionPending'], value)
  },

  setConversionTimestamp: (state, value) => {
    state = validateState(state)
    if (value == null) {
      return state
    }

    return state.setIn(['migrations', 'btc2BatTimestamp'], value)
  },

  setNotifiedTimestamp: (state, value) => {
    state = validateState(state)
    if (value == null) {
      return state
    }

    return state.setIn(['migrations', 'btc2BatNotifiedTimestamp'], value)
  },

  isNewInstall: (state) => {
    state = validateState(state)
    return state.get('firstRunTimestamp') === state.getIn(['migrations', 'batMercuryTimestamp'])
  },

  // we set this values when we initialize 0.19 state and this will be only true when transition is done
  // or when you create wallet on 0.19+ version
  hasUpgradedWallet: (state) => {
    state = validateState(state)
    return state.getIn(['migrations', 'batMercuryTimestamp']) !== state.getIn(['migrations', 'btc2BatTimestamp'])
  },

  // we set this values when we initialize 0.19 state and this will be only true when transition is done
  // or when you create wallet on 0.19+ version
  hasBeenNotified: (state) => {
    state = validateState(state)
    return state.getIn(['migrations', 'batMercuryTimestamp']) !== state.getIn(['migrations', 'btc2BatNotifiedTimestamp'])
  }
}

module.exports = migrationState
