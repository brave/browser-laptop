/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const tabs = require('../tabs')
const tabState = require('../../common/state/tabState')
const windowConstants = require('../../../js/constants/windowConstants')
const {makeImmutable} = require('../../common/state/immutableUtil')
const {getFlashResourceId} = require('../../../js/flash')

const tabsReducer = (state, action) => {
  action = makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE:
      state = tabs.init(state, action)
      break
    case appConstants.APP_TAB_CREATED:
      state = tabState.maybeCreateTab(state, action)
      break
    case appConstants.APP_CREATE_TAB_REQUESTED:
      state = tabs.createTab(state, action)
      break
    case appConstants.APP_MAYBE_CREATE_TAB_REQUESTED:
      state = tabs.maybeCreateTab(state, action)
      break
    case appConstants.APP_TAB_UPDATED:
      state = tabState.maybeCreateTab(state, action)
      break
    case appConstants.APP_CLOSE_TAB:
      state = tabs.removeTab(state, action)
      break
    case appConstants.APP_TAB_CLOSED:
      state = tabState.removeTab(state, action)
      break
    case appConstants.APP_ALLOW_FLASH_ONCE:
    case appConstants.APP_ALLOW_FLASH_ALWAYS:
      {
        const webContents = tabs.getWebContents(action.get('tabId'))
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
    case windowConstants.WINDOW_CLOSE_FRAME:
      state = tabState.closeFrame(state, action)
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
  }
  return state
}

module.exports = tabsReducer
