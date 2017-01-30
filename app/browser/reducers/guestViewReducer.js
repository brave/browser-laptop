/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const tabs = require('../tabs')
const {makeImmutable} = require('../../common/state/immutableUtil')

const guestViewReducer = (state, action) => {
  action = makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_GUEST_ATTACHED:
      state = tabs.attachGuest(state, action)
      break
    case appConstants.APP_GUEST_DETACHED:
      state = tabs.detachGuest(state, action)
      break
    case appConstants.APP_WINDOW_FOCUSED:
      console.log('app-window-focused!!!!!!!!!!!!!!!!!!!!!!!!!!!', action.get('windowId'))
      state = tabs.transferPins(state, action)
      break
    case appConstants.APP_GUEST_READY:
      state = tabs.setTabGuest(state, action)
      break
  }
  return state
}

module.exports = guestViewReducer
