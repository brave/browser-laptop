/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const aboutNewTabState = require('../../common/state/aboutNewTabState')
const appConstants = require('../../../js/constants/appConstants')

const topSitesReducer = (state, action) => {
  switch (action.actionType) {
    case appConstants.APP_TOP_SITE_DATA_AVAILABLE:
      state = aboutNewTabState.setSites(state, action.topSites)
      break
  }
  return state
}

module.exports = topSitesReducer
