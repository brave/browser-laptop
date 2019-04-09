// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

const appConstants = require('../../../js/constants/appConstants')

module.exports = function (state, action) {
  switch (action.actionType) {
    case appConstants.APP_SET_STATE:
      // Set obsolete warn to now if we don't have yet
      if (!state.has('deprecatedOn')) {
        state = state.set('deprecatedOn', new Date().getTime())
      }
      break
  }
  return state
}
