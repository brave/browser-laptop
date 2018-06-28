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

  /**
   * Dispatches an event to the main process to focus the active window,
   * or create a new one if there is no active window.
   */
  focusOrCreateWindow: function () {
    dispatch({
      actionType: appConstants.APP_FOCUS_OR_CREATE_WINDOW
    })
  },

  windowReady: function (windowId, windowValue) {
    dispatch({
      actionType: appConstants.APP_WINDOW_READY,
      windowId,
      windowValue,
      queryInfo: {
        windowId
      }
    })
  },

  windowRendered: function (windowId) {
    dispatch({
      actionType: appConstants.APP_WINDOW_RENDERED,
      windowId,
      queryInfo: {
        windowId
      }
    })
  },

  closeWindow: function (windowId) {
    dispatch({
      actionType: appConstants.APP_CLOSE_WINDOW,
      windowId
    })
  },

  windowClosed: function (windowId) {
    dispatch({
      actionType: appConstants.APP_WINDOW_CLOSED,
      windowId
    })
  },

  windowCreated: function (windowValue, windowId) {
    dispatch({
      actionType: appConstants.APP_WINDOW_CREATED,
      windowValue,
      queryInfo: {
        windowId
      }
    })
  },

  windowUpdated: function (windowValue, updateDefault, windowId) {
    dispatch({
      actionType: appConstants.APP_WINDOW_UPDATED,
      windowValue,
      updateDefault,
      queryInfo: {
        windowId
      }
    })
  },

  /**
   * Frame props changed
   * @param {Object} frame
   */
  framesChanged: function (frames) {
    dispatch({
      actionType: appConstants.APP_FRAMES_CHANGED,
      frames
    })
  },

  /**
   * The tab strip is empty
   * @param {Number} windowId
   */
  tabStripEmpty: function (windowId) {
    dispatch({
      actionType: appConstants.APP_TAB_STRIP_EMPTY,
      windowId
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
   * Tab moved event fired from muon
   * @param {Object} tabValue
   */
  tabMoved: function (tabId, fromIndex, toIndex, windowId) {
    dispatch({
      actionType: appConstants.APP_TAB_MOVED,
      tabId,
      fromIndex,
      toIndex,
      queryInfo: {
        windowId
      }
    })
  },

  /**
   * A tab has been attached
   * @param {Object} tabValue
   */
  tabAttached: function (tabId) {
    dispatch({
      actionType: appConstants.APP_TAB_ATTACHED,
      tabId
    })
  },

  /**
   * A tab will be attached
   * @param {Object} tabValue
   */
  tabWillAttach: function (tabId) {
    dispatch({
      actionType: appConstants.APP_TAB_WILL_ATTACH,
      tabId
    })
  },

  /**
   * A tab has been moved to another window
   * @param {Number} tabId
   * @param {Object} frameOpts
   * @param {Object} browserOpts
   * @param {Number} windowId
   */
  tabDetachMenuItemClicked: function (tabId, frameOpts, browserOpts, windowId) {
    dispatch({
      actionType: appConstants.APP_TAB_DETACH_MENU_ITEM_CLICKED,
      tabId,
      frameOpts,
      browserOpts,
      windowId
    })
  },

  /**
   * Menu item for closing a tab page has been clicked.
   * @param {Number} tabPageIndex The index of the tab page to close
   */
  tabPageCloseMenuItemClicked: function (windowId, tabPageIndex) {
    dispatch({
      actionType: appConstants.APP_TAB_PAGE_CLOSE_MENU_ITEM_CLICKED,
      tabPageIndex,
      windowId
    })
  },

  /**
   * Dispatches a message to the store to indicate that the webview entered full screen mode.
   *
   * @param {Object} tabId - Tab id of the frame to put in full screen
   * @param {boolean} isFullScreen - true if the webview is entering full screen mode.
   * @param {boolean} showFullScreenWarning - true if a warning about entering full screen should be shown.
   */
  tabSetFullScreen: function (tabId, isFullScreen, showFullScreenWarning, windowId) {
    dispatch({
      actionType: appConstants.APP_TAB_SET_FULL_SCREEN,
      tabId,
      isFullScreen,
      showFullScreenWarning,
      queryInfo: {
        windowId
      }
    })
  },

  /**
   * Menu item for closing tabs to the left has been clicked.
   * @param {Number} tabId The tabId woh's tabs to the left should be closed.
   */
  closeTabsToLeftMenuItemClicked: function (tabId) {
    dispatch({
      actionType: appConstants.APP_CLOSE_TABS_TO_LEFT_MENU_ITEM_CLICKED,
      tabId
    })
  },

  /**
   * Menu item for closing tabs to the right has been clicked.
   * @param {Number} tabId The tabId woh's tabs to the right should be closed.
   */
  closeTabsToRightMenuItemClicked: function (tabId) {
    dispatch({
      actionType: appConstants.APP_CLOSE_TABS_TO_RIGHT_MENU_ITEM_CLICKED,
      tabId
    })
  },

  /**
   * Menu item for closing other tabs than the specified tab.
   * @param {Number} tabId The tabId woh's tabs to the left should be closed.
   */
  closeOtherTabsMenuItemClicked: function (tabId) {
    dispatch({
      actionType: appConstants.APP_CLOSE_OTHER_TABS_MENU_ITEM_CLICKED,
      tabId
    })
  },

  discardTabRequested: function (tabId) {
    dispatch({
      actionType: appConstants.APP_DISCARD_TAB_REQUESTED,
      tabId
    })
  },

  /**
   * A request for a new tab has been made with the specified createProperties
   * @param {Object} createProperties
   * @param {Boolean} activateIfOpen if the tab is already open with the same properties,
   * switch to it instead of creating a new one
   * @param {Boolean} isRestore when true, won't try to activate the new tab, even if the user preference indicates to
   */
  createTabRequested: function (createProperties, activateIfOpen = false, isRestore = false, focusWindow = false) {
    dispatch({
      actionType: appConstants.APP_CREATE_TAB_REQUESTED,
      createProperties,
      activateIfOpen,
      isRestore,
      focusWindow
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
   * @param {boolean} reloadMatchingUrl - would you like to force reload provided tab
   */
  loadURLRequested: function (tabId, url, reloadMatchingUrl) {
    dispatch({
      actionType: appConstants.APP_LOAD_URL_REQUESTED,
      tabId,
      url,
      reloadMatchingUrl
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
  simpleShareActiveTabRequested: function (shareType) {
    dispatch({
      actionType: appConstants.APP_SIMPLE_SHARE_ACTIVE_TAB_REQUESTED,
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

  tabReplaced: function (oldTabId, newTabValue, windowId, isPermanent) {
    dispatch({
      actionType: appConstants.APP_TAB_REPLACED,
      oldTabId,
      newTabValue,
      isPermanent,
      queryInfo: {
        windowId
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
   * Dispatches a message to the store to indicate a user action requested that the tab index change
   *
   * @param {Number} tabId - the tabId
   * @param {Number} index - the new index
   */
  tabIndexChangeRequested: function (tabId, index) {
    dispatch({
      actionType: appConstants.APP_TAB_INDEX_CHANGE_REQUESTED,
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
   */
  addHistorySite: function (siteDetail) {
    dispatch({
      actionType: appConstants.APP_ADD_HISTORY_SITE,
      siteDetail
    })
  },

  /**
   * Removes a site from the site list
   * @param {string|Immutable.List} historyKey - History item key that we want to remove, can be list of keys as well
   */
  removeHistorySite: function (historyKey) {
    dispatch({
      actionType: appConstants.APP_REMOVE_HISTORY_SITE,
      historyKey
    })
  },

  /**
   * Removes all sites for the given domain from the site list
   * @param {string} domain - Domain of the sites we want to remove
   */
  removeHistoryDomain: function (domain) {
    dispatch({
      actionType: appConstants.APP_REMOVE_HISTORY_DOMAIN,
      domain
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
   * Dispatch a message to copy image
   **/
  copyImage: function (tabId, x, y) {
    dispatch({
      actionType: appConstants.APP_COPY_IMAGE,
      tabId,
      x,
      y
    })
  },

  /**
   * Dispatches a message when the app is shutting down.
   * @param {boolean} restart - whether to restart after shutdown
   */
  shuttingDown: function (restart) {
    dispatch({
      actionType: appConstants.APP_SHUTTING_DOWN,
      restart
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
   * Dispatches a message to inspect desired element on the page
   * @param {number} tabId - The tabId
   * @param {number} x - horizontal position of the element
   * @param {number} y - vertical position of the element
   */
  inspectElement: function (tabId, x, y) {
    dispatch({
      actionType: appConstants.APP_INSPECT_ELEMENT,
      tabId,
      x,
      y
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
  selectDefaultDownloadPath: function () {
    dispatch({
      actionType: appConstants.APP_SELECT_DEFAULT_DOWNLOAD_PATH
    })
  },

  /**
   * Dispatches a message to change a the pinned status of a tab
   * @param {number} tabId - The tabId of the tab to pin
   * @param {boolean} pinned - true if the pin should be pinned, false if the tab should be unpinned
   */
  tabPinned: function (tabId, pinned) {
    dispatch({
      actionType: appConstants.APP_TAB_PINNED,
      tabId,
      pinned
    })
  },

  /**
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

  mediaStartedPlaying: function (tabId, windowId) {
    dispatch({
      actionType: appConstants.APP_MEDIA_STARTED_PLAYING,
      tabId,
      queryInfo: {
        windowId
      }
    })
  },

  mediaPaused: function (tabId, windowId) {
    dispatch({
      actionType: appConstants.APP_MEDIA_PAUSED,
      tabId,
      queryInfo: {
        windowId
      }
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

  /**
   * Dispatches a message that adds a bookmark
   * @param siteDetail{Immutable.Map|Immutable.List} - Bookmark details that we want to add, this can be a List as well
   * @param closestKey{string} - Key of the sibling where we would like to place this new bookmark
   */
  addBookmark: function (siteDetail, closestKey, isLeftSide = false) {
    dispatch({
      actionType: appConstants.APP_ADD_BOOKMARK,
      siteDetail,
      closestKey,
      isLeftSide
    })
  },

  /**
   * Dispatches a message that edits a bookmark
   * @param editKey{string} - Key of the bookmark that we want to edit
   * @param siteDetail{Immutable.Map} - Data that we want to change
   */
  editBookmark: function (editKey, siteDetail) {
    dispatch({
      actionType: appConstants.APP_EDIT_BOOKMARK,
      editKey,
      siteDetail
    })
  },

  /**
   * Dispatches a message that moves a bookmark to another destination
   * @param bookmarkKey{string} - Key of the bookmark that we want to move
   * @param destinationKey{string} - Key of the bookmark/folder where we would like to move
   * @param append{boolean} - Defines if we will append(true) or prepend(false) moved bookmark
   * @param moveIntoParent{boolean} - Should we move folder into destination folder or not
   */
  moveBookmark: function (bookmarkKey, destinationKey, append, moveIntoParent) {
    dispatch({
      actionType: appConstants.APP_MOVE_BOOKMARK,
      bookmarkKey,
      destinationKey,
      append,
      moveIntoParent
    })
  },

  /**
   * Dispatches a message that removes a bookmark
   * @param bookmarkKey {string|Immutable.List} - Bookmark key that we want to remove. This could also be list of keys
   */
  removeBookmark: function (bookmarkKey) {
    dispatch({
      actionType: appConstants.APP_REMOVE_BOOKMARK,
      bookmarkKey
    })
  },

  /**
   * Dispatches a message that adds a bookmark folder
   * @param folderDetails{Immutable.Map|Immutable.List} - Folder details that we want to add, this can be List as well
   * @param closestKey{string} - Key of the sibling where we would like to place this new folder
   */
  addBookmarkFolder: function (folderDetails, closestKey) {
    dispatch({
      actionType: appConstants.APP_ADD_BOOKMARK_FOLDER,
      folderDetails,
      closestKey
    })
  },

  /**
   * Dispatches a message that edits a bookmark folder
   * @param editKey{string} - Key of the folder that we want to edit
   * @param folderDetails{Immutable.Map} - Data that we want to change
   */
  editBookmarkFolder: function (editKey, folderDetails) {
    dispatch({
      actionType: appConstants.APP_EDIT_BOOKMARK_FOLDER,
      editKey,
      folderDetails
    })
  },

  /**
   * Dispatches a message that moves a bookmark folder to another destination
   * @param folderKey{string} - Key of the folder that we want to move
   * @param destinationKey{string} - Key of the bookmark/folder where we would like to move
   * @param append{boolean} - Defines if we will append(true) or prepend(false) moved folder
   * @param moveIntoParent{boolean} - Should we move folder into destination folder or not
   */
  moveBookmarkFolder: function (folderKey, destinationKey, append, moveIntoParent) {
    dispatch({
      actionType: appConstants.APP_MOVE_BOOKMARK_FOLDER,
      folderKey,
      destinationKey,
      append,
      moveIntoParent
    })
  },

  /**
   * Dispatches a message that removes a bookmark folder
   * @param folderKey{string} - Key of the folder that we want to remove
   */
  removeBookmarkFolder: function (folderKey) {
    dispatch({
      actionType: appConstants.APP_REMOVE_BOOKMARK_FOLDER,
      folderKey
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
  },

  enablePepperMenu: function (params, tabId) {
    dispatch({
      actionType: appConstants.APP_ENABLE_PEPPER_MENU,
      params,
      tabId
    })
  },

  onFavIconReceived: function (publisherKey, blob) {
    dispatch({
      actionType: appConstants.APP_ON_FAVICON_RECEIVED,
      publisherKey,
      blob
    })
  },

  onPublisherOptionUpdate: function (publisherKey, prop, value) {
    dispatch({
      actionType: appConstants.APP_ON_PUBLISHER_OPTION_UPDATE,
      publisherKey,
      prop,
      value
    })
  },

  onPublishersOptionUpdate: function (publishersArray) {
    dispatch({
      actionType: appConstants.APP_ON_PUBLISHERS_OPTION_UPDATE,
      publishersArray
    })
  },

  onLedgerWalletCreate: function () {
    dispatch({
      actionType: appConstants.APP_ON_LEDGER_WALLET_CREATE
    })
  },

  onBootStateFile: function () {
    dispatch({
      actionType: appConstants.APP_ON_BOOT_STATE_FILE
    })
  },

  onWalletProperties: function (body) {
    dispatch({
      actionType: appConstants.APP_ON_WALLET_PROPERTIES,
      body
    })
  },

  ledgerPaymentsPresent: function (tabId, present) {
    dispatch({
      actionType: appConstants.APP_LEDGER_PAYMENTS_PRESENT,
      tabId,
      present
    })
  },

  onChangeAddFundsDialogStep: function (page, currency = 'BAT') {
    dispatch({
      actionType: appConstants.APP_ON_CHANGE_ADD_FUNDS_DIALOG_STEP,
      page,
      currency
    })
  },

  onAddFundsClosed: function () {
    dispatch({
      actionType: appConstants.APP_ON_ADD_FUNDS_CLOSED
    })
  },

  onWalletRecovery: function (error, result) {
    dispatch({
      actionType: appConstants.APP_ON_WALLET_RECOVERY,
      error,
      result
    })
  },

  onBraveryProperties: function (error, result) {
    dispatch({
      actionType: appConstants.APP_ON_BRAVERY_PROPERTIES,
      error,
      result
    })
  },

  onLedgerFirstSync: function (parsedData) {
    dispatch({
      actionType: appConstants.APP_ON_FIRST_LEDGER_SYNC,
      parsedData
    })
  },

  onLedgerCallback: function (result, delayTime) {
    dispatch({
      actionType: appConstants.APP_ON_LEDGER_CALLBACK,
      result,
      delayTime
    })
  },

  onTimeUntilReconcile: function (stateResult) {
    dispatch({
      actionType: appConstants.APP_ON_TIME_UNTIL_RECONCILE,
      stateResult
    })
  },

  onLedgerRun: function (delay) {
    dispatch({
      actionType: appConstants.APP_ON_LEDGER_RUN,
      delay
    })
  },

  onNetworkConnected: function () {
    dispatch({
      actionType: appConstants.APP_ON_NETWORK_CONNECTED
    })
  },

  resetRecoverStatus: function () {
    dispatch({
      actionType: appConstants.APP_ON_RESET_RECOVERY_STATUS
    })
  },

  onInitRead: function (parsedData) {
    dispatch({
      actionType: appConstants.APP_ON_LEDGER_INIT_READ,
      parsedData
    })
  },

  onLedgerQRGenerated: function (currency, image) {
    dispatch({
      actionType: appConstants.APP_ON_LEDGER_QR_GENERATED,
      currency,
      image
    })
  },

  /**
   * Dispatches a message that window was resized
   * @param windowValue - window properties
   * @param windowId - id of the window that we want to update
   */
  onWindowResize: function (windowValue, windowId) {
    dispatch({
      actionType: appConstants.APP_WINDOW_RESIZED,
      windowValue,
      queryInfo: {
        windowId
      }
    })
  },

  /**
   * Dispatches a message to add a given publisher to the ledger.
   * @param location - the URL of the publisher
   */
  addPublisherToLedger: function (location, tabId = false) {
    dispatch({
      actionType: appConstants.APP_ADD_PUBLISHER_TO_LEDGER,
      location,
      tabId
    })
  },

  onPublisherTimestamp: function (timestamp, updateList) {
    dispatch({
      actionType: appConstants.APP_ON_PUBLISHER_TIMESTAMP,
      timestamp,
      updateList
    })
  },

  saveLedgerPromotion: function (promotion) {
    dispatch({
      actionType: appConstants.APP_SAVE_LEDGER_PROMOTION,
      promotion
    })
  },

  onPromotionClick: function () {
    dispatch({
      actionType: appConstants.APP_ON_PROMOTION_CLICK
    })
  },

  onCaptchaResponse: function (response, body) {
    dispatch({
      actionType: appConstants.APP_ON_CAPTCHA_RESPONSE,
      body,
      response
    })
  },

  onPromotionClaim: function (x, y) {
    dispatch({
      actionType: appConstants.APP_ON_PROMOTION_CLAIM,
      x,
      y
    })
  },

  onPromotionResponse: function (status) {
    dispatch({
      actionType: appConstants.APP_ON_PROMOTION_RESPONSE,
      status
    })
  },

  onPromotionRemind: function () {
    dispatch({
      actionType: appConstants.APP_ON_PROMOTION_REMIND
    })
  },

  onPromotionRemoval: function () {
    dispatch({
      actionType: appConstants.APP_ON_PROMOTION_REMOVAL
    })
  },

  onPromotionGet: function () {
    dispatch({
      actionType: appConstants.APP_ON_PROMOTION_GET
    })
  },

  onPromotionClose: function () {
    dispatch({
      actionType: appConstants.APP_ON_PROMOTION_CLOSE
    })
  },

  onLedgerNotificationInterval: function () {
    dispatch({
      actionType: appConstants.APP_ON_LEDGER_NOTIFICATION_INTERVAL
    })
  },

  onLedgerMediaData: function (url, type, details) {
    dispatch({
      actionType: appConstants.APP_ON_LEDGER_MEDIA_DATA,
      url,
      type,
      details
    })
  },

  onPruneSynopsis: function (publishers) {
    dispatch({
      actionType: appConstants.APP_ON_PRUNE_SYNOPSIS,
      publishers
    })
  },

  onReferralCodeRead: function (body) {
    dispatch({
      actionType: appConstants.APP_ON_REFERRAL_CODE_READ,
      body
    })
  },

  onReferralCodeFail: function () {
    dispatch({
      actionType: appConstants.APP_ON_REFERRAL_CODE_FAIL
    })
  },

  onFetchReferralHeaders: function (error, response, body) {
    dispatch({
      actionType: appConstants.APP_ON_FETCH_REFERRAL_HEADERS,
      error,
      response,
      body
    })
  },

  onFileRecoveryKeys: function (file) {
    dispatch({
      actionType: appConstants.APP_ON_FILE_RECOVERY_KEYS,
      file
    })
  },

  checkReferralActivity: function () {
    dispatch({
      actionType: appConstants.APP_CHECK_REFERRAL_ACTIVITY
    })
  },

  onReferralActivity: function () {
    dispatch({
      actionType: appConstants.APP_ON_REFERRAL_ACTIVITY
    })
  },

  onHistoryLimit: function () {
    dispatch({
      actionType: appConstants.APP_ON_HISTORY_LIMIT
    })
  },

  onLedgerPinPublisher: function (publisherKey, value) {
    dispatch({
      actionType: appConstants.APP_ON_LEDGER_PIN_PUBLISHER,
      publisherKey,
      value
    })
  },

  onLedgerMediaPublisher: function (mediaKey, response, duration, revisited) {
    dispatch({
      actionType: appConstants.APP_ON_LEDGER_MEDIA_PUBLISHER,
      mediaKey,
      response,
      duration,
      revisited
    })
  },

  onLedgerFuzzing: function (newStamp, pruned) {
    dispatch({
      actionType: appConstants.APP_ON_LEDGER_FUZZING,
      newStamp,
      pruned
    })
  },

  onLedgerBackupSuccess: function () {
    dispatch({
      actionType: appConstants.APP_ON_LEDGER_BACKUP_SUCCESS
    })
  },

  onWalletPropertiesError: function () {
    dispatch({
      actionType: appConstants.APP_ON_WALLET_PROPERTIES_ERROR
    })
  },

  onWalletDelete: function () {
    dispatch({
      actionType: appConstants.APP_ON_WALLET_DELETE
    })
  },

  onPublisherToggleUpdate: function (viewData) {
    dispatch({
      actionType: appConstants.APP_ON_PUBLISHER_TOGGLE_UPDATE,
      viewData
    })
  },

  onCaptchaClose: function () {
    dispatch({
      actionType: appConstants.APP_ON_CAPTCHA_CLOSE
    })
  },

  tabInsertedToTabStrip: function (windowId, tabId, index) {
    dispatch({
      actionType: appConstants.APP_TAB_INSERTED_TO_TAB_STRIP,
      queryInfo: {
        windowId
      },
      tabId,
      index,
      windowId
    })
  },

  tabDetachedFromTabStrip: function (windowId, index) {
    dispatch({
      actionType: appConstants.APP_TAB_DETACHED_FROM_TAB_STRIP,
      index,
      windowId
    })
  },

  onTorError: function (message) {
    dispatch({
      actionType: appConstants.APP_ON_TOR_ERROR,
      message
    })
  },

  onTorInitPercentage: function (percentage) {
    dispatch({
      actionType: appConstants.APP_ON_TOR_INIT_PERCENTAGE,
      percentage
    })
  },

  onTorOnline: function (online) {
    dispatch({
      actionType: appConstants.APP_ON_TOR_ONLINE,
      online
    })
  },

  setTorNewIdentity: function (tabId, url) {
    dispatch({
      actionType: appConstants.APP_SET_TOR_NEW_IDENTITY,
      tabId,
      url
    })
  },

  restartTor: function () {
    dispatch({
      actionType: appConstants.APP_RESTART_TOR
    })
  },

  recreateTorTab: function (torEnabled, tabId, index) {
    dispatch({
      actionType: appConstants.APP_RECREATE_TOR_TAB,
      torEnabled,
      tabId,
      index
    })
  }
}

module.exports = appActions
