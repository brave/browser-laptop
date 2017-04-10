/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const windows = require('../windows')
const {makeImmutable} = require('../../common/state/immutableUtil')

const windowsReducer = (state, action) => {
  action = makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE:
      state = windows.init(state, action)
      break
    case appConstants.APP_WINDOW_READY:
      windows.windowReady(action.get('windowId'))
      break
    case appConstants.APP_TAB_PINNED:
      setImmediate(() => {
        // check after the state has been updated
        windows.pinnedTabsChanged()
      })
      break
  }
  return state
}

module.exports = windowsReducer
