/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Constants
const appConstants = require('../../../js/constants/appConstants')

// State
const pageDataState = require('../../common/state/pageDataState')
const tabState = require('../../common/state/tabState')

// Utils
const {makeImmutable} = require('../../common/state/immutableUtil')

const pageDataReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case 'event-set-page-info':
      {
        state = pageDataState.addInfo(state, action.get('pageInfo'))
        break
      }
    case appConstants.APP_TAB_CLOSE_REQUESTED:
      {
        const tabFromState = tabState.getByTabId(state, action.get('tabId'))
        state = pageDataState.saveLastClosedTab(state, tabFromState)
      }
  }

  return state
}

module.exports = pageDataReducer
