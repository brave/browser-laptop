/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const settings = {
  // General tab
  STARTUP_MODE: 'general.startup-mode',
  HOMEPAGE: 'general.homepage',
  SHOW_HOME_BUTTON: 'general.show-home-button',
  USERAGENT: 'general.useragent.value',
  DEFAULT_DOWNLOAD_SAVE_PATH: 'general.downloads.default-save-path',
  AUTO_HIDE_MENU_BAR: 'general.autohide-menubar',
  // Search tab
  DEFAULT_SEARCH_ENGINE: 'search.default-search-engine',
  // Tabs tab
  SWITCH_TO_NEW_TABS: 'tabs.switch-to-new-tabs',
  PAINT_TABS: 'tabs.paint-tabs',
  TABS_PER_PAGE: 'tabs.tabs-per-page',
  SHOW_TAB_PREVIEWS: 'tabs.show-tab-previews',
  // Privacy Tab
  HISTORY_SUGGESTIONS: 'privacy.history-suggestions',
  BOOKMARK_SUGGESTIONS: 'privacy.bookmark-suggestions',
  OPENED_TAB_SUGGESTIONS: 'privacy.opened-tab-suggestions',
  AUTOCOMPLETE_HISTORY_SIZE: 'privacy.autocomplete.history-size',
  DO_NOT_TRACK: 'privacy.do-not-track',
  BLOCK_CANVAS_FINGERPRINTING: 'privacy.block-canvas-fingerprinting',
  // Security Tab
  PASSWORD_MANAGER_ENABLED: 'security.passwords.manager-enabled',
  ONE_PASSWORD_ENABLED: 'security.passwords.one-password-enabled',
  DASHLANE_ENABLED: 'security.passwords.dashlane-enabled',
  // Other settings
  SHOW_BOOKMARKS_TOOLBAR: 'bookmarks.toolbar.show',
  SHOW_BOOKMARKS_TOOLBAR_FAVICON: 'bookmarks.toolbar.showFavicon',
  LANGUAGE: 'general.language'
}

module.exports = settings

