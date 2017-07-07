/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const syncPendState = require('../../common/state/syncPendState')

const syncReducer = (state, action) => {
  switch (action.actionType) {
    case appConstants.APP_SET_STATE:
      state = syncPendState.initPendingRecords(state)
      break
    case appConstants.APP_PENDING_SYNC_RECORDS_ADDED:
      state = syncPendState.pendRecords(state, action.records)
      break
    case appConstants.APP_PENDING_SYNC_RECORDS_REMOVED:
      state = syncPendState.confirmRecords(state, action.records)
      break
  }
  return state
}

module.exports = syncReducer
