/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const tabMessageBox = require('../tabMessageBox')
const tabMessageBoxState = require('../../common/state/tabMessageBoxState')

const tabMessageBoxReducer = (state, action) => {
  switch (action.actionType) {
    case appConstants.APP_SET_STATE:
      state = tabMessageBox.init(state, action)
      break
    case appConstants.APP_TAB_MESSAGE_BOX_SHOWN:
      state = tabMessageBoxState.show(state, action)
      break
    case appConstants.APP_TAB_MESSAGE_BOX_DISMISSED:
      state = tabMessageBox.close(state, action)
      break
    case appConstants.APP_TAB_MESSAGE_BOX_UPDATED:
      state = tabMessageBoxState.update(state, action)
      break
  }
  return state
}

module.exports = tabMessageBoxReducer
