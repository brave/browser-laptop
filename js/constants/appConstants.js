/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const mapValuesByKeys = require('../lib/functional').mapValuesByKeys

const _ = null
const AppConstants = {
  APP_NEW_WINDOW: _,
  APP_CLOSE_WINDOW: _,
  APP_ADD_SITE: _,
  APP_CLEAR_HISTORY: _,
  APP_SET_STATE: _,
  APP_REMOVE_SITE: _,
  APP_MOVE_SITE: _,
  APP_MERGE_DOWNLOAD_DETAIL: _, // Sets an individual download detail
  APP_CLEAR_COMPLETED_DOWNLOADS: _, // Removes all completed downloads
  APP_ADD_PASSWORD: _, /** @param {Object} passwordDetail */
  APP_REMOVE_PASSWORD: _, /** @param {Object} passwordDetail */
  APP_CLEAR_PASSWORDS: _,
  APP_SET_DEFAULT_WINDOW_SIZE: _,
  APP_SET_DATA_FILE_ETAG: _,
  APP_SET_DATA_FILE_LAST_CHECK: _,
  APP_SET_RESOURCE_ENABLED: _,
  APP_ADD_RESOURCE_COUNT: _,
  APP_UPDATE_LAST_CHECK: _,
  APP_SET_UPDATE_STATUS: _,
  APP_CHANGE_SETTING: _,
  APP_CHANGE_SITE_SETTING: _,
  APP_REMOVE_SITE_SETTING: _,
  APP_CLEAR_DATA: _,
  APP_UPDATE_LEDGER_INFO: _,
  APP_UPDATE_PUBLISHER_INFO: _,
  APP_SHOW_MESSAGE_BOX: _, /** @param {Object} detail */
  APP_HIDE_MESSAGE_BOX: _, /** @param {string} message */
  APP_CLEAR_MESSAGE_BOXES: _, /** @param {string} origin */
  APP_ADD_WORD: _, /** @param {string} word, @param {boolean} learn */
  APP_SET_DICTIONARY: _, /** @param {string} locale */
  APP_ADD_AUTOFILL_ADDRESS: _,
  APP_REMOVE_AUTOFILL_ADDRESS: _,
  APP_ADD_AUTOFILL_CREDIT_CARD: _,
  APP_REMOVE_AUTOFILL_CREDIT_CARD: _,
  APP_SET_LOGIN_REQUIRED_DETAIL: _,
  APP_SET_LOGIN_RESPONSE_DETAIL: _,
  APP_WINDOW_BLURRED: _,
  APP_IDLE_STATE_CHANGED: _,
  APP_NETWORK_CONNECTED: _,
  APP_NETWORK_DISCONNECTED: _,
  APP_CHANGE_NEW_TAB_DETAIL: _,
  APP_TAB_CREATED: _,
  APP_TAB_DESTROYED: _,
  APP_SET_MENUBAR_TEMPLATE: _
}

module.exports = mapValuesByKeys(AppConstants)
