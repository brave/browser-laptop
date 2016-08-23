/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const messages = require('../constants/messages')
const serializer = require('../dispatcher/serializer')
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
    ipc.send(messages.CHANGE_SETTING, key, value)
  },

  /**
   * Dispatches an event to the renderer process to change a site setting
   *
   * @param {string} hostPattern - host pattern of site
   * @param {string} key - The settings key to change the value on
   * @param {string} value - The value of the setting to set
   */
  changeSiteSetting: function (hostPattern, key, value) {
    ipc.send(messages.CHANGE_SITE_SETTING, hostPattern, key, value)
  },

  /**
   * Dispatches an event to the renderer process to remove a site setting
   *
   * @param {string} hostPattern - host pattern of site
   * @param {string} key - The settings key to change the value on
   */
  removeSiteSetting: function (hostPattern, key) {
    ipc.send(messages.REMOVE_SITE_SETTING, hostPattern, key)
  },

  /**
   * Loads a URL in a new frame in a safe way.
   * It is important that it is not a simple anchor because it should not
   * preserve the about preload script. See #672
   */
  newFrame: function (frameOpts, openInForeground = true) {
    ipc.sendToHost(messages.NEW_FRAME, frameOpts, openInForeground)
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
    ipc.send(messages.MOVE_SITE, sourceDetail, destinationDetail, prepend, destinationIsParent)
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

  deletePassword: function (password) {
    ipc.send(messages.DELETE_PASSWORD, password)
  },

  deletePasswordSite: function (origin) {
    ipc.send(messages.DELETE_PASSWORD_SITE, origin)
  },

  clearPasswords: function () {
    ipc.send(messages.CLEAR_PASSWORDS)
  },

  checkFlashInstalled: function () {
    ipc.send(messages.CHECK_FLASH_INSTALLED)
  },

  showNotification: function (msg) {
    ipc.send(messages.SHOW_NOTIFICATION, msg)
  },

  setResourceEnabled: function (resourceName, enabled) {
    ipc.send(messages.SET_RESOURCE_ENABLED, resourceName, enabled)
  },

  clearBrowsingDataNow: function (clearBrowsingDataDetail) {
    ipc.sendToHost(messages.CLEAR_BROWSING_DATA_NOW, clearBrowsingDataDetail)
  },

  createWallet: function () {
    ipc.send(messages.LEDGER_CREATE_WALLET)
  }
}
module.exports = AboutActions
