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
  AUTO_HIDE_MENU: 'general.autohide-menu',
  DISABLE_TITLE_MODE: 'general.disable-title-mode',
  // Search tab
  DEFAULT_SEARCH_ENGINE: 'search.default-search-engine',
  OFFER_SEARCH_SUGGESTIONS: 'search.offer-search-suggestions',
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
  LAST_PASS_ENABLED: 'security.passwords.last-pass-enabled',
  DASHLANE_ENABLED: 'security.passwords.dashlane-enabled',
  // Other settings
  SHOW_BOOKMARKS_TOOLBAR: 'bookmarks.toolbar.show',
  SHOW_BOOKMARKS_TOOLBAR_FAVICON: 'bookmarks.toolbar.showFavicon',
  SHOW_BOOKMARKS_TOOLBAR_ONLY_FAVICON: 'bookmarks.toolbar.showOnlyFavicon',
  LANGUAGE: 'general.language',
  // Advanced settings
  HARDWARE_ACCELERATION_ENABLED: 'advanced.hardware-acceleration-enabled',
  DEFAULT_ZOOM_LEVEL: 'advanced.default-zoom-level'
}

module.exports = settings
