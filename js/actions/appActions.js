/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const AppDispatcher = require('../dispatcher/appDispatcher')
const AppConstants = require('../constants/appConstants')

const appActions = {
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
   * Dispatches an event to the main process to create a new window.
   * @param {Object} frameOpts - Options for the first frame in the window.
   * @param {Object} browserOpts - Options for the browser.
   * @param {Object} restoredState - State for the window to restore.
   * @param {function} cb - Callback to call after the window is loaded, will only work if called from the main process.
   */
  newWindow: function (frameOpts, browserOpts, restoredState, cb) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_NEW_WINDOW,
      frameOpts,
      browserOpts,
      restoredState,
      cb
    })
  },

  closeWindow: function (appWindowId) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_CLOSE_WINDOW,
      appWindowId
    })
  },

  /**
   * Adds a site to the site list
   * @param {Object} siteDetail - Properties of the site in question, can also be an array of siteDetail
   * @param {string} tag - A tag to associate with the site. e.g. bookmarks.
   * @param {string} originalSiteDetail - If specified, the original site detail to edit / overwrite.
   * @param {boolean} destinationIsParent - Whether or not the destinationDetail should be considered the new parent.
   *   The details of the old entries will be modified if this is set, otherwise only the tag will be added.
   */
  addSite: function (siteDetail, tag, originalSiteDetail, destinationDetail) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_ADD_SITE,
      siteDetail,
      tag,
      originalSiteDetail,
      destinationDetail
    })
  },

  /**
   * Clears all sites without tags
   */
  clearSitesWithoutTags: function () {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_CLEAR_SITES_WITHOUT_TAGS
    })
  },

  /**
   * Removes a site from the site list
   * @param {Object} siteDetail - Properties of the site in question
   * @param {string} tag - A tag to associate with the site. e.g. bookmarks.
   */
  removeSite: function (siteDetail, tag) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_REMOVE_SITE,
      siteDetail,
      tag
    })
  },

  /**
   * Dispatches a message to move a site locations.
   *
   * @param {string} sourceDetail - the location, partitionNumber, etc of the source moved site
   * @param {string} destinationDetail - the location, partitionNumber, etc of the destination moved site
   * @param {boolean} prepend - Whether or not to prepend to the destinationLocation
   *   If false, the destinationDetail is considered a sibling.
   * @param {boolean} destinationIsParent - Whether or not the destinationDetail should be considered the new parent.
   */
  moveSite: function (sourceDetail, destinationDetail, prepend, destinationIsParent) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_MOVE_SITE,
      sourceDetail,
      destinationDetail,
      prepend,
      destinationIsParent
    })
  },

  /**
   * Dispatches a message to add/edit download details
   * If set, also indicates that add/edit is shown
   * @param {string} downloadId - A unique ID for the download
   * @param {Object} downloadDetail - Properties for the download
   */
  mergeDownloadDetail: function (downloadId, downloadDetail) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_MERGE_DOWNLOAD_DETAIL,
      downloadId,
      downloadDetail
    })
  },

  /**
   * Dispatches a message to clear all completed downloads
   */
  clearCompletedDownloads: function () {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_CLEAR_COMPLETED_DOWNLOADS
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
   * Saves login credentials
   * @param {Object} passwordDetail - login details
   */
  savePassword: function (passwordDetail) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_ADD_PASSWORD,
      passwordDetail
    })
  },

  /**
   * Deletes login credentials
   * @param {Object} passwordDetail - login details
   */
  deletePassword: function (passwordDetail) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_REMOVE_PASSWORD,
      passwordDetail
    })
  },

  /**
   * Deletes all saved login credentials
   */
  clearPasswords: function () {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_CLEAR_PASSWORDS
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
  },

  /**
   * Change a hostPattern's config
   * @param {string} hostPattern - The host pattern to update the config for
   * @param {string} key - The config key to update
   * @param {string|number} value - The value to update to
   * @param {boolean} temp - Whether to change temporary or persistent
   *   settings. defaults to false (persistent).
   */
  changeSiteSetting: function (hostPattern, key, value, temp) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_CHANGE_SITE_SETTING,
      hostPattern,
      key,
      value,
      temporary: temp || false
    })
  },

  /**
   * Removes a site setting
   * @param {string} hostPattern - The host pattern to update the config for
   * @param {string} key - The config key to update
   */
  removeSiteSetting: function (hostPattern, key) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_REMOVE_SITE_SETTING,
      hostPattern,
      key
    })
  },

  /**
   * Shows a message box in the notification bar
   * @param {{message: string, buttons: Array.<string>, options: Object}} detail
   */
  showMessageBox: function (detail) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SHOW_MESSAGE_BOX,
      detail
    })
  },

  /**
   * Hides a message box in the notification bar
   * @param {string} message
   */
  hideMessageBox: function (message) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_HIDE_MESSAGE_BOX,
      message
    })
  },

  /**
   * Adds a word to the dictionary
   * @param {string} word - The word to add
   * @param {boolean} learn - true if the word should be learned, false if ignored
   */
  addWord: function (word, learn) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_ADD_WORD,
      word,
      learn
    })
  },

  /**
   * Adds a word to the dictionary
   * @param {string} locale - The locale to set for the dictionary
   */
  setDictionary: function (locale) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_DICTIONARY,
      locale
    })
  }
}

module.exports = appActions
