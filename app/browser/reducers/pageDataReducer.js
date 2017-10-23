/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// State
const pageDataState = require('../../common/state/pageDataState')

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
  }

  return state
}

module.exports = pageDataReducer
