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
  },

  /**
   * Sets the etag value for a downloaded data file.
   * This is used for keeping track of when to re-download adblock and tracking
   * protection data.
   * @param {string} resourceName - 'adblock' or 'trackingProtection'
   * @param {string} etag - The etag of the reosurce from the http response
   */
  setResourceETag: function (resourceName, etag) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_DATA_FILE_ETAG,
      resourceName,
      etag
    })
  },

  /**
   * Sets the lastCheck date.getTime() value for the data file
   * @param {string} resourceName - 'adblock' or 'trackingProtection'
   * @param {number} lastCheck - The last check date of the reosurce from the http response
   */
  setResourceLastCheck: function (resourceName, lastCheckVersion, lastCheckDate) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_DATA_FILE_LAST_CHECK,
      resourceName,
      lastCheckVersion,
      lastCheckDate
    })
  },

  /**
   * Sets the update.updateAvailable flag
   */
  setUpdateAvailable: function (available) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_UPDATE_AVAILABLE,
      available
    })
  },

  /**
   * Sets the update.lastCheckTimestamp to the current
   * epoch timestamp (milliseconds)
   */
  setUpdateLastCheck: function () {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_UPDATE_LAST_CHECK
    })
  },

  /**
   * Indicates that a user clicked on the update later button
   * and they shouldn't be prompted until the next startup.
   */
  updateLater: function () {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_UPDATE_LATER
    })
  }
}

module.exports = AppActions
