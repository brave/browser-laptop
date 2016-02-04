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
  // Frame management shortcuts
  SHORTCUT_NEW_FRAME: _, /** @arg {string} opt_url to load if any */
  SHORTCUT_CLOSE_FRAME: _, /** @arg {number} opt_key of frame, defaults to active frame */
  SHORTCUT_UNDO_CLOSED_FRAME: _,
  SHORTCUT_FRAME_MUTE: _,
  SHORTCUT_FRAME_RELOAD: _, /** @arg {number} key of frame */
  SHORTCUT_NEXT_TAB: _,
  SHORTCUT_PREV_TAB: _,
  // Misc application events
  QUIT_APPLICATION: _,
  UPDATE_APP_MENU: _, /** @arg {Object} args menu args to update */
  // Updates
  UPDATE_REQUESTED: _,
  UPDATE_AVAILABLE: _,
  UPDATE_NOT_AVAILABLE: _,
  CHECK_FOR_UPDATE: _,
  UPDATE_META_DATA_RETRIEVED: _,
  // App state
  APP_INITIALIZED: _,
  // Webview page messages
  SET_AD_DIV_CANDIDATES: _, /** @arg {Array} adDivCandidates, @arg {string} placeholderUrl */
  CONTEXT_MENU_OPENED: _, /** @arg {Object} nodeProps properties of node being clicked */
  APP_STATE_CHANGE: _,
  APP_ACTION: _,
  STOP_LOAD: _,
  GO_FORWARD: _,
  GO_BACK: _,
  // Session restore
  REQUEST_WINDOW_STATE: _,
  RESPONSE_WINDOW_STATE: _,
  // Ad block and tracking protection
  BLOCKED_RESOURCE: _,
  // SETTINGS
  SETTINGS_UPDATED: _,
  CHANGE_SETTING: _
}

module.exports = mapValuesByKeys(messages)
