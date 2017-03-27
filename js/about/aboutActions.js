/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const messages = require('../constants/messages')
const appDispatcher = require('../dispatcher/appDispatcher')
const windowConstants = require('../constants/windowConstants')
const appConstants = require('../constants/appConstants')
const ipc = window.chrome.ipcRenderer

const aboutActions = {
  /**
   * Dispatches a window action
   * @param {string} key - The settings key to change the value on
   * @param {string} value - The value of the setting to set
   */
  dispatchAction: function (action) {
    appDispatcher.dispatch(action)
  },

  /**
   * Dispatches an event to the renderer process to change a setting
   *
   * @param {string} key - The settings key to change the value on
   * @param {string} value - The value of the setting to set
   */
  changeSetting: function (key, value) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_CHANGE_SETTING,
      key,
      value
    })
  },

  /**
   * Dispatches an event to the renderer process to change a site setting
   *
   * @param {string} hostPattern - host pattern of site
   * @param {string} key - The settings key to change the value on
   * @param {string} value - The value of the setting to set
   */
  changeSiteSetting: function (hostPattern, key, value) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_CHANGE_SITE_SETTING,
      hostPattern,
      key,
      value
    })
  },

  /**
   * Dispatches an event to the renderer process to remove a site setting
   *
   * @param {string} hostPattern - host pattern of site
   * @param {string} key - The settings key to change the value on
   */
  removeSiteSetting: function (hostPattern, key) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_REMOVE_SITE_SETTING,
      hostPattern,
      key
    })
  },

  /**
   * Dispatches an event to the renderer process to remove all site settings
   *
   * @param {string} key - The settings key to remove
   */
  clearSiteSettings: function (key) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_CLEAR_SITE_SETTINGS,
      key
    })
  },

  /**
   * Dispatches a message when sync init data needs to be saved
   * @param {Array.<number>|null} seed
   */
  saveSyncInitData: function (seed) {
    ipc.send(messages.SAVE_INIT_DATA, seed)
  },

  /**
   * Dispatches a message when sync needs to be restarted
   * @param {Array.<number>|null} seed
   */
  reloadSyncExtension: function () {
    ipc.send(messages.RELOAD_SYNC_EXTENSION)
  },

  /**
   * Dispatches a message to reset Sync data on this device and the cloud.
   */
  resetSync: function () {
    ipc.send(messages.RESET_SYNC)
  },

  /**
   * Loads a URL in a new frame in a safe way.
   * It is important that it is not a simple anchor because it should not
   * preserve the about preload script. See #672
   * Opens a new tab and loads the specified URL.
   */
  createTabRequested: function (createProperties) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_CREATE_TAB_REQUESTED,
      createProperties
    })
  },

  /**
   * Generates a file with the users backup keys
   */
  ledgerGenerateKeyFile: function (backupAction) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_BACKUP_KEYS,
      backupAction
    })
  },

  /**
   * Recover wallet by merging old wallet into new one
   */
  ledgerRecoverWallet: function (firstRecoveryKey, secondRecoveryKey) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_RECOVER_WALLET,
      firstRecoveryKey,
      secondRecoveryKey
    })
  },

  ledgerRecoverWalletFromFile: function () {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_RECOVER_WALLET,
      useRecoveryKeyFile: true
    })
  },

  /**
   * Clear wallet recovery status
   */
  clearRecoveryStatus: function () {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_LEDGER_RECOVERY_STATUS_CHANGED,
      recoverySucceeded: undefined
    })
  },

  /**
   * Click through a certificate error.
   *
   * @param {string} url - The URL with the cert error
   */
  acceptCertError: function (url) {
    ipc.send(messages.CERT_ERROR_ACCEPTED, url)
  },

  /**
   * Get certificate detail when error.
   *
   * @param {string} url - The URL with the cert error
   */
  getCertErrorDetail: function (url) {
    ipc.send(messages.GET_CERT_ERROR_DETAIL, url)
  },

  /**
   * Opens a context menu
   */
  contextMenu: function (nodeProps, contextMenuType, e) {
    e.preventDefault()
    e.stopPropagation()
    ipc.sendToHost(messages.CONTEXT_MENU_OPENED, nodeProps, contextMenuType)
  },

  moveSite: function (sourceDetail, destinationDetail, prepend, destinationIsParent) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_MOVE_SITE,
      sourceDetail,
      destinationDetail,
      prepend,
      destinationIsParent
    })
  },

  downloadRevealed: function (downloadId) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_DOWNLOAD_REVEALED,
      downloadId
    })
  },

  decryptPassword: function (encryptedPassword, authTag, iv, id) {
    ipc.send(messages.DECRYPT_PASSWORD, encryptedPassword, authTag, iv, id)
  },

  setClipboard: function (text) {
    ipc.send(messages.SET_CLIPBOARD, text)
  },

  setNewTabDetail: function (newTabPageDetail, refresh) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_CHANGE_NEW_TAB_DETAIL,
      newTabPageDetail,
      refresh
    })
  },

  deletePassword: function (password) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_REMOVE_PASSWORD,
      passwordDetail: password
    })
  },

  deletePasswordSite: function (origin) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_CHANGE_SITE_SETTING,
      hostPattern: origin,
      key: 'savePasswords'
    })
  },

  clearPasswords: function () {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_CLEAR_PASSWORDS
    })
  },

  setResourceEnabled: function (resourceName, enabled) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_SET_RESOURCE_ENABLED,
      resourceName,
      enabled
    })
  },

  clearBrowsingDataNow: function () {
    ipc.sendToHost(messages.CLEAR_BROWSING_DATA_NOW)
  },

  importBrowserDataNow: function () {
    ipc.send(messages.IMPORT_BROWSER_DATA_NOW)
  },

  /**
   * Export bookmarks
   */
  exportBookmarks: function () {
    ipc.send(messages.EXPORT_BOOKMARKS)
  },

  createWallet: function () {
    ipc.send(messages.LEDGER_CREATE_WALLET)
  },

  setLedgerEnabled: function (enabled) {
    ipc.send(messages.LEDGER_ENABLE, enabled)
  },

  /**
   * Open a adding address dialog
   */
  addAutofillAddress: function () {
    ipc.sendToHost(messages.AUTOFILL_SET_ADDRESS, {}, {})
  },

  /**
   * Remove address
   *
   * @param {object} address - address to remove as per doc/state.md's autofillAddressDetail
   */
  removeAutofillAddress: function (address) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_REMOVE_AUTOFILL_ADDRESS,
      detail: address
    })
  },

  /**
   * Open a edit address dialog
   *
   * @param {object} address - address to edit as per doc/state.md's autofillAddressDetail
   */
  editAutofillAddress: function (address) {
    ipc.sendToHost(messages.AUTOFILL_SET_ADDRESS, address.toJS(), address.toJS())
  },

  /**
   * Open a adding credit card dialog
   */
  addAutofillCreditCard: function () {
    ipc.sendToHost(messages.AUTOFILL_SET_CREDIT_CARD,
      {month: '01', year: new Date().getFullYear().toString()}, {})
  },

  /**
   * Remove credit card
   *
   * @param {object} card - credit card to remove as per doc/state.md's autofillCreditCardDetail
   */
  removeAutofillCreditCard: function (card) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_REMOVE_AUTOFILL_CREDIT_CARD,
      detail: card
    })
  },

  /**
   * Open a editing credit card dialog
   *
   * @param {object} card - credit card to edit as per doc/state.md's autofillCreditCardDetail
   */
  editAutofillCreditCard: function (card) {
    ipc.sendToHost(messages.AUTOFILL_SET_CREDIT_CARD, card.toJS(), card.toJS())
  },

  /**
   * Dispatches an event to the browser process to register or deregister a datafile
   *
   * @param {uuid} The unique ID of the adblock datafile
   * @param {enable} true if the adBlock data file should be used
   */
  updateAdblockDataFiles: function (uuid, enable) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_UPDATE_ADBLOCK_DATAFILES,
      uuid,
      enable
    })
  },

  /**
   * Dispatches an event to the renderer process to update custom adblock rules.
   *
   * @param {rules} ABP filter syntax rule string
   */
  updateCustomAdblockRules: function (rules) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_UPDATE_ADBLOCK_CUSTOM_RULES,
      rules
    })
  },

  /**
   * Show the "Add Bookmark" control
   * @param {Object} siteDetail - object bound to add/edit control
   */
  showAddBookmark: function (siteDetail) {
    aboutActions.dispatchAction({
      actionType: windowConstants.WINDOW_SET_BOOKMARK_DETAIL,
      currentDetail: siteDetail,
      originalDetail: null,
      destinationDetail: null,
      shouldShowLocation: true
    })
  },

  /**
   * Show the "Add Bookmark" control for a folder
   * @param {Object} siteDetail - object bound to add/edit control
   */
  showAddBookmarkFolder: function (siteDetail) {
    aboutActions.dispatchAction({
      actionType: windowConstants.WINDOW_SET_BOOKMARK_DETAIL,
      currentDetail: siteDetail
    })
  },

  /**
   * Dispatches a message to set add/edit bookmark details
   * If set, also indicates that add/edit is shown
   * @param {Object} currentDetail - Properties of the bookmark to change to
   * @param {Object} originalDetail - Properties of the bookmark to edit
   * @param {Object} destinationDetail - Will move the added bookmark to the specified position
   * @param {boolean} shouldShowLocation - Whether or not to show the URL input
   * @param {boolean} isBookmarkHanger - true if triggered from star icon in nav bar
   */
  setBookmarkDetail: function (currentDetail, originalDetail, destinationDetail, shouldShowLocation, isBookmarkHanger) {
    aboutActions.dispatchAction({
      actionType: windowConstants.WINDOW_SET_BOOKMARK_DETAIL,
      currentDetail,
      originalDetail,
      destinationDetail,
      shouldShowLocation,
      isBookmarkHanger
    })
  },

  /**
   * Dispatch a message to set default browser
   */
  setAsDefaultBrowser: function () {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_DEFAULT_BROWSER_UPDATED,
      useBrave: true
    })
  },

  /**
   * Dispatches a message to render a URL into a PDF file
   */
  renderUrlToPdf: function (url, savePath) {
    aboutActions.dispatchAction({
      actionType: appConstants.APP_RENDER_URL_TO_PDF,
      url: url,
      savePath: savePath
    })
  }
}
module.exports = aboutActions
