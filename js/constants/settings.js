/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const settings = {
  // General tab
  STARTUP_MODE: 'general.startup-mode',
  HOMEPAGE: 'general.homepage',
  NEWTAB_MODE: 'general.newtab-mode',
  SHOW_HOME_BUTTON: 'general.show-home-button',
  DEFAULT_DOWNLOAD_SAVE_PATH: 'general.downloads.default-save-path',
  AUTO_HIDE_MENU: 'general.autohide-menu',
  DISABLE_TITLE_MODE: 'general.disable-title-mode',
  BOOKMARKS_TOOLBAR_MODE: 'general.bookmarks-toolbar-mode',
  SHOW_BOOKMARKS_TOOLBAR: 'bookmarks.toolbar.show',
  LANGUAGE: 'general.language',
  CHECK_DEFAULT_ON_STARTUP: 'general.check-default-on-startup',
  IS_DEFAULT_BROWSER: 'general.is-default-browser',
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
  ACTIVE_PASSWORD_MANAGER: 'security.passwords.active-password-manager',
  SHUTDOWN_CLEAR_HISTORY: 'shutdown.clear-history',
  SHUTDOWN_CLEAR_DOWNLOADS: 'shutdown.clear-downloads',
  SHUTDOWN_CLEAR_CACHE: 'shutdown.clear-cache',
  SHUTDOWN_CLEAR_ALL_SITE_COOKIES: 'shutdown.clear-all-site-cookies',
  SHUTDOWN_CLEAR_AUTOCOMPLETE_DATA: 'shutdown.clear-autocomplete-data',
  SHUTDOWN_CLEAR_AUTOFILL_DATA: 'shutdown.clear-autofill-data',
  SHUTDOWN_CLEAR_SITE_SETTINGS: 'shutdown.clear-site-settings',
  FLASH_INSTALLED: 'security.flash.installed',
  // Autofill
  AUTOFILL_ENABLED: 'privacy.autofill-enabled',
  // Payments Tab
  PAYMENTS_ENABLED: 'payments.enabled',
  PAYMENTS_NOTIFICATIONS: 'payments.notifications',
  PAYMENTS_NOTIFICATION_ADD_FUNDS_TIMESTAMP: 'notification-add-funds-timestamp',
  PAYMENTS_NOTIFICATION_RECONCILE_SOON_TIMESTAMP: 'notification-reconcile-soon-timestamp',
  PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED: 'payments.notificationTryPaymentsDismissed',
  PAYMENTS_CONTRIBUTION_AMOUNT: 'payments.contribution-amount',
  // Advanced settings
  HARDWARE_ACCELERATION_ENABLED: 'advanced.hardware-acceleration-enabled',
  PDFJS_ENABLED: 'advanced.pdfjs-enabled',
  TORRENT_VIEWER_ENABLED: 'advanced.torrent-viewer-enabled',
  DEFAULT_ZOOM_LEVEL: 'advanced.default-zoom-level',
  SMOOTH_SCROLL_ENABLED: 'advanced.smooth-scroll-enabled',
  SEND_CRASH_REPORTS: 'advanced.send-crash-reports',
  SEND_USAGE_STATISTICS: 'advanced.send-usage-statistics',
  ADBLOCK_CUSTOM_RULES: 'adblock.customRules',
  HIDE_EXCLUDED_SITES: 'advanced.hide-excluded-sites',
  MINIMUM_VISIT_TIME: 'advanced.minimum-visit-time',
  MINIMUM_VISITS: 'advanced.minimum-visits',
  MINIMUM_PERCENTAGE: 'advanced.minimum-percentage',

  // DEPRECATED settings
  // ########################
  // these constants should not appear outside of this file, ../settings.js, and our tests
  // NOTE: these settings rely on default values being set in ./appConfig.js
  // ########################
  // > phased out with 0.11.4
  PASSWORD_MANAGER_ENABLED: 'security.passwords.manager-enabled',
  ONE_PASSWORD_ENABLED: 'security.passwords.one-password-enabled',
  DASHLANE_ENABLED: 'security.passwords.dashlane-enabled',
  LAST_PASS_ENABLED: 'security.passwords.last-pass-enabled',
  // > phased out with 0.12.6
  SHOW_BOOKMARKS_TOOLBAR_FAVICON: 'bookmarks.toolbar.showFavicon',
  SHOW_BOOKMARKS_TOOLBAR_ONLY_FAVICON: 'bookmarks.toolbar.showOnlyFavicon',
  POCKET_ENABLED: 'extensions.pocket.enabled'
}

module.exports = settings
