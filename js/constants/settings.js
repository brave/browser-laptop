/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const settings = {
  // General tab
  STARTUP_MODE: 'general.startup-mode',
  HOMEPAGE: 'general.homepage',
  NEWTAB_MODE: 'general.newtab-mode',
  SHOW_HOME_BUTTON: 'general.show-home-button',
  AUTO_HIDE_MENU: 'general.autohide-menu',
  DISABLE_TITLE_MODE: 'general.disable-title-mode',
  WIDE_URL_BAR: 'general.wide-url-bar',
  BOOKMARKS_TOOLBAR_MODE: 'general.bookmarks-toolbar-mode',
  SHOW_BOOKMARKS_TOOLBAR: 'bookmarks.toolbar.show',
  LANGUAGE: 'general.language',
  CHECK_DEFAULT_ON_STARTUP: 'general.check-default-on-startup',
  IS_DEFAULT_BROWSER: 'general.is-default-browser',
  DOWNLOAD_DEFAULT_PATH: 'general.download-default-path',
  DOWNLOAD_ALWAYS_ASK: 'general.download-always-ask',
  SPELLCHECK_ENABLED: 'general.spellcheck-enabled',
  SPELLCHECK_LANGUAGES: 'general.spellcheck-languages',
  // Search tab
  DEFAULT_SEARCH_ENGINE: 'search.default-search-engine',
  USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE: 'search.use-alternate-private-search-engine',
  USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE_TOR: 'search.use-alternate-private-search-engine-tor',
  OFFER_SEARCH_SUGGESTIONS: 'search.offer-search-suggestions',
  // Tabs tab
  SWITCH_TO_NEW_TABS: 'tabs.switch-to-new-tabs',
  TAB_CLOSE_ACTION: 'tabs.close-action',
  PAINT_TABS: 'tabs.paint-tabs',
  TABS_PER_PAGE: 'tabs.tabs-per-page',
  SHOW_TAB_PREVIEWS: 'tabs.show-tab-previews',
  TAB_PREVIEW_TIMING: 'tabs.preview-timing',
  SHOW_DASHBOARD_IMAGES: 'tabs.show-dashboard-images',
  // Privacy Tab
  HISTORY_SUGGESTIONS: 'privacy.history-suggestions',
  BOOKMARK_SUGGESTIONS: 'privacy.bookmark-suggestions',
  TOPSITE_SUGGESTIONS: 'privacy.topsite-suggestions',
  OPENED_TAB_SUGGESTIONS: 'privacy.opened-tab-suggestions',
  AUTOCOMPLETE_HISTORY_SIZE: 'privacy.autocomplete.history-size',
  DO_NOT_TRACK: 'privacy.do-not-track',
  // Security Tab
  ACTIVE_PASSWORD_MANAGER: 'security.passwords.active-password-manager',
  SHUTDOWN_CLEAR_HISTORY: 'shutdown.clear-history',
  SHUTDOWN_CLEAR_DOWNLOADS: 'shutdown.clear-downloads',
  SHUTDOWN_CLEAR_CACHE: 'shutdown.clear-cache',
  SHUTDOWN_CLEAR_ALL_SITE_COOKIES: 'shutdown.clear-all-site-cookies',
  SHUTDOWN_CLEAR_AUTOCOMPLETE_DATA: 'shutdown.clear-autocomplete-data',
  SHUTDOWN_CLEAR_AUTOFILL_DATA: 'shutdown.clear-autofill-data',
  SHUTDOWN_CLEAR_SITE_SETTINGS: 'shutdown.clear-site-settings',
  SHUTDOWN_CLEAR_PUBLISHERS: 'shutdown.clear-publishers',
  FLASH_INSTALLED: 'security.flash.installed',
  FULLSCREEN_CONTENT: 'security.fullscreen.content',
  AUTOPLAY_MEDIA: 'security.autoplay.media',
  SITE_ISOLATION_ENABLED: 'security.site-isolation-enabled',
  // Autofill
  AUTOFILL_ENABLED: 'privacy.autofill-enabled',
  // Payments Tab
  PAYMENTS_ALLOW_MEDIA_PUBLISHERS: 'payments.allow-media-publishers',
  PAYMENTS_ALLOW_NON_VERIFIED: 'payments.allow-non-verified-publishers',
  PAYMENTS_CONTRIBUTION_AMOUNT: 'payments.contribution-amount',
  PAYMENTS_ENABLED: 'payments.enabled',
  PAYMENTS_MINIMUM_VISIT_TIME: 'payments.minimum-visit-time',
  PAYMENTS_MINIMUM_VISITS: 'payments.minimum-visits',
  PAYMENTS_NOTIFICATION_ADD_FUNDS_TIMESTAMP: 'notification-add-funds-timestamp',
  PAYMENTS_NOTIFICATION_RECONCILE_SOON_TIMESTAMP: 'notification-reconcile-soon-timestamp',
  PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED: 'payments.notification-try-payments-dismissed',
  PAYMENTS_NOTIFICATIONS: 'payments.notifications',
  PAYMENTS_SITES_AUTO_SUGGEST: 'payments.sites-auto-suggest',
  PAYMENTS_SITES_HIDE_EXCLUDED: 'payments.sites-hide-excluded',
  PAYMENTS_SITES_SHOW_LESS: 'payments.sites-show-less',
  // Shields Tab
  BLOCKED_COUNT_BADGE: 'shields.blocked-count-badge',
  COMPACT_BRAVERY_PANEL: 'shields.compact-bravery-panel',
  // Advanced settings
  HARDWARE_ACCELERATION_ENABLED: 'advanced.hardware-acceleration-enabled',
  PDFJS_ENABLED: 'advanced.pdfjs-enabled',
  TORRENT_VIEWER_ENABLED: 'advanced.torrent-viewer-enabled',
  DEFAULT_ZOOM_LEVEL: 'advanced.default-zoom-level',
  SMOOTH_SCROLL_ENABLED: 'advanced.smooth-scroll-enabled',
  SEND_CRASH_REPORTS: 'advanced.send-crash-reports',
  SEND_USAGE_STATISTICS: 'advanced.send-usage-statistics',
  ADBLOCK_CUSTOM_RULES: 'adblock.customRules',
  TOOLBAR_UI_SCALE: 'advanced.toolbar-ui-scale',
  SWIPE_NAV_DISTANCE: 'advanced.swipe-nav-distance',
  PAYMENTS_ALLOW_PROMOTIONS: 'advanced.payments-allow-promotions',
  WEBRTC_POLICY: 'advanced.webrtc.policy',
  // Sync settings
  SYNC_ENABLED: 'sync.enabled',
  SYNC_DEVICE_NAME: 'sync.device-name',
  SYNC_TYPE_BOOKMARK: 'sync.type.bookmark',
  SYNC_TYPE_HISTORY: 'sync.type.history',
  SYNC_TYPE_SITE_SETTING: 'sync.type.siteSetting',
  SYNC_NETWORK_DISABLED: 'sync.network.disabled', // disable network connection to sync server. only used in testing.
  // Extension settings
  POCKET_ENABLED: 'extensions.pocket.enabled',
  VIMIUM_ENABLED: 'extensions.vimium.enabled',
  HONEY_ENABLED: 'extensions.honey.enabled',
  PINTEREST_ENABLED: 'extensions.pinterest.enabled',
  METAMASK_ENABLED: 'extensions.metamask.enabled',
  METAMASK_PROMPT_DISMISSED: 'extensions.metamask.promptDismissed',
  // Debug settings
  DEBUG_ALLOW_MANUAL_TAB_DISCARD: 'debug.manual-tab-discard.enabled',
  DEBUG_VERBOSE_TAB_INFO: 'debug.verbose-tab-info.enabled',

  // DEPRECATED settings
  // DO NOT REMOVE OR CHANGE THESE VALUES
  // ########################
  // these constants should not appear outside of this file, ../settings.js, and our tests
  // NOTE: these settings rely on default values being set in ./appConfig.js
  // ########################

  // START - DEPRECATED WITH 0.11.4
  PASSWORD_MANAGER_ENABLED: 'security.passwords.manager-enabled',
  ONE_PASSWORD_ENABLED: 'security.passwords.one-password-enabled',
  DASHLANE_ENABLED: 'security.passwords.dashlane-enabled',
  LAST_PASS_ENABLED: 'security.passwords.last-pass-enabled',
  // END - DEPRECATED WITH 0.11.4

  // START - DEPRECATED WITH 0.12.6
  SHOW_BOOKMARKS_TOOLBAR_FAVICON: 'bookmarks.toolbar.showFavicon',
  SHOW_BOOKMARKS_TOOLBAR_ONLY_FAVICON: 'bookmarks.toolbar.showOnlyFavicon',
  // END - DEPRECATED WITH 0.12.6

  // START - DEPRECATED WITH 0.19
  HIDE_EXCLUDED_SITES: 'advanced.hide-excluded-sites',
  HIDE_LOWER_SITES: 'advanced.hide-lower-sites',
  MINIMUM_VISIT_TIME: 'advanced.minimum-visit-time',
  MINIMUM_VISITS: 'advanced.minimum-visits',
  AUTO_SUGGEST_SITES: 'advanced.auto-suggest-sites'
  // END - DEPRECATED WITH 0.19
}

module.exports = settings
