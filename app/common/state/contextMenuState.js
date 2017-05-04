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

const api = {
  setContextMenu: (windowState, detail) => {
    detail = makeImmutable(detail)
    windowState = validateState(windowState)

    if (!detail) {
      if (windowState.getIn(['contextMenuDetail', 'type']) === 'hamburgerMenu') {
        windowState = windowState.set('hamburgerMenuWasOpen', true)
      } else {
        windowState = windowState.set('hamburgerMenuWasOpen', false)
      }
      windowState = windowState.delete('contextMenuDetail')
    } else {
      if (!(detail.get('type') === 'hamburgerMenu' && windowState.get('hamburgerMenuWasOpen'))) {
        windowState = windowState.set('contextMenuDetail', detail)
      }
      windowState = windowState.set('hamburgerMenuWasOpen', false)
    }

    return windowState
  },

  selectedIndex: (windowState) => {
    const selectedIndex = windowState.getIn(['ui', 'contextMenu', 'selectedIndex'])
    return (typeof selectedIndex === 'object' &&
      Array.isArray(selectedIndex) &&
      selectedIndex.length > 0)
      ? selectedIndex
      : null
  }
}

module.exports = api
