/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const settings = require('../../../js/constants/settings')
const { getSetting } = require('../../../js/settings')
const aboutNewTabState = require('../../common/state/aboutNewTabState')
const { calculateTopSites } = require('../api/topSites')

const aboutNewTabReducer = (state, action) => {
  switch (action.actionType) {
    case appConstants.APP_SET_STATE:
      const useAlternativePrivateSearchEngine = getSetting(settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE, state.get('settings'))
      const torEnabled = getSetting(settings.USE_TOR_PRIVATE_TABS)
      state = aboutNewTabState.mergeDetails(state, {
        newTabPageDetail: {
          useAlternativePrivateSearchEngine,
          torEnabled
        }
      })
      break
    case appConstants.APP_TOP_SITE_DATA_AVAILABLE:
      state = aboutNewTabState.setSites(state, action.topSites)
      break
    case appConstants.APP_CHANGE_NEW_TAB_DETAIL:
      state = aboutNewTabState.mergeDetails(state, action)
      if (action.refresh) {
        calculateTopSites(true, true)
      }
      break
    case appConstants.APP_CHANGE_SETTING:
      if (action.key === settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE) {
        state = aboutNewTabState.mergeDetails(state, {
          newTabPageDetail: {
            useAlternativePrivateSearchEngine: action.value
          }
        })
      } else if (action.key === settings.USE_TOR_PRIVATE_TABS) {
        state = aboutNewTabState.mergeDetails(state, {
          newTabPageDetail: {
            torEnabled: action.value
          }
        })
      }
  }
  return state
}

module.exports = aboutNewTabReducer
