/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const AppDispatcher = require('../dispatcher/appDispatcher')
const appConstants = require('../constants/appConstants')

const appActions = {
  /**
   * Dispatches an event to the main process to replace the app state
   * This is called from the main process on startup before anything else
   *
   * @param {object} appState - Initial app state object (not yet converted to ImmutableJS)
   */
  setState: function (appState) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_SET_STATE,
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
      actionType: appConstants.APP_NEW_WINDOW,
      frameOpts,
      browserOpts,
      restoredState,
      cb
    })
  },

  closeWindow: function (windowId) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_CLOSE_WINDOW,
      windowId
    })
  },

  windowClosed: function (windowValue) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_WINDOW_CLOSED,
      windowValue
    })
  },

  windowCreated: function (windowValue) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_WINDOW_CREATED,
      windowValue
    })
  },

  windowUpdated: function (windowValue) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_WINDOW_UPDATED,
      windowValue
    })
  },

  /**
   * A new tab has been requested
   * @param {Object} createProperties - windowId, url, active, openerTabId
   */
  newTab: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_NEW_TAB,
      frameProps
    })
  },

  /**
   * A new tab has been created
   * @param {Object} tabValue
   */
  tabCreated: function (tabValue) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_TAB_CREATED,
      tabValue
    })
  },

  /**
   * A tab has been updated
   * @param {Object} tabValue
   */
  tabUpdated: function (tabValue) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_TAB_UPDATED,
      tabValue
    })
  },

  /**
   * Closes an open tab
   * @param {number} tabId
   */
  tabClosed: function (tabValue) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_TAB_CLOSED,
      tabValue
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
      actionType: appConstants.APP_ADD_SITE,
      siteDetail,
      tag,
      originalSiteDetail,
      destinationDetail
    })
  },

  /**
   * Clears history (all sites without tags). Indirectly called by appActions.onClearBrowsingData().
   */
  clearHistory: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_CLEAR_HISTORY
    })
  },

  /**
   * Removes a site from the site list
   * @param {Object} siteDetail - Properties of the site in question
   * @param {string} tag - A tag to associate with the site. e.g. bookmarks.
   */
  removeSite: function (siteDetail, tag) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_REMOVE_SITE,
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
      actionType: appConstants.APP_MOVE_SITE,
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
      actionType: appConstants.APP_MERGE_DOWNLOAD_DETAIL,
      downloadId,
      downloadDetail
    })
  },

  /**
   * Dispatches a message to clear all completed downloads
   */
  clearCompletedDownloads: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_CLEAR_COMPLETED_DOWNLOADS
    })
  },

  /**
   * Dispatches a message indicating ledger recovery succeeded
   */
  ledgerRecoverySucceeded: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_LEDGER_RECOVERY_SUCCEEDED
    })
  },

  /**
   * Dispatches a message indicating ledger recovery failed
   */
  ledgerRecoveryFailed: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_LEDGER_RECOVERY_FAILED
    })
  },

  /**
   * Sets the default window size / position
   * @param {Array} size - [width, height]
   * @param {Array} position - [x, y]
   */
  defaultWindowParamsChanged: function (size, position) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DEFAULT_WINDOW_PARAMS_CHANGED,
      size,
      position
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
      actionType: appConstants.APP_SET_DATA_FILE_ETAG,
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
      actionType: appConstants.APP_SET_DATA_FILE_LAST_CHECK,
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
      actionType: appConstants.APP_SET_RESOURCE_ENABLED,
      resourceName,
      enabled
    })
  },

  /**
   * Indicates a resource is ready
   * @param {string} resourceName - 'widevine'
   */
  resourceReady: function (resourceName) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_RESOURCE_READY,
      resourceName
    })
  },

  /**
  * Checks how many resources were blocked.
  * @param {string} resourceName - 'adblock', 'trackingProtection', or 'httpsEverywhere'
  * @param {number} count - number of blocked resources to add to the global count
  */
  addResourceCount: function (resourceName, count) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_ADD_RESOURCE_COUNT,
      resourceName,
      count
    })
  },

  /**
   * Sets the update.lastCheckTimestamp to the current
   * epoch timestamp (milliseconds)
   */
  setUpdateLastCheck: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_UPDATE_LAST_CHECK
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
      actionType: appConstants.APP_SET_UPDATE_STATUS,
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
      actionType: appConstants.APP_ADD_PASSWORD,
      passwordDetail
    })
  },

  /**
   * Deletes login credentials
   * @param {Object} passwordDetail - login details
   */
  deletePassword: function (passwordDetail) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_REMOVE_PASSWORD,
      passwordDetail
    })
  },

  /**
   * Deletes all saved login credentials
   */
  clearPasswords: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_CLEAR_PASSWORDS
    })
  },

  /**
   * Changes an application level setting
   * @param {string} key - The key name for the setting
   * @param {string} value - The value of the setting
   */
  changeSetting: function (key, value) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_CHANGE_SETTING,
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
      actionType: appConstants.APP_CHANGE_SITE_SETTING,
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
   * @param {boolean} temp - Whether to change temporary or persistent
   *   settings. defaults to false (persistent).
   */
  removeSiteSetting: function (hostPattern, key, temp) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_REMOVE_SITE_SETTING,
      hostPattern,
      key,
      temporary: temp || false
    })
  },

  /**
   * Updates ledger information for the payments pane
   * @param {object} ledgerInfo - the current ledger state
   */
  updateLedgerInfo: function (ledgerInfo) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_UPDATE_LEDGER_INFO,
      ledgerInfo
    })
  },

  /**
   * Updates publisher information for the payments pane
   * @param {object} publisherInfo - the current publisher synopsis
   */
  updatePublisherInfo: function (publisherInfo) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_UPDATE_PUBLISHER_INFO,
      publisherInfo
    })
  },

  /**
   * Shows a message box in the notification bar
   * @param {{message: string, buttons: Array.<string>, frameOrigin: string, options: Object}} detail
   */
  showMessageBox: function (detail) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_SHOW_MESSAGE_BOX,
      detail
    })
  },

  /**
   * Hides a message box in the notification bar
   * @param {string} message
   */
  hideMessageBox: function (message) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_HIDE_MESSAGE_BOX,
      message
    })
  },

  /**
   * Clears all message boxes for a given origin.
   * @param {string} origin
   */
  clearMessageBoxes: function (origin) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_CLEAR_MESSAGE_BOXES,
      origin
    })
  },

  /**
   * Adds a word to the dictionary
   * @param {string} word - The word to add
   * @param {boolean} learn - true if the word should be learned, false if ignored
   */
  addWord: function (word, learn) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_ADD_WORD,
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
      actionType: appConstants.APP_SET_DICTIONARY,
      locale
    })
  },

  /**
   * Adds information about pending basic auth login requests
   * @param {number} tabId - The tabId that generated the request
   * @param {string} detail - login request info
   */
  setLoginRequiredDetail: function (tabId, detail) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_SET_LOGIN_REQUIRED_DETAIL,
      tabId,
      detail
    })
  },

  setLoginResponseDetail: function (tabId, detail) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_SET_LOGIN_RESPONSE_DETAIL,
      tabId,
      detail
    })
  },

  /**
   * Clears the data specified in clearDataDetail
   * @param {object} clearDataDetail - the app data to clear as per doc/state.md's clearBrowsingDataDefaults
   */
  onClearBrowsingData: function (clearDataDetail) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_ON_CLEAR_BROWSING_DATA,
      clearDataDetail
    })
  },

  /**
   * Import browser data specified in selected
   * @param {object} selected - the browser data to import as per doc/state.md's importBrowserDataSelected
   */
  importBrowserData: function (selected) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_IMPORT_BROWSER_DATA,
      selected
    })
  },

  /**
   * Add address data
   * @param {object} detail - the address to add as per doc/state.md's autofillAddressDetail
   * @param {object} originalDetail - the original address before editing
   */
  addAutofillAddress: function (detail, originalDetail) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_ADD_AUTOFILL_ADDRESS,
      detail,
      originalDetail
    })
  },

  /**
   * Remove address data
   * @param {object} detail - the address to remove as per doc/state.md's autofillAddressDetail
   */
  removeAutofillAddress: function (detail) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_REMOVE_AUTOFILL_ADDRESS,
      detail
    })
  },

  /**
   * Add credit card data
   * @param {object} detail - the credit card to add as per doc/state.md's autofillCreditCardDetail
   * @param {object} originalDetail - the original credit card before editing
   */
  addAutofillCreditCard: function (detail, originalDetail) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_ADD_AUTOFILL_CREDIT_CARD,
      detail,
      originalDetail
    })
  },

  /**
   * Remove credit card data
   * @param {object} detail - the credit card to remove as per doc/state.md's autofillCreditCardDetail
   */
  removeAutofillCreditCard: function (detail) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_REMOVE_AUTOFILL_CREDIT_CARD,
      detail
    })
  },

  /**
   * Autofill data changed
   * @param {Array} addressGuids - the guid array to access address entries in autofill DB
   * @param {Array} creditCardGuids - the guid array to access credit card entries in autofill DB
   */
  autofillDataChanged: function (addressGuids, creditCardGuids) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_AUTOFILL_DATA_CHANGED,
      addressGuids,
      creditCardGuids
    })
  },

  /**
   * Dispatches a message when appWindowId loses focus
   * Dispatches a message when windowId loses focus
   *
   * @param {Number} windowId - the unique id of the window
   */
  windowBlurred: function (windowId) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_WINDOW_BLURRED,
      windowId: windowId
    })
  },

  /**
   * Saves current menubar template for use w/ Windows titlebar
   * @param {Object} menubarTemplate - JSON used to build the menu
   */
  setMenubarTemplate: function (menubarTemplate) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_SET_MENUBAR_TEMPLATE,
      menubarTemplate
    })
  },

  /**
   * Dispatches a message when the network is re-connected
   * after being disconnected
   */
  networkConnected: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_NETWORK_CONNECTED
    })
  },

  /**
   * Dispatches a message when the network is disconnected
   */
  networkDisconnected: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_NETWORK_DISCONNECTED
    })
  },

  /**
   * Dispatch a message to set default browser
   *
   * @param {boolean} useBrave - whether set Brave as default browser
   */
  defaultBrowserUpdated: function (useBrave) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DEFAULT_BROWSER_UPDATED,
      useBrave
    })
  },

  /**
   * Dispatch a message to indicate default browser check is complete
   */
  defaultBrowserCheckComplete: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DEFAULT_BROWSER_CHECK_COMPLETE
    })
  },

  /**
   * Notify the AppStore to provide default history values.
   */
  populateHistory: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_POPULATE_HISTORY
    })
  },

  allowFlashOnce: function (tabId, url, isPrivate) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_ALLOW_FLASH_ONCE,
      tabId,
      url,
      isPrivate
    })
  },

  allowFlashAlways: function (tabId, url) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_ALLOW_FLASH_ALWAYS,
      tabId,
      url
    })
  },

  /**
   * Dispatch a message to copy data URL to clipboard
   **/
  dataURLCopied: function (dataURL, html, text) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DATA_URL_COPIED,
      dataURL,
      html,
      text
    })
  },

  /**
   * Dispatches a message when the app is shutting down.
   */
  shuttingDown: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_SHUTTING_DOWN
    })
  },

  /**
   * Dispatches a message when a download is being revealed.
   * Typically this will open the download directory in finder / explorer and select the icon.
   * @param {string} downloadId - ID of the download being revealed
   */
  downloadRevealed: function (downloadId) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DOWNLOAD_REVEALED,
      downloadId
    })
  },

  /**
   * Dispatches a message when a download is being opened.
   * @param {string} downloadId - ID of the download being opened
   */
  downloadOpened: function (downloadId) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DOWNLOAD_OPENED,
      downloadId
    })
  },

  /**
   * Dispatches a message when an electron download action is being performed (pause, resume, cancel)
   * @param {string} downloadId - ID of the download item the action is being performed to
   * @param {string} downloadAction - the action to perform from constants/electronDownloadItemActions.js
   */
  downloadActionPerformed: function (downloadId, downloadAction) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DOWNLOAD_ACTION_PERFORMED,
      downloadId,
      downloadAction
    })
  },

  /**
   * Dispatches a message when a download URL is being copied to the clipboard
   * @param {string} downloadId - ID of the download item being copied to the clipboard
   */
  downloadCopiedToClipboard: function (downloadId) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DOWNLOAD_COPIED_TO_CLIPBOARD,
      downloadId
    })
  },

  /**
   * Dispatches a message when a download is being deleted
   * @param {string} downloadId - ID of the download item being deleted
   */
  downloadDeleted: function (downloadId) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DOWNLOAD_DELETED,
      downloadId
    })
  },

  /**
   * Dispatches a message when a download is being cleared
   * @param {string} downloadId - ID of the download item being cleared
   */
  downloadCleared: function (downloadId) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DOWNLOAD_CLEARED,
      downloadId
    })
  },

  /**
   * Dispatches a message when a download is being redownloaded
   * @param {string} downloadId - ID of the download item being redownloaded
   */
  downloadRedownloaded: function (downloadId) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DOWNLOAD_REDOWNLOADED,
      downloadId
    })
  },

  /**
   * Dispatches a message when text is updated to the clipboard
   * @param {string} text - clipboard text which is copied
   */
  clipboardTextCopied: function (text) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_CLIPBOARD_TEXT_UPDATED,
      text
    })
  },

  /**
   * Dispatches a message when a tab is being cloned
   * @param {number} tabId - The tabId of the tab to clone
   * @param {object} options - object containing options such as acive, back, and forward booleans
   */
  tabCloned: function (tabId, options) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_TAB_CLONED,
      tabId,
      options
    })
  },

  /**
   * Dispatches a message to set objectId for a syncable object.
   * @param {Array.<number>} objectId
   * @param {Array.<string>} objectPath
   */
  setObjectId: function (objectId, objectPath) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_SET_OBJECT_ID,
      objectId,
      objectPath
    })
  },

  /**
   * Dispatches a message when sync init data needs to be saved
   * @param {Buffer|null} seed
   * @param {Buffer|null} deviceId
   * @param {number|null} lastFetchTimestamp
   */
  saveSyncInitData: function (seed, deviceId, lastFetchTimestamp) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_SAVE_SYNC_INIT_DATA,
      seed,
      deviceId,
      lastFetchTimestamp
    })
  }
}

module.exports = appActions
