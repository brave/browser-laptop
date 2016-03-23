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
  // Updates
  UPDATE_REQUESTED: _,
  UPDATE_AVAILABLE: _,
  UPDATE_NOT_AVAILABLE: _,
  CHECK_FOR_UPDATE: _,
  SHOW_ABOUT: _,
  UPDATE_META_DATA_RETRIEVED: _,
  // App state
  APP_INITIALIZED: _,
  // Webview page messages
  SET_AD_DIV_CANDIDATES: _, /** @arg {Array} adDivCandidates, @arg {string} placeholderUrl */
  CONTEXT_MENU_OPENED: _, /** @arg {Object} nodeProps properties of node being clicked */
  LINK_HOVERED: _, /** @arg {string} href of hovered link */
  APP_STATE_CHANGE: _,
  APP_ACTION: _,
  STOP_LOAD: _,
  POST_PAGE_LOAD_RUN: _,
  THEME_COLOR_COMPUTED: _,
  HIDE_CONTEXT_MENU: _,
  LEAVE_FULL_SCREEN: _,
  // Password manager
  GET_PASSWORD: _, /** @arg {string} formOrigin, @arg {string} action */
  GOT_PASSWORD: _, /** @arg {string} username, @arg {string} password */
  SAVE_PASSWORD: _, /** @arg {string} username, @arg {string} password, @arg {string} formOrigin, @arg {string} action */
  SHOW_USERNAME_LIST: _, /** @arg {string} formOrigin, @arg {string} action, @arg {Object} boundingRect, @arg {string} usernameValue */
  FILL_PASSWORD: _, /** @arg {string} username, @arg {string} password, @arg {string} origin, @arg {string} action */
  // Init
  INITIALIZE_WINDOW: _,
  INITIALIZE_PARTITION: _, /** @arg {string} name of partition */
  // Session restore
  REQUEST_WINDOW_STATE: _,
  RESPONSE_WINDOW_STATE: _,
  LAST_WINDOW_STATE: _,
  UNDO_CLOSED_WINDOW: _,
  // Ad block and tracking protection
  BLOCKED_RESOURCE: _,
  // About pages to contentScripts
  SETTINGS_UPDATED: _,
  BOOKMARKS_UPDATED: _,
  // About pages from contentScript
  CHANGE_SETTING: _,
  NEW_FRAME: _,
  MOVE_SITE: _,
  // HTTPS
  CERT_DETAILS_UPDATED: _, /** @arg {Object} security state of the active frame */
  CERT_ERROR_ACCEPTED: _, /** @arg {string} url where a cert error was accepted */
  CERT_ERROR_REJECTED: _, /** @arg {string} url where a cert error was rejected */
  SET_SECURITY_STATE: _, /** @arg {number} key of frame, @arg {Object} security state */
  CHECK_CERT_ERROR_ACCEPTED: _, /** @arg {string} url to check cert error, @arg {number} key of frame */
  HTTPSE_RULE_APPLIED: _, /** @arg {string} name of ruleset file, @arg {Object} details of rewritten request */
  // Bookmarks
  IMPORT_BOOKMARKS: _
}

module.exports = mapValuesByKeys(messages)
