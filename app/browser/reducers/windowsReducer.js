/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const windowConstants = require('../../../js/constants/windowConstants')
const windowState = require('../../common/state/windowState')
const windows = require('../windows')
const sessionStoreShutdown = require('../../sessionStoreShutdown')
const {makeImmutable} = require('../../common/state/immutableUtil')

const windowsReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE:
      state = windows.init(state, action)
      break
    case appConstants.APP_WINDOW_READY:
      windows.windowReady(action.get('windowId'))
      break
    case appConstants.APP_TAB_UPDATED:
      if (immutableAction.getIn(['changeInfo', 'pinned']) != null) {
        setImmediate(() => {
          windows.pinnedTabsChanged()
        })
      }
      break
    case appConstants.APP_CLOSE_WINDOW:
      windows.closeWindow(action.get('windowId'))
      break
    case appConstants.APP_WINDOW_CLOSED:
      state = windowState.removeWindow(state, action)
      const windowId = action.getIn(['windowValue', 'windowId'])
      sessionStoreShutdown.removeWindowFromCache(windowId)
      windows.cleanupWindow(windowId)
      break
    case appConstants.APP_WINDOW_CREATED:
      state = windowState.maybeCreateWindow(state, action)
      break
    case appConstants.APP_WINDOW_UPDATED:
      state = windowState.maybeCreateWindow(state, action)
      break
    case appConstants.APP_TAB_STRIP_EMPTY:
      windows.closeWindow(action.get('windowId'))
      break
    case appConstants.APP_DEFAULT_WINDOW_PARAMS_CHANGED:
      if (action.get('size')) {
        state = state.setIn(['defaultWindowParams', 'width'], action.getIn(['size', 0]))
        state = state.setIn(['defaultWindowParams', 'height'], action.getIn(['size', 1]))
      }
      if (action.get('position')) {
        state = state.setIn(['defaultWindowParams', 'x'], action.getIn(['position', 0]))
        state = state.setIn(['defaultWindowParams', 'y'], action.getIn(['position', 1]))
      }
      break
    case windowConstants.WINDOW_SHOULD_SET_TITLE:
      windows.setTitle(action.get('windowId'), action.get('title'))
      break
    case windowConstants.WINDOW_SHOULD_MINIMIZE:
      windows.minimize(action.get('windowId'))
      break
    case windowConstants.WINDOW_SHOULD_MAXIMIZE:
      windows.maximize(action.get('windowId'))
      break
    case windowConstants.WINDOW_SHOULD_UNMAXIMIZE:
      windows.unmaximize(action.get('windowId'))
      break
    case windowConstants.WINDOW_SHOULD_EXIT_FULL_SCREEN:
      windows.setFullScreen(action.get('windowId'), false)
      break
    case windowConstants.WINDOW_SHOULD_OPEN_DEV_TOOLS:
      windows.openDevTools(action.get('windowId'))
      break
  }
  return state
}

module.exports = windowsReducer
