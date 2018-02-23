/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const assert = require('assert')

const { makeImmutable, isMap } = require('../state/immutableUtil')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isMap(state.getIn(['cache', 'ledgerVideos'])), 'state must contain ledgerVideos as Immutable.Map')
  return state
}

const getDataByVideoId = (state, key) => {
  state = validateState(state)
  if (key == null) {
    return Immutable.Map()
  }

  return state.getIn(['cache', 'ledgerVideos', key]) || Immutable.Map()
}

const setCacheByVideoId = (state, key, data) => {
  state = validateState(state)
  if (key == null) {
    return state
  }

  data = makeImmutable(data)

  return state.setIn(['cache', 'ledgerVideos', key], data)
}

const mergeCacheByVideoId = (state, key, data) => {
  state = validateState(state)

  if (key == null || data == null) {
    return state
  }

  data = makeImmutable(data)

  if (data.isEmpty()) {
    return state
  }

  return state.mergeIn(['cache', 'ledgerVideos', key], data)
}

module.exports = {
  getDataByVideoId,
  setCacheByVideoId,
  mergeCacheByVideoId
}
