/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const assert = require('assert')
const { makeImmutable, isMap } = require('./immutableUtil')
const uuid = require('uuid')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  return state
}

let contextMenuDetail = Immutable.Map()

const api = {
  setContextMenu: (windowState, detail) => {
    detail = makeImmutable(detail)
    windowState = validateState(windowState)

    if (!detail) {
      if (contextMenuDetail.get('type') === 'hamburgerMenu') {
        windowState = windowState.set('hamburgerMenuWasOpen', true)
      } else if (contextMenuDetail.get('type') === 'onBackLongPressMenuWasOpen') {
        console.log("setContextMenu something actually fucking worked...")
        windowState = windowState.set('onBackLongPressMenuWasOpen', true)
      } else {
        windowState = windowState.set('hamburgerMenuWasOpen', false)
        windowState = windowState.set('onBackLongPressMenuWasOpen', false)
      }
      contextMenuDetail = Immutable.Map()
      windowState = windowState.delete('contextMenuDetail')
    } else {
      if (!(detail.get('type') === 'hamburgerMenu' && windowState.get('hamburgerMenuWasOpen'))) {
        contextMenuDetail = detail
        windowState = windowState.set('contextMenuDetail', uuid())
      }
      windowState = windowState.set('hamburgerMenuWasOpen', false)
      if (!(detail.get('type') === 'onBackLongPressMenuWasOpen' && windowState.get('onBackLongPressMenuWasOpen'))) {
        console.log("setContextMenu something actually fucking worked...")
        contextMenuDetail = detail
        windowState = windowState.set('contextMenuDetail', uuid())
      }
      windowState = windowState.set('hamburgerMenuWasOpen', false)
      windowState = windowState.set('onBackLongPressMenuWasOpen', false)
    }
    return windowState
  },

  getContextMenu: (windowState) => {
    windowState = validateState(windowState)
    return contextMenuDetail
  },

  isHamburgerMenuOpen: (windowState) => validateState(windowState).get('hamburgerMenuWasOpen'),

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
