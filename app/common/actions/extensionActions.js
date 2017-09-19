/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const AppDispatcher = require('../../../js/dispatcher/appDispatcher')
const ExtensionConstants = require('../constants/extensionConstants')

const extensionActions = {
  /**
   * Dispatched when an extension browser action is added
   *
   * @param {string} extensionId - the extension id
   * @param {object} browserAction - browser action details
   */
  browserActionRegistered: function (extensionId, browserAction) {
    AppDispatcher.dispatch({
      actionType: ExtensionConstants.BROWSER_ACTION_REGISTERED,
      extensionId,
      browserAction
    })
  },

  browserActionUpdated: function (extensionId, browserAction, tabId) {
    AppDispatcher.dispatch({
      actionType: ExtensionConstants.BROWSER_ACTION_UPDATED,
      extensionId,
      browserAction,
      tabId
    })
  },

  /**
   * Dispatched when an extension has been installed
   *
   * @param {string} extensionId - the extension id
   */
  extensionInstalled: function (extensionId, installInfo) {
    AppDispatcher.dispatch({
      actionType: ExtensionConstants.EXTENSION_INSTALLED,
      extensionId,
      installInfo
    })
  },

  /**
   * Dispatched when an extension has been uninstalled
   *
   * @param {string} extensionId - the extension id
   */
  extensionUninstalled: function (extensionId) {
    AppDispatcher.dispatch({
      actionType: ExtensionConstants.EXTENSION_UNINSTALLED,
      extensionId
    })
  },

  /**
   * Dispatched when an extension has been enabled
   *
   * @param {string} extensionId - the extension id
   */
  extensionEnabled: function (extensionId) {
    AppDispatcher.dispatch({
      actionType: ExtensionConstants.EXTENSION_ENABLED,
      extensionId
    })
  },

  /**
   * Dispatched when an extension has been disabled
   *
   * @param {string} extensionId - the extension id
   */
  extensionDisabled: function (extensionId) {
    AppDispatcher.dispatch({
      actionType: ExtensionConstants.EXTENSION_DISABLED,
      extensionId
    })
  },

  /**
   * Dispatched when an extension has created item in context menu
   *
   * @param {string} extensionId - the extension id
   * @param {string} menuItemId - the id of the menu item that was clicked
   * @param {object} properties - createProperties of chrome.contextMenus.create
   * @param {string} icon - 16x16 extension icon
   */
  contextMenuCreated: function (extensionId, menuItemId, properties, icon) {
    AppDispatcher.dispatch({
      actionType: ExtensionConstants.CONTEXT_MENU_CREATED,
      extensionId,
      menuItemId,
      properties,
      icon
    })
  },

  /**
   * Dispatched when an extension has removed all item in context menu
   *
   * @param {string} extensionId - the extension id
   */
  contextMenuAllRemoved: function (extensionId) {
    AppDispatcher.dispatch({
      actionType: ExtensionConstants.CONTEXT_MENU_ALL_REMOVED,
      extensionId
    })
  },

  /**
   * Dispatched when an menu item created by extension is clicked
   *
   * @param {string} extensionId - the extension id
   * @param {string} tabId - the tab id
   * @param {object} info - the arg of onclick callback
   */
  contextMenuClicked: function (extensionId, tabId, info) {
    AppDispatcher.dispatch({
      actionType: ExtensionConstants.CONTEXT_MENU_CLICKED,
      extensionId,
      tabId,
      info
    })
  }
}

module.exports = extensionActions
