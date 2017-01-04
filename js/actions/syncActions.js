/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const AppDispatcher = require('../dispatcher/appDispatcher')
const syncConstants = require('../constants/syncConstants')

const syncActions = {
  addSite: function (item) {
    AppDispatcher.dispatch({
      actionType: syncConstants.SYNC_ADD_SITE,
      item
    })
  },

  updateSite: function (item) {
    AppDispatcher.dispatch({
      actionType: syncConstants.SYNC_UPDATE_SITE,
      item
    })
  },

  removeSite: function (item) {
    AppDispatcher.dispatch({
      actionType: syncConstants.SYNC_REMOVE_SITE,
      item
    })
  }
}

module.exports = syncActions
