/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const AppDispatcher = require('../dispatcher/appDispatcher')
const AppConstants = require('../constants/appConstants')
const messages = require('../constants/messages')

const AppActions = {
  /**
   * Dispatches an event to the main process to replace the app state
   * This is called from the main process on startup before anything else
   *
   * @param {object} appState - Initial app state object (not yet converted to ImmutableJS)
   */
  setState: function (appState) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_STATE,
      appState
    })
  },

  /**
   * Dispatches an event to the main process to create a new window
   */
  newWindow: function (frameOpts, browserOpts, restoredState) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_NEW_WINDOW,
      frameOpts,
      browserOpts,
      restoredState
    })
  },

  closeWindow: function (appWindowId) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_CLOSE_WINDOW,
      appWindowId
    })
  },

  /**
   * Dispatches an event to the main process to update the browser
   */
  updateRequested: function () {
    // TODO - change to dispatcher
    console.log('appActions updateRequested')
    global.require('electron').ipcRenderer.send(messages.UPDATE_REQUESTED)
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
  },

  /**
   * Sets the default window size
   * @param {Array} size - [width, height]
   */
  setDefaultWindowSize: function (size) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_DEFAULT_WINDOW_SIZE,
      size
    })
  }
}

module.exports = AppActions
