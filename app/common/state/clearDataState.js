/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const assert = require('assert')
const { makeImmutable, isMap } = require('./immutableUtil')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  return state
}

const api = {
  getClearDefaults: (state) => {
    validateState(state)
    const defaults = state.get('clearBrowsingDataDefaults')
    const temp = state.get('tempClearBrowsingData', Immutable.Map())
    return defaults ? defaults.merge(temp) : temp
  }
}

module.exports = api
