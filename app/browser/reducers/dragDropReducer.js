/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const {APP_DRAG_STARTED, APP_DRAG_STOPPED, APP_DATA_DROPPED, APP_DRAGGED_OVER} = require('../../../js/constants/appConstants')
const Immutable = require('immutable')

const dragDropReducer = (state, action) => {
  switch (action.actionType) {
    case APP_DRAG_STARTED:
      state = state.set('dragData', Immutable.fromJS({
        windowId: action.windowId,
        type: action.dragType,
        data: action.dragData
      }))
      break
    case APP_DRAG_STOPPED:
      state = state.delete('dragData')
      break
    case APP_DATA_DROPPED:
      state = state.setIn(['dragData', 'dropWindowId'], action.dropWindowId)
      break
    case APP_DRAGGED_OVER:
      state = state.mergeIn(['dragData', 'dragOverData'], action.draggedOverData)
      break
  }
  return state
}

module.exports = dragDropReducer
