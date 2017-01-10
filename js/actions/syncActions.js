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
  },

  clearHistory: function () {
    AppDispatcher.dispatch({
      actionType: syncConstants.SYNC_CLEAR_HISTORY
    })
  },

  clearSiteSettings: function () {
    AppDispatcher.dispatch({
      actionType: syncConstants.SYNC_CLEAR_SITE_SETTINGS
    })
  },

  addSiteSetting: function (hostPattern, item) {
    AppDispatcher.dispatch({
      actionType: syncConstants.SYNC_ADD_SITE_SETTING,
      item,
      hostPattern
    })
  },

  updateSiteSetting: function (hostPattern, item) {
    AppDispatcher.dispatch({
      actionType: syncConstants.SYNC_UPDATE_SITE_SETTING,
      item,
      hostPattern
    })
  },

  removeSiteSetting: function (hostPattern, item) {
    AppDispatcher.dispatch({
      actionType: syncConstants.SYNC_REMOVE_SITE_SETTING,
      item,
      hostPattern
    })
  }
}

module.exports = syncActions
