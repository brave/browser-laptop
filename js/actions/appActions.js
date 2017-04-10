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

  windowReady: function (windowId) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_WINDOW_READY,
      windowId
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
   * Frame props changed
   * @param {Object} frame
   */
  frameChanged: function (frame) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_FRAME_CHANGED,
      frame
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
   * A tab has been moved to another window
   * @param {Number} tabId
   * @param {Object} frameOpts
   * @param {Object} browserOpts
   * @param {Number} windowId
   */
  tabMoved: function (tabId, frameOpts, browserOpts, windowId) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_TAB_MOVED,
      tabId,
      frameOpts,
      browserOpts,
      windowId
    })
  },

  /**
   * A request for a new tab has been made with the specified createProperties
   * @param {Object} createProperties
   */
  createTabRequested: function (createProperties) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_CREATE_TAB_REQUESTED,
      createProperties
    })
  },

  /**
   * A request for a URL load
   * @param {number} tabId - the tab ID to load the URL inside of
   * @param {string} url - The url to load
   */
  loadURLRequested: function (tabId, url) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_LOAD_URL_REQUESTED,
      tabId,
      url
    })
  },

  /**
   * A request for a URL load for the active tab of the specified window
   * @param {number} windowId - the window ID to load the URL inside of
   * @param {string} url - The url to load
   */
  loadURLInActiveTabRequested: function (windowId, url) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_LOAD_URL_IN_ACTIVE_TAB_REQUESTED,
      windowId,
      url
    })
  },

  /**
   * A request for a "maybe" new tab has been made with the specified createProperties
   * If a tab is already opened it will instead set it as active.
   *
   * @param {Object} createProperties - these are only used if a new tab is being created
   */
  maybeCreateTabRequested: function (createProperties) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_MAYBE_CREATE_TAB_REQUESTED,
      createProperties
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
   * @param {boolean} force closing the tab
   */
  tabClosed: function (tabValue, forceClose = false) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_TAB_CLOSED,
      tabValue,
      forceClose
    })
  },

  /**
   * Adds a site to the site list
   * @param {Object} siteDetail - Properties of the site in question, can also be an array of siteDetail
   * @param {string} tag - A tag to associate with the site. e.g. bookmarks.
   * @param {string} originalSiteDetail - If specified, the original site detail to edit / overwrite.
   * @param {boolean} destinationIsParent - Whether or not the destinationDetail should be considered the new parent.
   *   The details of the old entries will be modified if this is set, otherwise only the tag will be added.
   * @param {boolean} skipSync - Set true if a site isn't eligible for Sync (e.g. if addSite was triggered by Sync)
   */
  addSite: function (siteDetail, tag, originalSiteDetail, destinationDetail, skipSync) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_ADD_SITE,
      siteDetail,
      tag,
      originalSiteDetail,
      destinationDetail,
      skipSync
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
   * @param {boolean} skipSync - Set true if a site isn't eligible for Sync (e.g. if this removal was triggered by Sync)
   */
  removeSite: function (siteDetail, tag, skipSync) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_REMOVE_SITE,
      siteDetail,
      tag,
      skipSync
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
      actionType: appConstants.APP_LEDGER_RECOVERY_STATUS_CHANGED,
      recoverySucceeded: true
    })
  },

  /**
   * Dispatches a message indicating ledger recovery failed
   */
  ledgerRecoveryFailed: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_LEDGER_RECOVERY_STATUS_CHANGED,
      recoverySucceeded: false
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
   * @param {boolean} skipSync - Set true if a site isn't eligible for Sync (e.g. if addSite was triggered by Sync)
   */
  changeSiteSetting: function (hostPattern, key, value, temp, skipSync) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_CHANGE_SITE_SETTING,
      hostPattern,
      key,
      value,
      temporary: temp || false,
      skipSync
    })
  },

  /**
   * Removes a site setting
   * @param {string} hostPattern - The host pattern to update the config for
   * @param {string} key - The config key to update
   * @param {boolean} temp - Whether to change temporary or persistent
   *   settings. defaults to false (persistent).
   * @param {boolean} skipSync - Set true if a site isn't eligible for Sync (e.g. if addSite was triggered by Sync)
   */
  removeSiteSetting: function (hostPattern, key, temp, skipSync) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_REMOVE_SITE_SETTING,
      hostPattern,
      key,
      temporary: temp || false,
      skipSync
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
   * Updates location information for the URL bar
   * @param {object} locationInfo - the current location synopsis
   */
  updateLocationInfo: function (locationInfo) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_UPDATE_LOCATION_INFO,
      locationInfo
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
   * Shows a message in the notification bar
   * @param {{message: string, buttons: Array.<string>, frameOrigin: string, options: Object}} detail
   */
  showNotification: function (detail) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_SHOW_NOTIFICATION,
      detail
    })
  },

  /**
   * Hides a message in the notification bar
   * @param {string} message
   */
  hideNotification: function (message) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_HIDE_NOTIFICATION,
      message
    })
  },

  /**
   * Clears all notifications for a given origin.
   * @param {string} origin
   */
  clearNotifications: function (origin) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_CLEAR_NOTIFICATIONS,
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
   * Dispatches a message when windowId gains focus
   *
   * @param {Number} windowId - the unique id of the window
   */
  windowFocused: function (windowId) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_WINDOW_FOCUSED,
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
   * Shows delete confirmation bar in download item panel
   */
  showDownloadDeleteConfirmation: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_SHOW_DOWNLOAD_DELETE_CONFIRMATION
    })
  },

  /**
   * Hides delete confirmation bar in download item panel
   */
  hideDownloadDeleteConfirmation: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_HIDE_DOWNLOAD_DELETE_CONFIRMATION
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
   * Dispatches a message to toogle the dev tools on/off for the specified tabId
   * @param {number} tabId - The tabId
   */
  toggleDevTools: function (tabId) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_TAB_TOGGLE_DEV_TOOLS,
      tabId
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
   * Dispatches a message when noscript exceptions are added for an origin
   * @param {string} hostPattern
   * @param {Object.<string, (boolean|number)>} origins
   */
  noScriptExceptionsAdded: function (hostPattern, origins) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_ADD_NOSCRIPT_EXCEPTIONS,
      hostPattern,
      origins
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
   * @param {Array.<number>|null} seed
   * @param {Array.<number>|null} deviceId
   * @param {number|null} lastFetchTimestamp
   * @param {string=} seedQr
   */
  saveSyncInitData: function (seed, deviceId, lastFetchTimestamp, seedQr) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_SAVE_SYNC_INIT_DATA,
      seed,
      deviceId,
      lastFetchTimestamp,
      seedQr
    })
  },

  /**
   * Sets the sync setup error, or null for no error.
   * @param {string|null} error
   */
  setSyncSetupError: function (error) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_SET_SYNC_SETUP_ERROR,
      error
    })
  },

  /**
   * Dispatches a message to apply a batch of site records from Brave Sync
   * TODO: Refactor this to merge it into addSite/removeSite
   * @param {Array.<Object>} records
   */
  applySiteRecords: function (records) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_APPLY_SITE_RECORDS,
      records
    })
  },

  /**
   * Dispatch to populate the sync object id -> appState key path mapping cache
   */
  createSyncCache: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_CREATE_SYNC_CACHE
    })
  },

  /**
   * Dispatches a message to delete sync data.
   */
  resetSyncData: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_RESET_SYNC_DATA
    })
  },

  /*
   * Will pop up an alert/confirm/prompt for a given tab. Window is still usable.
   * @param {number} tabId - The tabId
   * @param {Object} detail - Object containing: title, message, buttons to show
   */
  tabMessageBoxShown: function (tabId, detail) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_TAB_MESSAGE_BOX_SHOWN,
      tabId,
      detail
    })
  },

  /**
   * Close a tab's open alert/confirm/etc (triggered by clicking OK/cancel).
   * @param {number} tabId - The tabId
   * @param {Object} detail - Object containing: suppressCheckbox (boolean)
   */
  tabMessageBoxDismissed: function (tabId, detail) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_TAB_MESSAGE_BOX_DISMISSED,
      tabId,
      detail
    })
  },

  /**
   * Update the detail object for the open alert/confirm/prompt (triggers re-render)
   * @param {number} tabId - The tabId
   * @param {Object} detail - Replacement object
   */
  tabMessageBoxUpdated: function (tabId, detail) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_TAB_MESSAGE_BOX_UPDATED,
      tabId,
      detail
    })
  },

  /**
   * Action triggered by registering navigation handler
   * @param partition {string} session partition
   * @param protocol {string} navigator protocol
   * @param location {string} location where handler was triggered
   */
  navigatorHandlerRegistered: function (partition, protocol, location) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_NAVIGATOR_HANDLER_REGISTERED,
      partition,
      protocol,
      location
    })
  },

  /**
   * Action triggered by un-registering navigation handler
   * @param partition {string} session partition
   * @param protocol {string} navigator protocol
   * @param location {string} location where handler was triggered
   */
  navigatorHandlerUnregistered: function (partition, protocol, location) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_NAVIGATOR_HANDLER_UNREGISTERED,
      partition,
      protocol,
      location
    })
  },

  /**
   * Open dialog for default download path setting
   */
  defaultDownloadPath: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DOWNLOAD_DEFAULT_PATH
    })
  },

  /**

   * Change all undefined publishers in site settings to defined sites
   * also change all undefined ledgerPayments to value true
   * @param publishers {Object} publishers from the synopsis
   */
  enableUndefinedPublishers: function (publishers) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_ENABLE_UNDEFINED_PUBLISHERS,
      publishers
    })
  },

  /**
   * Update ledger publishers pinned percentages according to the new synopsis
   * @param publishers {Object} updated publishers
   */
  changeLedgerPinnedPercentages: function (publishers) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_CHANGE_LEDGER_PINNED_PERCENTAGES,
      publishers
    })
  },

  /**
   * Update ledger publishers pinned percentages according to the new synopsis
   * Open dialog for default download path setting
   * Dispatches a message when a tab is being pinned
   * @param {number} tabId - The tabId of the tab to pin
   */
  tabPinned: function (tabId, pinned) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_TAB_PINNED,
      tabId,
      pinned
    })
  },

  /*
   * Dispatches a message when a web contents is added
   * @param {number} windowId - The windowId of the host window
   * @param {object} frameOpts - frame options for the added web contents
   */
  newWebContentsAdded: function (windowId, frameOpts) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_NEW_WEB_CONTENTS_ADDED,
      queryInfo: {
        windowId
      },
      frameOpts
    })
  },

  /*
   * Notifies the app that a drag operation started from within the app
   * @param {number} windowId - The source windowId the drag is starting from
   * @param {string} dragType - The type of data
   * @param {object} dragData - Data being transfered
   */
  dragStarted: function (windowId, dragType, dragData) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DRAG_STARTED,
      windowId,
      dragType,
      dragData
    })
  },

  /**
   * Notifies the app that a drag operation stopped from within the app
   * @param {string} dragType - The type of data
   * @param {object} dragData - Data being transfered
   */
  dragEnded: function () {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DRAG_STOPPED
    })
  },

  /**
   * Notifies the app that a drop operation occurred
   */
  dataDropped: function (dropWindowId) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DATA_DROPPED,
      dropWindowId
    })
  },

  /**
   * Notifies the app that a drop operation occurred
   */
  draggedOver: function (draggedOverData) {
    AppDispatcher.dispatch({
      actionType: appConstants.APP_DRAGGED_OVER,
      draggedOverData
    })
  }
}

module.exports = appActions
