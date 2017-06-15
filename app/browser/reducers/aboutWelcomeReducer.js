/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const {makeImmutable} = require('../../common/state/immutableUtil')

const aboutWelcomeReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_ACTIVATE_WELCOME_SCREEN:
      state = state.setIn(['about', 'welcome', 'showOnLoad'], action.get('activateWelcomeScreen'))
      break
  }
  return state
}

module.exports = aboutWelcomeReducer
