/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const {makeImmutable} = require('../../common/state/immutableUtil')

// Actions
const appActions = require('../../../js/actions/appActions')

// Constants
const appConstants = require('../../../js/constants/appConstants')

// Utils
const urlParse = require('../../common/urlParse')
const urlUtil = require('../../../js/lib/urlutil')

const shieldsReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_TOGGLE_SHIELDS:
      {
        const tabId = action.get('tabId')
        const value = action.get('value')
        const isPrivate = action.get('isPrivate')
        const lastCommittedURL = action.get('lastCommittedURL')

        if (!tabId || !lastCommittedURL) {
          break
        }

        const parsedUrl = urlParse(lastCommittedURL)
        const ruleKey = (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:')
        ? `https?://${parsedUrl.host}` : urlUtil.getOrigin(lastCommittedURL)

        appActions.changeSiteSetting(ruleKey, 'shieldsUp', value, isPrivate)
        appActions.loadURLRequested(tabId, lastCommittedURL)
        break
      }
  }
  return state
}

module.exports = shieldsReducer
