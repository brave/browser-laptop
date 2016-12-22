/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const flash = require('../../../js/flash')
const {makeImmutable} = require('../../common/state/immutableUtil')

const flashReducer = (state, action) => {
  action = makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE:
      flash.init()
      break
    case appConstants.APP_FLASH_PERMISSION_REQUESTED:
      flash.showFlashMessageBox(action.get('location'), action.get('senderTabId'))
      break
  }
  return state
}

module.exports = flashReducer
