/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const mapValuesByKeys = require('../lib/functional').mapValuesByKeys

const _ = null
const messages = {
  // URL bar shortcuts
  SHORTCUT_FOCUS_URL: _,
  // Active frame shortcuts
  SHORTCUT_ACTIVE_FRAME_STOP: _,
  SHORTCUT_ACTIVE_FRAME_RELOAD: _,
  SHORTCUT_ACTIVE_FRAME_CLEAN_RELOAD: _,
  SHORTCUT_ACTIVE_FRAME_ZOOM_IN: _,
  SHORTCUT_ACTIVE_FRAME_ZOOM_OUT: _,
  SHORTCUT_ACTIVE_FRAME_ZOOM_RESET: _,
  SHORTCUT_ACTIVE_FRAME_TOGGLE_DEV_TOOLS: _,
  SHORTCUT_SET_ACTIVE_FRAME_BY_INDEX: _, /** @arg {number} index of frame */
  SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE: _,
  SHORTCUT_SET_ACTIVE_FRAME_TO_LAST: _,
  SHORTCUT_ACTIVE_FRAME_SAVE: _,
  SHORTCUT_ACTIVE_FRAME_PRINT: _,
  SHORTCUT_ACTIVE_FRAME_SHOW_FINDBAR: _,
  SHORTCUT_ACTIVE_FRAME_BACK: _,
  SHORTCUT_ACTIVE_FRAME_FORWARD: _,
  SHORTCUT_ACTIVE_FRAME_BOOKMARK: _,
  SHORTCUT_ACTIVE_FRAME_REMOVE_BOOKMARK: _,
  SHORTCUT_ACTIVE_FRAME_LOAD_URL: _, /** @arg {string} url to load */
  SHORTCUT_ACTIVE_FRAME_COPY: _,
  SHORTCUT_ACTIVE_FRAME_FIND_NEXT: _,
  SHORTCUT_ACTIVE_FRAME_FIND_PREV: _,
  // Frame management shortcuts
  SHORTCUT_NEW_FRAME: _, /** @arg {string} opt_url to load if any */
  SHORTCUT_CLOSE_FRAME: _, /** @arg {number} opt_key of frame, defaults to active frame */
  SHORTCUT_CLOSE_OTHER_FRAMES: _, /** @arg {boolean} close to the right, @arg {boolean} close to the left */
  SHORTCUT_UNDO_CLOSED_FRAME: _,
  SHORTCUT_FRAME_MUTE: _,
  SHORTCUT_FRAME_RELOAD: _, /** @arg {number} key of frame */
  SHORTCUT_NEXT_TAB: _,
  SHORTCUT_PREV_TAB: _,
  // Misc application events
  QUIT_APPLICATION: _,
  UPDATE_APP_MENU: _, /** @arg {Object} args menu args to update */
  CERT_ERROR: _, /** @arg {Object} details of certificate error */
  LOGIN_REQUIRED: _, /** @arg {Object} details of the login required request */
  LOGIN_RESPONSE: _,
  NOTIFICATION_RESPONSE: _, /** @arg {string} message, @arg {number} buttonId, @arg {boolean} persist */
  // Downloads
  SHOW_DOWNLOADS_TOOLBAR: _, /** Ensures the downloads toolbar is visible */
  DOWNLOAD_ACTION: _, /** @arg {string} downloadId, @arg {string} action such as 'resume', 'pause', or 'cancel' */
  // Updates
  UPDATE_REQUESTED: _,
  UPDATE_AVAILABLE: _,
  UPDATE_NOT_AVAILABLE: _,
  CHECK_FOR_UPDATE: _,
  SHOW_ABOUT: _,
  UPDATE_META_DATA_RETRIEVED: _,
  SEND_XHR_REQUEST: _, /** @arg {string} url to request, @arg {number} nonce, @arg {Object=} headers if any */
  GOT_XHR_RESPONSE: _, /** @arg {Object} response, @arg {string} body */
  DOWNLOAD_DATAFILE: _, /** @arg {string} url, @arg {number} nonce, @arg {Object} headers, @arg {string} path */
  DOWNLOAD_DATAFILE_DONE: _, /** @arg {Object} response */
  // App state
  APP_INITIALIZED: _,
  // Web contents state
  WEB_CONTENTS_INITIALIZED: _,
  // Webview page messages
  CONTEXT_MENU_OPENED: _, /** @arg {Object} nodeProps properties of node being clicked */
  APP_STATE_CHANGE: _,
  STOP_LOAD: _,
  THEME_COLOR_COMPUTED: _,
  HIDE_CONTEXT_MENU: _,
  LEAVE_FULL_SCREEN: _,
  ENTER_FULL_SCREEN: _,
  SET_CLIPBOARD: _,
  GOT_CANVAS_FINGERPRINTING: _,
  SHOW_NOTIFICATION: _, /** @arg {string} l10n id of desktop notification message */
  SET_RESOURCE_ENABLED: _,
  GO_BACK: _,
  GO_FORWARD: _,
  // Password manager
  GET_PASSWORDS: _, /** @arg {string} formOrigin, @arg {string} action */
  GOT_PASSWORD: _, /** @arg {string} username, @arg {string} password, @arg {string} origin, @arg {string} action, @arg {boolean} isUnique */
  SAVE_PASSWORD: _, /** @arg {string} username, @arg {string} password, @arg {string} formOrigin, @arg {string} action */
  IS_MISSPELLED: _, /** @arg {string} word, the word to check */
  GET_MISSPELLING_INFO: _, /** @arg {string} word, the word to lookup */
  SHOW_USERNAME_LIST: _, /** @arg {string} formOrigin, @arg {string} action, @arg {Object} boundingRect, @arg {string} usernameValue */
  FILL_PASSWORD: _, /** @arg {string} username, @arg {string} password, @arg {string} origin, @arg {string} action */
  PASSWORD_DETAILS_UPDATED: _, /** @arg {Object} passwords app state */
  PASSWORD_SITE_DETAILS_UPDATED: _, /** @arg {Object} passwords app state */
  DECRYPT_PASSWORD: _, /** @arg {string} encrypted pw, @arg {string} iv, @arg {string} authTag, @arg {number} id */
  DECRYPTED_PASSWORD: _, /** @arg {number} decrypted pw, @arg {number} id */
  DELETE_PASSWORD: _, /** @arg {Object} password */
  DELETE_PASSWORD_SITE: _, /** @arg {string} site */
  CLEAR_PASSWORDS: _,
  // Init
  INITIALIZE_WINDOW: _,
  INITIALIZE_PARTITION: _, /** @arg {string} name of partition */
  // Session restore
  REQUEST_WINDOW_STATE: _,
  RESPONSE_WINDOW_STATE: _,
  LAST_WINDOW_STATE: _,
  UNDO_CLOSED_WINDOW: _,
  // Ad block, safebrowsing, and tracking protection
  BLOCKED_RESOURCE: _,
  BLOCKED_PAGE: _,
  // About pages to contentScripts
  SETTINGS_UPDATED: _,
  SITE_SETTINGS_UPDATED: _,
  BRAVERY_DEFAULTS_UPDATED: _,
  BOOKMARKS_UPDATED: _,
  DOWNLOADS_UPDATED: _,
  FLASH_UPDATED: _,
  // About pages from contentScript
  CHANGE_SETTING: _,
  CHANGE_SITE_SETTING: _,
  NEW_FRAME: _,
  MOVE_SITE: _,
  OPEN_DOWNLOAD_PATH: _,
  RELOAD_URL: _,
  DISPATCH_ACTION: _,
  CHECK_FLASH_INSTALLED: _,
  // HTTPS
  CERT_ERROR_ACCEPTED: _, /** @arg {string} url where a cert error was accepted */
  CHECK_CERT_ERROR_ACCEPTED: _, /** @arg {string} url to check cert error, @arg {number} key of frame */
  SET_SECURITY_STATE: _, /** @arg {number} key of frame, @arg {Object} security state */
  HTTPSE_RULE_APPLIED: _, /** @arg {string} name of ruleset file, @arg {Object} details of rewritten request */
  // Bookmarks
  IMPORT_BOOKMARKS: _,
  // Extensions
  NEW_POPUP_WINDOW: _,
  // NoScript
  TEMPORARY_ALLOW_SCRIPTS: _ /** @arg {string} origin to allow scripts on */
}

module.exports = mapValuesByKeys(messages)
