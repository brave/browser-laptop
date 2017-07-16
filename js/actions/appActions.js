/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const {dispatch} = require('../dispatcher/appDispatcher')
const appConstants = require('../constants/appConstants')

const appActions = {
  /**
   * Dispatches an event to the main process to replace the app state
   * This is called from the main process on startup before anything else
   *
   * @param {object} appState - Initial app state object (not yet converted to ImmutableJS)
   */
  setState: function (appState) {
    dispatch({
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
    dispatch({
      actionType: appConstants.APP_NEW_WINDOW,
      frameOpts,
      browserOpts,
      restoredState,
      cb
    })
  },

  windowReady: function (windowId) {
    dispatch({
      actionType: appConstants.APP_WINDOW_READY,
      windowId
    })
  },

  closeWindow: function (windowId) {
    dispatch({
      actionType: appConstants.APP_CLOSE_WINDOW,
      windowId
    })
  },

  windowClosed: function (windowValue) {
    dispatch({
      actionType: appConstants.APP_WINDOW_CLOSED,
      windowValue
    })
  },

  windowCreated: function (windowValue) {
    dispatch({
      actionType: appConstants.APP_WINDOW_CREATED,
      windowValue
    })
  },

  windowUpdated: function (windowValue) {
    dispatch({
      actionType: appConstants.APP_WINDOW_UPDATED,
      windowValue
    })
  },

  /**
   * Frame props changed
   * @param {Object} frame
   */
  frameChanged: function (frame) {
    dispatch({
      actionType: appConstants.APP_FRAME_CHANGED,
      frame
    })
  },

  /**
   * A new tab has been created
   * @param {Object} tabValue
   */
  tabCreated: function (tabValue) {
    dispatch({
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
    dispatch({
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
  createTabRequested: function (createProperties, activateIfOpen = false, isRestore = false) {
    dispatch({
      actionType: appConstants.APP_CREATE_TAB_REQUESTED,
      createProperties,
      activateIfOpen,
      isRestore
    })
  },

  topSiteDataAvailable: function (topSites) {
    dispatch({
      actionType: appConstants.APP_TOP_SITE_DATA_AVAILABLE,
      topSites
    })
  },

  /**
   * A request for a URL load
   * @param {number} tabId - the tab ID to load the URL inside of
   * @param {string} url - The url to load
   */
  loadURLRequested: function (tabId, url) {
    dispatch({
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
    dispatch({
      actionType: appConstants.APP_LOAD_URL_IN_ACTIVE_TAB_REQUESTED,
      windowId,
      url
    })
  },

  /**
   * A request for a URL email share occurred
   * @param {number} windowId - the window ID to use for the active tab
   * @param {string} shareType - The type of share to do, must be one of: "email", "facebook", "pinterest", "twitter", "googlePlus", "linkedIn", "buffer", "reddit", or "digg"
   */
  simpleShareActiveTabRequested: function (windowId, shareType) {
    dispatch({
      actionType: appConstants.APP_SIMPLE_SHARE_ACTIVE_TAB_REQUESTED,
      windowId,
      shareType
    })
  },

  /**
   * A tab has been updated
   * @param {Object} tabValue
   * @param {Object} changeInfo from chrome-tabs-updated
   */
  tabUpdated: function (tabValue, changeInfo) {
    dispatch({
      actionType: appConstants.APP_TAB_UPDATED,
      tabValue,
      changeInfo,
      queryInfo: {
        windowId: tabValue.get('windowId')
      }
    })
  },

  /**
   * Dispatches a message to the store to set a new frame as the active frame.
   *
   * @param {Number} tabId - the tabId to activate
   */
  tabActivateRequested: function (tabId) {
    dispatch({
      actionType: appConstants.APP_TAB_ACTIVATE_REQUESTED,
      tabId
    })
  },

  /**
   * Dispatches a message to the store to change the tab index
   *
   * @param {Number} tabId - the tabId
   * @param {Number} index - the new index
   */
  tabIndexChanged: function (tabId, index) {
    dispatch({
      actionType: appConstants.APP_TAB_INDEX_CHANGED,
      tabId,
      index
    })
  },

  /**
   * Dispatches a message to close the tabId
   *
   * @param {Number} tabId - the tabId to close
   * @param {Boolean} forceClosePinned - force close if pinned
   */
  tabCloseRequested: function (tabId, forceClosePinned = false) {
    dispatch({
      actionType: appConstants.APP_TAB_CLOSE_REQUESTED,
      tabId,
      forceClosePinned
    })
  },

  /**
   * Notifies that a tab has been closed
   * @param {number} tabId
   */
  tabClosed: function (tabId, windowId) {
    dispatch({
      actionType: appConstants.APP_TAB_CLOSED,
      tabId,
      queryInfo: {
        windowId
      }
    })
  },

  /**
   * Adds a site to the site list
   * @param {Object} siteDetail - Properties of the site in question, can also be an array of siteDetail
   * @param {string} tag - A tag to associate with the site. e.g. bookmarks.
   * @param {boolean} skipSync - Set true if a site isn't eligible for Sync (e.g. if addSite was triggered by Sync)
   */
  addSite: function (siteDetail, tag, skipSync) {
    dispatch({
      actionType: appConstants.APP_ADD_SITE,
      siteDetail,
      tag,
      skipSync
    })
  },

  /**
   * Removes a site from the site list
   * @param {Object} siteDetail - Properties of the site in question
   * @param {string} tag - A tag to associate with the site. e.g. bookmarks.
   * @param {boolean} skipSync - Set true if a site isn't eligible for Sync (e.g. if this removal was triggered by Sync)
   */
  removeSite: function (siteDetail, tag, skipSync) {
    dispatch({
      actionType: appConstants.APP_REMOVE_SITE,
      siteDetail,
      tag,
      skipSync
    })
  },

  /**
   * Dispatches a message to move a site locations.
   *
   * @param {string} sourceKey - the source key of the source moved site
   * @param {string} destinationKey - the destination key of the destination moved site
   * @param {boolean} prepend - Whether or not to prepend to the destinationLocation
   *   If false, the destinationDetail is considered a sibling.
   * @param {boolean} destinationIsParent - Whether or not the destinationDetail should be considered the new parent.
   */
  moveSite: function (sourceKey, destinationKey, prepend, destinationIsParent) {
    dispatch({
      actionType: appConstants.APP_MOVE_SITE,
      sourceKey,
      destinationKey,
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
    dispatch({
      actionType: appConstants.APP_MERGE_DOWNLOAD_DETAIL,
      downloadId,
      downloadDetail
    })
  },

  /**
   * Dispatches a message to clear all completed downloads
   */
  clearCompletedDownloads: function () {
    dispatch({
      actionType: appConstants.APP_CLEAR_COMPLETED_DOWNLOADS
    })
  },

  /**
   * Dispatches a message indicating ledger recovery succeeded
   */
  ledgerRecoverySucceeded: function () {
    dispatch({
      actionType: appConstants.APP_LEDGER_RECOVERY_STATUS_CHANGED,
      recoverySucceeded: true
    })
  },

  /**
   * Dispatches a message indicating ledger recovery failed
   */
  ledgerRecoveryFailed: function () {
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
      actionType: appConstants.APP_SET_UPDATE_STATUS,
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
    dispatch({
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
    dispatch({
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
    dispatch({
      actionType: appConstants.APP_REMOVE_SITE_SETTING,
      hostPattern,
      key,
      temporary: temp || false,
      skipSync
    })
  },

  /**
   * Changes the skipSync flag on an appState path.
   * @param {Array.<string>} path
   * @param {boolean} skipSync
   */
  setSkipSync: function (path, skipSync) {
    dispatch({
      actionType: appConstants.APP_SET_SKIP_SYNC,
      path,
      skipSync
    })
  },

  /**
   * Updates ledger information for the payments pane
   * @param {object} ledgerInfo - the current ledger state
   */
  updateLedgerInfo: function (ledgerInfo) {
    dispatch({
      actionType: appConstants.APP_UPDATE_LEDGER_INFO,
      ledgerInfo
    })
  },

  /**
   * Updates location information for the URL bar
   * @param {object} locationInfo - the current location synopsis
   */
  updateLocationInfo: function (locationInfo) {
    dispatch({
      actionType: appConstants.APP_UPDATE_LOCATION_INFO,
      locationInfo
    })
  },

  /**
   * Updates publisher information for the payments pane
   * @param {object} publisherInfo - the current publisher synopsis
   */
  updatePublisherInfo: function (publisherInfo) {
    dispatch({
      actionType: appConstants.APP_UPDATE_PUBLISHER_INFO,
      publisherInfo
    })
  },

  /**
   * Shows a message in the notification bar
   * @param {{message: string, buttons: Array.<string>, frameOrigin: string, options: Object}} detail
   */
  showNotification: function (detail) {
    dispatch({
      actionType: appConstants.APP_SHOW_NOTIFICATION,
      detail
    })
  },

  /**
   * Hides a message in the notification bar
   * @param {string} message
   */
  hideNotification: function (message) {
    dispatch({
      actionType: appConstants.APP_HIDE_NOTIFICATION,
      message
    })
  },

  /**
   * Adds information about pending basic auth login requests
   * @param {number} tabId - The tabId that generated the request
   * @param {string} detail - login request info
   */
  setLoginRequiredDetail: function (tabId, detail) {
    dispatch({
      actionType: appConstants.APP_SET_LOGIN_REQUIRED_DETAIL,
      tabId,
      detail
    })
  },

  setLoginResponseDetail: function (tabId, detail) {
    dispatch({
      actionType: appConstants.APP_SET_LOGIN_RESPONSE_DETAIL,
      tabId,
      detail
    })
  },

  /**
   * Clears the data specified in clearDataDetail
   */
  onClearBrowsingData: function () {
    dispatch({
      actionType: appConstants.APP_ON_CLEAR_BROWSING_DATA
    })
  },

  /**
   * Import browser data specified in selected
   * @param {object} selected - the browser data to import as per doc/state.md's importBrowserDataSelected
   */
  importBrowserData: function (selected) {
    dispatch({
      actionType: appConstants.APP_IMPORT_BROWSER_DATA,
      selected
    })
  },

  /**
   * Add address data
   * @param {object} detail - the address to add as per doc/state.md's autofillAddressDetail
   */
  addAutofillAddress: function (detail) {
    dispatch({
      actionType: appConstants.APP_ADD_AUTOFILL_ADDRESS,
      detail
    })
  },

  /**
   * Remove address data
   * @param {object} detail - the address to remove as per doc/state.md's autofillAddressDetail
   */
  removeAutofillAddress: function (detail) {
    dispatch({
      actionType: appConstants.APP_REMOVE_AUTOFILL_ADDRESS,
      detail
    })
  },

  /**
   * Add credit card data
   * @param {object} detail - the credit card to add as per doc/state.md's autofillCreditCardDetail
   */
  addAutofillCreditCard: function (detail) {
    dispatch({
      actionType: appConstants.APP_ADD_AUTOFILL_CREDIT_CARD,
      detail
    })
  },

  /**
   * Remove credit card data
   * @param {object} detail - the credit card to remove as per doc/state.md's autofillCreditCardDetail
   */
  removeAutofillCreditCard: function (detail) {
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
      actionType: appConstants.APP_WINDOW_FOCUSED,
      windowId: windowId
    })
  },

  /**
   * Saves current menubar template for use w/ Windows titlebar
   * @param {Object} menubarTemplate - JSON used to build the menu
   */
  setMenubarTemplate: function (menubarTemplate) {
    dispatch({
      actionType: appConstants.APP_SET_MENUBAR_TEMPLATE,
      menubarTemplate
    })
  },

  /**
   * Dispatches a message when the network is re-connected
   * after being disconnected
   */
  networkConnected: function () {
    dispatch({
      actionType: appConstants.APP_NETWORK_CONNECTED
    })
  },

  /**
   * Dispatches a message when the network is disconnected
   */
  networkDisconnected: function () {
    dispatch({
      actionType: appConstants.APP_NETWORK_DISCONNECTED
    })
  },

  /**
   * Dispatch a message to set default browser
   *
   * @param {boolean} useBrave - whether set Brave as default browser
   */
  defaultBrowserUpdated: function (useBrave) {
    dispatch({
      actionType: appConstants.APP_DEFAULT_BROWSER_UPDATED,
      useBrave
    })
  },

  /**
   * Dispatch a message to indicate default browser check is complete
   */
  defaultBrowserCheckComplete: function () {
    dispatch({
      actionType: appConstants.APP_DEFAULT_BROWSER_CHECK_COMPLETE
    })
  },

  /**
   * Notify the AppStore to provide default history values.
   */
  populateHistory: function () {
    dispatch({
      actionType: appConstants.APP_POPULATE_HISTORY
    })
  },

  allowFlashOnce: function (tabId, url, isPrivate) {
    dispatch({
      actionType: appConstants.APP_ALLOW_FLASH_ONCE,
      tabId,
      url,
      isPrivate
    })
  },

  allowFlashAlways: function (tabId, url) {
    dispatch({
      actionType: appConstants.APP_ALLOW_FLASH_ALWAYS,
      tabId,
      url
    })
  },

  /**
   * Dispatch a message to copy data URL to clipboard
   **/
  dataURLCopied: function (dataURL, html, text) {
    dispatch({
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
    dispatch({
      actionType: appConstants.APP_SHUTTING_DOWN
    })
  },

  /**
   * Dispatches a message when a download is being revealed.
   * Typically this will open the download directory in finder / explorer and select the icon.
   * @param {string} downloadId - ID of the download being revealed
   */
  downloadRevealed: function (downloadId) {
    dispatch({
      actionType: appConstants.APP_DOWNLOAD_REVEALED,
      downloadId
    })
  },

  /**
   * Dispatches a message when a download is being opened.
   * @param {string} downloadId - ID of the download being opened
   */
  downloadOpened: function (downloadId) {
    dispatch({
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
    dispatch({
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
    dispatch({
      actionType: appConstants.APP_DOWNLOAD_COPIED_TO_CLIPBOARD,
      downloadId
    })
  },

  /**
   * Dispatches a message when a download is being deleted
   * @param {string} downloadId - ID of the download item being deleted
   */
  downloadDeleted: function (downloadId) {
    dispatch({
      actionType: appConstants.APP_DOWNLOAD_DELETED,
      downloadId
    })
  },

  /**
   * Dispatches a message when a download is being cleared
   * @param {string} downloadId - ID of the download item being cleared
   */
  downloadCleared: function (downloadId) {
    dispatch({
      actionType: appConstants.APP_DOWNLOAD_CLEARED,
      downloadId
    })
  },

  /**
   * Dispatches a message when a download is being redownloaded
   * @param {string} downloadId - ID of the download item being redownloaded
   */
  downloadRedownloaded: function (downloadId) {
    dispatch({
      actionType: appConstants.APP_DOWNLOAD_REDOWNLOADED,
      downloadId
    })
  },

  /**
   * Shows delete confirmation bar in download item panel
   */
  showDownloadDeleteConfirmation: function () {
    dispatch({
      actionType: appConstants.APP_SHOW_DOWNLOAD_DELETE_CONFIRMATION
    })
  },

  /**
   * Hides delete confirmation bar in download item panel
   */
  hideDownloadDeleteConfirmation: function () {
    dispatch({
      actionType: appConstants.APP_HIDE_DOWNLOAD_DELETE_CONFIRMATION
    })
  },

  /**
   * Dispatches a message when text is updated to the clipboard
   * @param {string} text - clipboard text which is copied
   */
  clipboardTextCopied: function (text) {
    dispatch({
      actionType: appConstants.APP_CLIPBOARD_TEXT_UPDATED,
      text
    })
  },

  /**
   * Dispatches a message to toogle the dev tools on/off for the specified tabId
   * @param {number} tabId - The tabId
   */
  toggleDevTools: function (tabId) {
    dispatch({
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
    dispatch({
      actionType: appConstants.APP_TAB_CLONED,
      tabId,
      options
    })
  },

  /**
   * Dispatches a message when noscript exceptions are added for an origin
   * @param {string} hostPattern
   * @param {Object.<string, (boolean|number)>} origins
   * @param {boolean} temporary
   */
  noScriptExceptionsAdded: function (hostPattern, origins, temporary) {
    dispatch({
      actionType: appConstants.APP_ADD_NOSCRIPT_EXCEPTIONS,
      hostPattern,
      origins,
      temporary
    })
  },

  /**
   * Dispatches a message to set objectId for a syncable object.
   * @param {Array.<number>} objectId
   * @param {Array.<string>} objectPath
   */
  setObjectId: function (objectId, objectPath) {
    dispatch({
      actionType: appConstants.APP_SET_OBJECT_ID,
      objectId,
      objectPath
    })
  },

  /**
   * Add records sent with sync lib's SEND_SYNC_RECORDS to the appState
   * records pending upload. After we download records via the sync lib
   * we run pendingSyncRecordsRemoved.
   * @param {Object} records Array.<object>
   */
  pendingSyncRecordsAdded: function (records) {
    dispatch({
      actionType: appConstants.APP_PENDING_SYNC_RECORDS_ADDED,
      records
    })
  },

  /**
   * Remove records from the appState's records pending upload.
   * This function is called after we download the records from the sync
   * library.
   * @param {Object} records Array.<object>
   */
  pendingSyncRecordsRemoved: function (records) {
    dispatch({
      actionType: appConstants.APP_PENDING_SYNC_RECORDS_REMOVED,
      records
    })
  },

  /**
   * Dispatch to update sync devices cache.
   * NOTE: deviceId is a string! Normally it's Array.<number> but that can't
   * be an object key. Use syncUtil.deviceIdToString()
   * @param {Object} devices {[deviceId]: {lastRecordTimestamp=, name=}}
   */
  saveSyncDevices: function (devices) {
    dispatch({
      actionType: appConstants.APP_SAVE_SYNC_DEVICES,
      devices
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
    dispatch({
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
    dispatch({
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
    dispatch({
      actionType: appConstants.APP_APPLY_SITE_RECORDS,
      records
    })
  },

  /**
   * Dispatch to populate the sync object id -> appState key path mapping cache
   */
  createSyncCache: function () {
    dispatch({
      actionType: appConstants.APP_CREATE_SYNC_CACHE
    })
  },

  /**
   * Dispatches a message to delete sync data.
   */
  resetSyncData: function () {
    dispatch({
      actionType: appConstants.APP_RESET_SYNC_DATA
    })
  },

  /*
   * Will pop up an alert/confirm/prompt for a given tab. Window is still usable.
   * @param {number} tabId - The tabId
   * @param {Object} detail - Object containing: title, message, buttons to show
   */
  tabMessageBoxShown: function (tabId, detail) {
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
      actionType: appConstants.APP_DOWNLOAD_DEFAULT_PATH
    })
  },

  /**

   * Change all undefined publishers in site settings to defined sites
   * also change all undefined ledgerPayments to value true
   * @param publishers {Object} publishers from the synopsis
   */
  enableUndefinedPublishers: function (publishers) {
    dispatch({
      actionType: appConstants.APP_ENABLE_UNDEFINED_PUBLISHERS,
      publishers
    })
  },

  /**
   * Update ledger publishers pinned percentages according to the new synopsis
   * @param publishers {Object} updated publishers
   */
  changeLedgerPinnedPercentages: function (publishers) {
    dispatch({
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
    dispatch({
      actionType: appConstants.APP_TAB_PINNED,
      tabId,
      pinned
    })
  },

  /*
   * Dispatches a message when a web contents is added
   * @param {number} windowId - The windowId of the host window
   * @param {object} frameOpts - frame options for the added web contents
   * @param {object} tabValue - the created tab state
   */
  newWebContentsAdded: function (windowId, frameOpts, tabValue) {
    dispatch({
      actionType: appConstants.APP_NEW_WEB_CONTENTS_ADDED,
      queryInfo: {
        windowId
      },
      frameOpts,
      tabValue
    })
  },

  /*
   * Notifies the app that a drag operation started from within the app
   * @param {number} windowId - The source windowId the drag is starting from
   * @param {string} dragType - The type of data
   * @param {object} dragData - Data being transfered
   */
  dragStarted: function (windowId, dragType, dragData) {
    dispatch({
      actionType: appConstants.APP_DRAG_STARTED,
      windowId,
      dragType,
      dragData
    })
  },

  /**
   * Notifies the app that a drag operation stopped from within the app
   */
  dragEnded: function () {
    dispatch({
      actionType: appConstants.APP_DRAG_ENDED
    })
  },

  /**
   * Notifies the app that a drop operation occurred
   */
  dataDropped: function (dropWindowId) {
    dispatch({
      actionType: appConstants.APP_DATA_DROPPED,
      dropWindowId
    })
  },

  /**
   * Notifies the app that a drop operation occurred
   */
  draggedOver: function (draggedOverData) {
    dispatch({
      actionType: appConstants.APP_DRAGGED_OVER,
      draggedOverData
    })
  },

  /**
   * Go back in a history for a given tab
   * @param {number} tabId - Tab id used for an action
   */
  onGoBack: function (tabId) {
    dispatch({
      actionType: appConstants.APP_ON_GO_BACK,
      tabId
    })
  },

  /**
   * Go forward in a history for a given tab
   * @param {number} tabId - Tab id used for an action
   */
  onGoForward: function (tabId) {
    dispatch({
      actionType: appConstants.APP_ON_GO_FORWARD,
      tabId
    })
  },

  /**
   * Go to specific item in a history for a given tab
   * @param {number} tabId - Tab id used for an action
   * @param {number} index - Index in the history
   */
  onGoToIndex: function (tabId, index) {
    dispatch({
      actionType: appConstants.APP_ON_GO_TO_INDEX,
      tabId,

      index
    })
  },

  /**
   * Go back in a history for a given tab
   * @param {number} tabId - Tab id used for an action
   * @param {ClientRect} rect - Parent element position for this action
   */
  onGoBackLong: function (tabId, rect) {
    dispatch({
      actionType: appConstants.APP_ON_GO_BACK_LONG,
      tabId,
      rect
    })
  },

  /**
   * Go forward in a history for a given tab
   * @param {number} tabId - Tab id used for an action
   * @param {ClientRect} rect - Parent element position for this action
   */
  onGoForwardLong: function (tabId, rect) {
    dispatch({
      actionType: appConstants.APP_ON_GO_FORWARD_LONG,
      tabId,
      rect
    })
  },

  /**
   * Notifies the app that a drop operation was cancelled
   * because ESC was pressed.
   */
  dragCancelled: function () {
    dispatch({
      actionType: appConstants.APP_DRAG_CANCELLED
    })
  },

  /**
   * Notifies autoplay has been blocked
   * @param {number} tabId - Tab id of current frame
   */
  autoplayBlocked: function (tabId) {
    dispatch({
      actionType: appConstants.APP_AUTOPLAY_BLOCKED,
      tabId
    })
  },

  /**
   * Handle 'save-password' event from muon
   */
  savePassword: function (username, origin, tabId) {
    dispatch({
      actionType: appConstants.APP_SAVE_PASSWORD,
      username,
      origin,
      tabId
    })
  },

  /**
   * Handle 'update-password' event from muon
   */
  updatePassword: function (username, origin, tabId) {
    dispatch({
      actionType: appConstants.APP_UPDATE_PASSWORD,
      username,
      origin,
      tabId
    })
  },

  /**
   * Deletes login credentials
   * @param {Object} passwordDetail - login details
   */
  deletePassword: function (passwordDetail) {
    dispatch({
      actionType: appConstants.APP_REMOVE_PASSWORD,
      passwordDetail
    })
  },

  /**
   * Deletes all saved login credentials
   */
  clearPasswords: function () {
    dispatch({
      actionType: appConstants.APP_CLEAR_PASSWORDS
    })
  },

  /**
   * Delete legacy "never saved password" list
   */
  deletePasswordSite: function (origin) {
    dispatch({
      actionType: appConstants.APP_CHANGE_SITE_SETTING,
      hostPattern: origin,
      key: 'savePasswords'
    })
  },

  /**
   * Indicates that the urlbar text has changed, usually from user input
   *
   * @param {number} windowId - The window ID the text is being changed inside of
   * @param {number} tabId - The tab ID the text is being changed inside of
   * @param {string} input - The text that was entered into the URL bar
   */
  urlBarTextChanged: function (windowId, tabId, input) {
    dispatch({
      actionType: appConstants.APP_URL_BAR_TEXT_CHANGED,
      input,
      tabId,
      windowId,
      queryInfo: {
        windowId
      }
    })
  },

  /**
   * New URL bar suggestion search results are available.
   * This is typically from a service like Duck Duck Go auto complete for the portion of text that the user typed in.
   *
   * @param {number} tabId - the tab id for the action
   * @param searchResults The search results for the currently entered URL bar text.
   */
  searchSuggestionResultsAvailable: function (tabId, query, searchResults) {
    dispatch({
      actionType: appConstants.APP_SEARCH_SUGGESTION_RESULTS_AVAILABLE,
      tabId,
      searchResults,
      query
    })
  },

  /**
   * Indicates URL bar suggestions and selected index.
   *
   * @param {number} windowId - the window ID
   * @param {Object[]} suggestionList - The list of suggestions for the entered URL bar text. This can be generated from history, bookmarks, etc.
   * @param {number} selectedIndex - The index for the selected item (users can select items with down arrow on their keyboard)
   */
  urlBarSuggestionsChanged: function (windowId, suggestionList, selectedIndex) {
    dispatch({
      actionType: appConstants.APP_URL_BAR_SUGGESTIONS_CHANGED,
      suggestionList,
      selectedIndex,
      windowId,
      queryInfo: {
        windowId
      }
    })
  },

  /**
   * Indicates URL bar selected index
   *
   * @param {number} windowId - the window ID
   * @param {number} selectedIndex - The index for the selected item (users can select items with down arrow on their keyboard)
   */
  urlBarSelectedIndexChanged: function (windowId, selectedIndex) {
    dispatch({
      actionType: appConstants.APP_URL_BAR_SELECTED_INDEX_CHANGED,
      selectedIndex,
      windowId,
      queryInfo: {
        windowId
      }
    })
  },

  /**
   * Dispatches a message to set the search engine details.
   * @param {Object} searchDetail - the search details
   */
  defaultSearchEngineLoaded: function (searchDetail) {
    dispatch({
      actionType: appConstants.APP_DEFAULT_SEARCH_ENGINE_LOADED,
      searchDetail
    })
  },

  /**
   * Dispatches a message to indicate that the update log is being opened
   */
  updateLogOpened: function (searchDetail) {
    dispatch({
      actionType: appConstants.APP_UPDATE_LOG_OPENED
    })
  },

  /**
   * Save temp setting for clear browsing data
   */
  onToggleBrowsingData: function (property, newValue) {
    dispatch({
      actionType: appConstants.APP_ON_TOGGLE_BROWSING_DATA,
      property,
      newValue
    })
  },

  /**
   * Clear temp setting for clear browsing data
   */
  onCancelBrowsingData: function () {
    dispatch({
      actionType: appConstants.APP_ON_CANCEL_BROWSING_DATA
    })
  },

  swipedLeft: function (percent) {
    dispatch({
      actionType: appConstants.APP_SWIPE_LEFT,
      percent
    })
  },

  swipedRight: function (percent) {
    dispatch({
      actionType: appConstants.APP_SWIPE_RIGHT,
      percent
    })
  },

  addBookmark: function (siteDetail, tag, closestKey) {
    dispatch({
      actionType: appConstants.APP_ADD_BOOKMARK,
      siteDetail,
      tag,
      closestKey
    })
  },

  editBookmark: function (siteDetail, editKey, tag) {
    dispatch({
      actionType: appConstants.APP_EDIT_BOOKMARK,
      siteDetail,
      tag,
      editKey
    })
  },

  noReportStateModeClicked: function (windowId) {
    dispatch({
      actionType: appConstants.APP_DEBUG_NO_REPORT_STATE_MODE_CLICKED,
      queryInfo: {
        windowId
      }
    })
  },

  spellingSuggested: function (suggestion, tabId) {
    dispatch({
      actionType: appConstants.APP_SPELLING_SUGGESTED,
      suggestion,
      tabId
    })
  },

  learnSpelling: function (word, tabId) {
    dispatch({
      actionType: appConstants.APP_LEARN_SPELLING,
      word,
      tabId
    })
  },

  forgetLearnedSpelling: function (word, tabId) {
    dispatch({
      actionType: appConstants.APP_FORGET_LEARNED_SPELLING,
      word,
      tabId
    })
  },

  setVersionInfo: function (name, version) {
    dispatch({
      actionType: appConstants.APP_SET_VERSION_INFO,
      name,
      version
    })
  }
}

module.exports = appActions
