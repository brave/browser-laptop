/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const messages = require('../constants/messages')
const serializer = require('../dispatcher/serializer')
const WindowConstants = require('../constants/windowConstants')
const AppConstants = require('../constants/appConstants')
const ipc = window.chrome.ipc

const AboutActions = {
  /**
   * Dispatches a window action
   * @param {string} key - The settings key to change the value on
   * @param {string} value - The value of the setting to set
   */
  dispatchAction: function (action) {
    ipc.send(messages.DISPATCH_ACTION, serializer.serialize(action))
  },

  /**
   * Dispatches an event to the renderer process to change a setting
   *
   * @param {string} key - The settings key to change the value on
   * @param {string} value - The value of the setting to set
   */
  changeSetting: function (key, value) {
    AboutActions.dispatchAction({
      actionType: AppConstants.APP_CHANGE_SETTING,
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
    AboutActions.dispatchAction({
      actionType: AppConstants.APP_CHANGE_SITE_SETTING,
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
    AboutActions.dispatchAction({
      actionType: AppConstants.APP_REMOVE_SITE_SETTING,
      hostPattern,
      key
    })
  },

  /**
   * Loads a URL in a new frame in a safe way.
   * It is important that it is not a simple anchor because it should not
   * preserve the about preload script. See #672
   */
  newFrame: function (frameOpts, openInForeground = true) {
    AboutActions.dispatchAction({
      actionType: WindowConstants.WINDOW_NEW_FRAME,
      frameOpts,
      openInForeground
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
    AboutActions.dispatchAction({
      actionType: AppConstants.APP_MOVE_SITE,
      sourceDetail,
      destinationDetail,
      prepend,
      destinationIsParent
    })
  },

  openDownloadPath: function (download) {
    ipc.send(messages.OPEN_DOWNLOAD_PATH, download.toJS())
  },

  decryptPassword: function (encryptedPassword, authTag, iv, id) {
    ipc.send(messages.DECRYPT_PASSWORD, encryptedPassword, authTag, iv, id)
  },

  setClipboard: function (text) {
    ipc.send(messages.SET_CLIPBOARD, text)
  },

  setNewTabDetail: function (newTabPageDetail) {
    AboutActions.dispatchAction({
      actionType: AppConstants.APP_CHANGE_NEW_TAB_DETAIL,
      newTabPageDetail
    })
  },

  deletePassword: function (password) {
    AboutActions.dispatchAction({
      actionType: AppConstants.APP_REMOVE_PASSWORD,
      passwordDetail: password
    })
  },

  deletePasswordSite: function (origin) {
    AboutActions.dispatchAction({
      actionType: AppConstants.APP_CHANGE_SITE_SETTING,
      hostPattern: origin,
      key: 'savePasswords'
    })
  },

  clearPasswords: function () {
    AboutActions.dispatchAction({
      actionType: AppConstants.APP_CLEAR_PASSWORDS
    })
  },

  checkFlashInstalled: function () {
    ipc.send(messages.CHECK_FLASH_INSTALLED)
  },

  setResourceEnabled: function (resourceName, enabled) {
    AboutActions.dispatchAction({
      actionType: AppConstants.APP_SET_RESOURCE_ENABLED,
      resourceName,
      enabled
    })
  },

  clearBrowsingDataNow: function (clearBrowsingDataDetail) {
    ipc.sendToHost(messages.CLEAR_BROWSING_DATA_NOW, clearBrowsingDataDetail)
  },

  importBrowerDataNow: function () {
    ipc.send(messages.IMPORT_BROWSER_DATA_NOW)
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
    AboutActions.dispatchAction({
      actionType: WindowConstants.WINDOW_SET_AUTOFILL_ADDRESS_DETAIL,
      currentDetail: {},
      originalDetail: {}
    })
  },

  /**
   * Remove address
   *
   * @param {object} address - address to remove as per doc/state.md's autofillAddressDetail
   */
  removeAutofillAddress: function (address) {
    AboutActions.dispatchAction({
      actionType: AppConstants.APP_REMOVE_AUTOFILL_ADDRESS,
      detail: address
    })
  },

  /**
   * Open a edit address dialog
   *
   * @param {object} address - address to edit as per doc/state.md's autofillAddressDetail
   */
  editAutofillAddress: function (address) {
    AboutActions.dispatchAction({
      actionType: WindowConstants.WINDOW_SET_AUTOFILL_ADDRESS_DETAIL,
      currentDetail: address,
      originalDetail: address
    })
  },

  /**
   * Open a adding credit card dialog
   */
  addAutofillCreditCard: function () {
    AboutActions.dispatchAction({
      actionType: WindowConstants.WINDOW_SET_AUTOFILL_CREDIT_CARD_DETAIL,
      currentDetail: {month: '01', year: new Date().getFullYear().toString()},
      originalDetail: {}
    })
  },

  /**
   * Remove credit card
   *
   * @param {object} card - credit card to remove as per doc/state.md's autofillCreditCardDetail
   */
  removeAutofillCreditCard: function (card) {
    AboutActions.dispatchAction({
      actionType: AppConstants.APP_REMOVE_AUTOFILL_CREDIT_CARD,
      detail: card
    })
  },

  /**
   * Open a editing credit card dialog
   *
   * @param {object} card - credit card to edit as per doc/state.md's autofillCreditCardDetail
   */
  editAutofillCreditCard: function (card) {
    AboutActions.dispatchAction({
      actionType: WindowConstants.WINDOW_SET_AUTOFILL_CREDIT_CARD_DETAIL,
      currentDetail: card,
      originalDetail: card
    })
  }
}
module.exports = AboutActions
