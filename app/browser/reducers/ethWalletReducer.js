/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const settings = require('../../../js/constants/settings')
const {configureEthWallet} = require('../../extensions')
const appConstants = require('../../../js/constants/appConstants')
const {makeImmutable} = require('../../common/state/immutableUtil')

const ethWalletReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)

  switch (action.get('actionType')) {
    case appConstants.APP_CHANGE_SETTING:
      {
        const key = action.get('key')
        const isEnabled = action.get('value')

        if (isEnabled == null || key !== settings.ETHWALLET_ENABLED) {
          break
        }

        configureEthWallet(isEnabled)
        break
      }
  }
  return state
}

module.exports = ethWalletReducer
