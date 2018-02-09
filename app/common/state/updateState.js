/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
const assert = require('assert')

const updateStatus = require('../../../js/constants/updateStatus')
const {makeImmutable, isMap} = require('../../common/state/immutableUtil')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  return state
}

const updateState = {
  isUpdateVisible: (state) => {
    state = validateState(state)
    const isVerbose = updateState.getUpdateProp(state, 'verbose') || false
    const status = updateState.getUpdateProp(state, 'status')

    // When verbose is not set we only want to show update available
    // prompts, because otherwise the check is a background check and
    // the user shouldn't be bothered.
    return !(
      !status ||
      (
        !isVerbose &&
        status !== updateStatus.UPDATE_AVAILABLE
      ) ||
      status === updateStatus.UPDATE_NONE ||
      status === updateStatus.UPDATE_APPLYING_RESTART ||
      status === updateStatus.UPDATE_APPLYING_NO_RESTART
    )
  },

  getUpdateStatus: (state) => {
    state = validateState(state)
    let status = updateState.getUpdateProp(state, 'status')

    // The only difference between the deferred and non deferred variant is that
    // the deferred allows hiding.  Otherwise you couldn't hide available prompts.
    if (status === updateStatus.UPDATE_AVAILABLE_DEFERRED) {
      status = updateStatus.UPDATE_AVAILABLE
    }

    return status
  },

  getUpdateProp: (state, prop) => {
    state = validateState(state)
    if (prop == null) {
      return null
    }

    return state.getIn(['updates', prop])
  },

  setUpdateProp: (state, prop, value) => {
    state = validateState(state)
    if (prop == null) {
      return state
    }

    return state.setIn(['updates', prop], value)
  },

  deleteUpdateProp: (state, prop) => {
    state = validateState(state)
    if (prop == null) {
      return state
    }

    return state.deleteIn(['updates', prop])
  }
}

module.exports = updateState
