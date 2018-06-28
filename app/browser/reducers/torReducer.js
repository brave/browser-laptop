/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const filtering = require('../../filtering')
const appConstants = require('../../../js/constants/appConstants')

const torReducer = (state, action) => {
  switch (action.actionType) {
    case appConstants.APP_RESTART_TOR:
      filtering.relaunchTor()
      break
    case appConstants.APP_SET_TOR_NEW_IDENTITY:
      filtering.setTorNewIdentity(action.url, action.tabId)
      break
    case appConstants.APP_ON_TOR_INIT_ERROR:
      state = state.setIn(['tor', 'initializationError'], action.message)
      break
    case appConstants.APP_ON_TOR_INIT_SUCCESS:
      state = state.setIn(['tor', 'initializationError'], false).setIn(['tor', 'percentInitialized'], null)
      break
    case appConstants.APP_ON_TOR_INIT_PERCENTAGE:
      state = state.setIn(['tor', 'percentInitialized'], action.percentage)
      break
  }
  return state
}

module.exports = torReducer
