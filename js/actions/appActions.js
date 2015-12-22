/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const AppDispatcher = require('../dispatcher/appDispatcher')
const AppConstants = require('../constants/appConstants')
const ipc = global.require('electron').ipcRenderer
const messages = require('../constants/messages')

const AppActions = {
  /**
   * Dispatches an event to the main process to create a new window
   */
  newWindow: function () {
    ipc.send(messages.NEW_WINDOW)
  },

  /**
   * Dispatches an event to the main process to update the browser
   */
  updateRequested: function () {
    console.log('appActions updateRequested')
    ipc.send(messages.UPDATE_REQUESTED)
  },

  /**
   * Adds a site to the site list
   * @param {Object} frameProps - Properties of the frame in question
   * @param {string} tag - A tag to associate with the site. e.g. bookmarks.
   */
  addSite: function (frameProps, tag) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_ADD_SITE,
      frameProps,
      tag
    })
  },

  /**
   * Removes a site from the site list
   * @param {Object} frameProps - Properties of the frame in question
   * @param {string} tag - A tag to associate with the site. e.g. bookmarks.
   */
  removeSite: function (frameProps, tag) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_REMOVE_SITE,
      frameProps,
      tag
    })
  }
}

module.exports = AppActions
