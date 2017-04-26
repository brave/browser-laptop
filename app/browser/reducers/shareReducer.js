/* This SourceCode Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const {makeImmutable} = require('../../common/state/immutableUtil')
const {emailActiveTab} = require('../share')

const shareReducer = (state, action) => {
  action = makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_EMAIL_ACTIVE_TAB_REQUESTED:
      state = emailActiveTab(state, action.get('windowId'))
      break
  }
  return state
}

module.exports = shareReducer
