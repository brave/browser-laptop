/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const mapValuesByKeys = require('../lib/functional').mapValuesByKeys

const _ = null

// DO NOT ADD TO THIS LIST
// If you are adding an ipc message you should probably be using an action instead
// If you think you have a really good reason for adding something please check
// with @bbondy or @bridiver first to see if there is an alternative
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
  SHORTCUT_ACTIVE_FRAME_FIND_NEXT: _,
  SHORTCUT_ACTIVE_FRAME_FIND_PREV: _,
  // Frame management shortcuts
  SHORTCUT_CLOSE_FRAME: _, /** @arg {number} opt_key of frame, defaults to active frame */
  SHORTCUT_UNDO_CLOSED_FRAME: _,
  SHORTCUT_FRAME_MUTE: _,
  SHORTCUT_FRAME_RELOAD: _, /** @arg {number} key of frame */
  SHORTCUT_NEXT_TAB: _,
  SHORTCUT_PREV_TAB: _,
  SHORTCUT_OPEN_CLEAR_BROWSING_DATA_PANEL: _,
  // Misc application events
  QUIT_APPLICATION: _,
  OPEN_BRAVERY_PANEL: _,
  PREFS_RESTART: _,
  CERT_ERROR: _, /** @arg {Object} details of certificate error */
  NOTIFICATION_RESPONSE: _, /** @arg {string} message, @arg {number} buttonId, @arg {boolean} persist */
  // Downloads
  SHOW_DOWNLOADS_TOOLBAR: _, /** Ensures the downloads toolbar is visible */
  HIDE_DOWNLOADS_TOOLBAR: _, /** Hides the downloads toolbar */
  DOWNLOAD_ACTION: _, /** @arg {string} downloadId, @arg {string} action such as 'resume', 'pause', or 'cancel' */
  // Updates
  UPDATE_REQUESTED: _,
  UPDATE_AVAILABLE: _,
  UPDATE_NOT_AVAILABLE: _,
  CHECK_FOR_UPDATE: _,
  UPDATE_META_DATA_RETRIEVED: _,
  // App state
  APP_INITIALIZED: _,
  // Web contents state
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
  GO_BACK: _,
  GO_FORWARD: _,
  RELOAD: _,
  DETACH: _,
  PASSWORD_DETAILS_UPDATED: _, /** @arg {Object} passwords app state */
  PASSWORD_SITE_DETAILS_UPDATED: _, /** @arg {Object} passwords app state */
  RECREATE_TOR_TAB: _, /** @arg {boolean} torEnabled */
  GOT_PAGE_FAVICON: _, /** @arg {string} dataUrl */
  // Init
  INITIALIZE_WINDOW: _,
  // Session restore
  REQUEST_WINDOW_STATE: _,
  RESPONSE_WINDOW_STATE: _,
  LAST_WINDOW_STATE: _,
  UNDO_CLOSED_WINDOW: _,
  CLEAR_CLOSED_FRAMES: _,
  // Ad block, safebrowsing, and tracking protection
  BLOCKED_RESOURCE: _,
  BLOCKED_PAGE: _,
  // About pages to contentScripts
  SETTINGS_UPDATED: _,
  SITE_SETTINGS_UPDATED: _,
  BRAVERY_DEFAULTS_UPDATED: _,
  BOOKMARKS_UPDATED: _,
  HISTORY_UPDATED: _,
  EXTENSIONS_UPDATED: _,
  ADBLOCK_UPDATED: _,
  DOWNLOADS_UPDATED: _,
  PRINTKEYS_UPDATED: _,
  NEWTAB_DATA_UPDATED: _,
  VERSION_INFORMATION_UPDATED: _,
  // About pages from contentScript
  DISPATCH_ACTION: _,
  ABOUT_COMPONENT_INITIALIZED: _,
  CLEAR_BROWSING_DATA_NOW: _,
  IMPORT_BROWSER_DATA_NOW: _,
  EXPORT_BOOKMARKS: _,
  IMPORTER_LIST: _,
  // Autofill
  AUTOFILL_SET_ADDRESS: _,
  AUTOFILL_SET_CREDIT_CARD: _,
  AUTOFILL_ADDRESSES_UPDATED: _,
  AUTOFILL_CREDIT_CARDS_UPDATED: _,
  // HTTPS
  CERT_ERROR_ACCEPTED: _, /** @arg {string} url where a cert error was accepted */
  CHECK_CERT_ERROR_ACCEPTED: _, /** @arg {string} url to check cert error, @arg {number} key of frame */
  GET_CERT_ERROR_DETAIL: _,
  SET_CERT_ERROR_DETAIL: _,
  SET_SECURITY_STATE: _, /** @arg {number} key of frame, @arg {Object} security state */
  HTTPSE_RULE_APPLIED: _, /** @arg {string} name of ruleset file, @arg {Object} details of rewritten request */
  // Dispatch related message
  WINDOW_RENDERER_READY: _,
  // Extensions
  NEW_POPUP_WINDOW: _,
  // Localization
  LANGUAGE: _, /** @arg {string} langCode, @arg {Array} availableLanguages */
  REQUEST_LANGUAGE: _,
  STATE_UPDATED: _,
  // Ads
  GET_AD_DIV_CANDIDATES: _,
  SET_AD_DIV_CANDIDATES: _,
  // Debugging
  DEBUG_REACT_PROFILE: _,
  // Ledger
  LEDGER_PUBLISHER: _,
  LEDGER_PUBLISHER_RESPONSE: _,
  LEDGER_UPDATED: _,
  RENDER_URL_TO_PDF: _,
  // Sync
  SYNC_UPDATED: _,
  SAVE_INIT_DATA: _,
  RELOAD_SYNC_EXTENSION: _,
  RESET_SYNC: _,
  // PDFJS
  LOAD_URL_REQUESTED: _,
  // Torrent
  TORRENT_MESSAGE: _
  // DO NOT ADD TO THIS LIST - see above
}

module.exports = mapValuesByKeys(messages)
