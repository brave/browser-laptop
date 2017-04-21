/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const { makeImmutable, isMap } = require('./immutableUtil')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  return state
}

const contextMenuState = {
  setContextMenu: (state, detail) => {
    detail = makeImmutable(detail)
    state = validateState(state)

    if (!detail) {
      if (state.getIn(['contextMenuDetail', 'type']) === 'hamburgerMenu') {
        state = state.set('hamburgerMenuWasOpen', true)
      } else {
        state = state.set('hamburgerMenuWasOpen', false)
      }
      state = state.delete('contextMenuDetail')
    } else {
      if (!(detail.get('type') === 'hamburgerMenu' && state.get('hamburgerMenuWasOpen'))) {
        state = state.set('contextMenuDetail', detail)
      }
      state = state.set('hamburgerMenuWasOpen', false)
    }

    return state
  }
}

module.exports = contextMenuState
