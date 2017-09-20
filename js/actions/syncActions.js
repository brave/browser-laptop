/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const appDispatcher = require('../dispatcher/appDispatcher')
const syncConstants = require('../constants/syncConstants')

const syncActions = {
  addSites: function (items) {
    appDispatcher.dispatch({
      actionType: syncConstants.SYNC_ADD_SITES,
      items
    })
  },

  removeSites: function (items) {
    appDispatcher.dispatch({
      actionType: syncConstants.SYNC_REMOVE_SITES,
      items
    })
  },

  clearHistory: function () {
    appDispatcher.dispatch({
      actionType: syncConstants.SYNC_CLEAR_HISTORY
    })
  },

  clearSiteSettings: function () {
    appDispatcher.dispatch({
      actionType: syncConstants.SYNC_CLEAR_SITE_SETTINGS
    })
  }
}

module.exports = syncActions
