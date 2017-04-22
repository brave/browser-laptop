/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const tabs = require('../tabs')
const {getWebContents} = require('../webContentsCache')
const tabState = require('../../common/state/tabState')
const windowConstants = require('../../../js/constants/windowConstants')
const {makeImmutable} = require('../../common/state/immutableUtil')
const {getFlashResourceId} = require('../../../js/flash')
const Immutable = require('immutable')
const dragTypes = require('../../../js/constants/dragTypes')
const {frameOptsFromFrame} = require('../../../js/state/frameStateUtil')

const tabsReducer = (state, action) => {
  action = makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE:
      state = tabs.init(state, action)
      break
    case appConstants.APP_TAB_CREATED:
      state = tabState.maybeCreateTab(state, action)
      break
    case appConstants.APP_TAB_MOVED: {
      const tabId = action.get('tabId')
      const frameOpts = action.get('frameOpts')
      const browserOpts = action.get('browserOpts') || new Immutable.Map()
      const windowId = action.get('windowId') || -1
      state = tabs.moveTo(state, tabId, frameOpts, browserOpts, windowId)
      break
    }
    case appConstants.APP_CREATE_TAB_REQUESTED:
      state = tabs.createTab(state, action)
      break
    case appConstants.APP_MAYBE_CREATE_TAB_REQUESTED:
      state = tabs.maybeCreateTab(state, action)
      break
    case appConstants.APP_TAB_UPDATED:
      state = tabState.maybeCreateTab(state, action)
      break
    case appConstants.APP_TAB_CLOSED:
      state = tabs.removeTab(state, action)
      break
    case appConstants.APP_ALLOW_FLASH_ONCE:
    case appConstants.APP_ALLOW_FLASH_ALWAYS:
      {
        const webContents = getWebContents(action.get('tabId'))
        if (webContents && !webContents.isDestroyed() && webContents.getURL() === action.get('url')) {
          webContents.authorizePlugin(getFlashResourceId())
        }
        break
      }
    case appConstants.APP_TAB_CLONED:
      state = tabs.clone(state, action)
      break
    case appConstants.APP_TAB_PINNED:
      state = tabs.pin(state, action)
      break
    case windowConstants.WINDOW_SET_AUDIO_MUTED:
      state = tabs.setAudioMuted(state, action)
      break
    case windowConstants.WINDOW_SET_ACTIVE_FRAME:
      state = tabs.setActive(state, action)
      break
    case appConstants.APP_TAB_TOGGLE_DEV_TOOLS:
      state = tabs.toggleDevTools(state, action)
      break
    case appConstants.APP_LOAD_URL_REQUESTED:
      state = tabs.loadURL(state, action)
      break
    case appConstants.APP_LOAD_URL_IN_ACTIVE_TAB_REQUESTED:
      state = tabs.loadURLInActiveTab(state, action)
      break
    case appConstants.APP_FRAME_CHANGED:
      state = tabState.updateFrame(state, action)
      break
    case appConstants.APP_DRAG_STOPPED: {
      const dragData = state.get('dragData')
      if (dragData.get('type') === dragTypes.TAB) {
        const frame = dragData.get('data')
        const frameOpts = frameOptsFromFrame(frame).toJS()
        const browserOpts = { positionByMouseCursor: true }
        if (dragData) {
          frameOpts.indexByFrameKey = dragData.getIn(['dragOverData', 'draggingOverKey'])
          frameOpts.prependIndexByFrameKey = dragData.getIn(['dragOverData', 'draggingOverLeftHalf'])
        }
        state = tabs.moveTo(state, frame.get('tabId'), frameOpts, browserOpts, dragData.get('dropWindowId'))
      }
      break
    }
  }
  return state
}

module.exports = tabsReducer
