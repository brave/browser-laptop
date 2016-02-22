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
    global.require('electron').ipcRenderer.send(messages.UPDATE_REQUESTED)
  },

  /**
   * Adds a site to the site list
   * @param {Object} frameProps - Properties of the frame in question
   * @param {string} tag - A tag to associate with the site. e.g. bookmarks.
   * @param {string} originalLocation - If specified, the original location to edit / overwrite
   * @param {number} originalPartitionNumber - If specified, the original partitionNumber to edit / overwrite
   */
  addSite: function (frameProps, tag, originalLocation, originalPartitionNumber) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_ADD_SITE,
      frameProps,
      tag,
      originalLocation,
      originalPartitionNumber
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
   * Dispatches a message to move a site locations.
   *
   * @param {string} sourceLocation - the location of the site to move
   * @param {number} sourcePartitionNumber- the partition number of the site to move
   * @param {string} destinationLocation - the location of the site to move to
   * @param {boolean} prepend - Whether or not to prepend to the destinationLocation
   */
  moveSite: function (sourceLocation, sourcePartitionNumber, destinationLocation, prepend) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_MOVE_SITE,
      sourceLocation,
      sourcePartitionNumber,
      destinationLocation,
      prepend
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
   * @param {string} resourceName - 'adblock', 'trackingProtection', or 'httpsEverywhere'
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
   * Sets whether the resource is enabled or not.
   * @param {string} resourceName - 'adblock', 'trackingProtection', or 'httpsEverywhere'
   * @param {boolean} enabled - true if the resource is enabled.
   */
  setResourceEnabled: function (resourceName, enabled) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_RESOURCE_ENABLED,
      resourceName,
      enabled
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
   * Sets the update status
   * @param {string} status - update status from js/constants/updateStatus.js.
   * @param {boolean} verbose - Whether to show UI for all the update steps.
   * @param {object} metadata - Metadata from the pdate server, with info like release notes.
   */
  setUpdateStatus: function (status, verbose, metadata) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_UPDATE_STATUS,
      status,
      verbose,
      metadata
    })
  },

  /**
   * Changes an application level setting
   * @param {string} key - The key name for the setting
   * @param {string} value - The value of the setting
   */
  changeSetting: function (key, value) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_CHANGE_SETTING,
      key,
      value
    })
  }
}

module.exports = AppActions
