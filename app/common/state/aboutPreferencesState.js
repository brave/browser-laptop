/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')

// utils
const {makeImmutable, isMap} = require('../../common/state/immutableUtil')

const validateState = (state) => {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isMap(state.getIn(['about', 'preferences'])), 'state must contain an Immutable.Map of \'about\' \'preferences\'')
  return state
}
const aboutPreferencesState = {
  setBackupStatus: (state, status) => {
    state = validateState(state)
    if (status == null) {
      return state
    }
    const date = new Date().getTime()
    state = aboutPreferencesState.setPreferencesProp(state, 'backupSucceeded', status)
    return aboutPreferencesState.setPreferencesProp(state, 'updatedStamp', date)
  },

  hasBeenBackedUp: (state) => {
    state = validateState(state)
    return (aboutPreferencesState.getPreferencesProp(state, 'backupSucceeded') || aboutPreferencesState.getPreferencesProp(state, 'updatedStamp') != null) || false
  },

  getPreferencesProp: (state, key) => {
    state = validateState(state)
    if (key == null) {
      return null
    }
    return state.getIn(['about', 'preferences', key])
  },

  setPreferencesProp: (state, key, value) => {
    state = validateState(state)
    if (key == null) {
      return state
    }
    return state.setIn(['about', 'preferences', key], value)
  },

  setRecoveryInProgress: (state, inProgress) => {
    state = validateState(state)
    return aboutPreferencesState.setPreferencesProp(state, 'recoveryInProgress', inProgress)
  },

  setRecoveryBalanceRecalculated: (state, hasRecalculated) => {
    state = validateState(state)
    return aboutPreferencesState.setPreferencesProp(state, 'recoveryBalanceRecalculated', hasRecalculated)
  },

  getRecoveryBalanceRecalulated: (state) => {
    state = validateState(state)
    return aboutPreferencesState.getPreferencesProp(state, 'recoveryBalanceRecalculated') || false
  },

  setRecoveryStatus: (state, status) => {
    state = validateState(state)
    const date = new Date().getTime()
    state = aboutPreferencesState.setRecoveryInProgress(state, false)
    state = aboutPreferencesState.setPreferencesProp(state, 'recoverySucceeded', status)
    return aboutPreferencesState.setPreferencesProp(state, 'updatedStamp', date)
  }
}
module.exports = aboutPreferencesState
