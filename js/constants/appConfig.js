/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
const {getTargetAboutUrl} = require('../lib/appUrlUtil')

// BRAVE_UPDATE_HOST should be set to the host name for the auto-updater server
const updateHost = process.env.BRAVE_UPDATE_HOST || 'https://brave-laptop-updates.global.ssl.fastly.net'
const winUpdateHost = process.env.BRAVE_WIN_UPDATE_HOST || 'https://brave-download.global.ssl.fastly.net'
const crashURL = process.env.BRAVE_CRASH_URL || 'https://brave-laptop-updates.herokuapp.com/1/crashes'
const adHost = process.env.AD_HOST || 'https://oip.brave.com'
const isTest = process.env.NODE_ENV === 'test'

const buildConfig = require('./buildConfig')
const isProduction = buildConfig.nodeEnv === 'production'
const {fullscreenOption, autoplayOption} = require('../../app/common/constants/settingsEnums')

module.exports = {
  name: 'Brave',
  contactUrl: 'mailto:support+laptop@brave.com',
  quitTimeout: isTest ? 3 * 1000 : 10 * 1000,
  sessionSaveInterval: 1000 * 60 * 5,
  resourceNames: {
    ADBLOCK: 'adblock',
    SAFE_BROWSING: 'safeBrowsing',
    HTTPS_EVERYWHERE: 'httpsEverywhere',
    TRACKING_PROTECTION: 'trackingProtection',
    AD_INSERTION: 'adInsertion',
    NOSCRIPT: 'noScript',
    FLASH: 'flash',
    WIDEVINE: 'widevine',
    COOKIEBLOCK: 'cookieblock', // block 3p cookies and referer
    COOKIEBLOCK_ALL: 'cookieblockAll', // block all cookies and referer
    SITEHACK: 'siteHacks',
    WEBTORRENT: 'webtorrent'
    // ... other optional resource files are identified by uuid such as for regional adblock
  },
  cookieblock: {
    enabled: true
  },
  cookieblockAll: {
    enabled: false
  },
  noScript: {
    enabled: false,
    twitterRedirectUrl: 'https://mobile.twitter.com/i/nojs_router'
  },
  flash: {
    enabled: false,
    installUrl: 'https://get.adobe.com/flashplayer/',
    url: getTargetAboutUrl('about:flash'),
    shields: false
  },
  widevine: {
    enabled: false,
    moreInfoUrl: 'https://www.eff.org/issues/drm',
    licenseUrl: 'https://www.google.com/policies/terms/',
    shields: false
  },
  adblock: {
    alternateDataFiles: 'https://s3.amazonaws.com/adblock-data/{version}/{uuid}.dat',
    url: 'https://s3.amazonaws.com/adblock-data/{version}/ABPFilterParserData.dat',
    // version is specified in the ad-block library
    msBetweenRechecks: 1000 * 60 * 60 * 2, // 2 hours
    enabled: true
  },
  safeBrowsing: {
    url: 'https://s3.amazonaws.com/adblock-data/{version}/SafeBrowsingData.dat',
    // version is specified in the ad-block library
    msBetweenRechecks: 1000 * 60 * 60 * 2, // 2 hours
    enabled: true
  },
  trackingProtection: {
    url: 'https://s3.amazonaws.com/tracking-protection-data/{version}/TrackingProtection.dat',
    version: '1',
    msBetweenRechecks: 1000 * 60 * 60 * 2, // 2 hours
    enabled: true
  },
  httpsEverywhere: {
    url: 'https://s3.amazonaws.com/https-everywhere-data/{version}/httpse.json',
    version: '5.2', // latest major point release from https://eff.org/https-everywhere
    msBetweenRechecks: 1000 * 60 * 60 * 12, // 1/2 day
    enabled: true
  },
  siteHacks: {
    enabled: true
  },
  webtorrent: {
    enabled: true
  },
  adInsertion: {
    enabled: false,
    url: adHost
  },
  crashes: {
    crashSubmitUrl: crashURL
  },
  payments: {
    delayNotificationTryPayments: 1000 * 60 * 60 * 24 * 10 // 10 days (from firstRunTimestamp)
  },
  updates: {
    // Check for front end updates every hour
    appUpdateCheckFrequency: 1000 * 60 * 60,
    // Check after 2 minutes, near startup
    runtimeUpdateCheckDelay: 1000 * 60 * 2,
    // If true user will not be notified before updates are reloaded
    autoAppUpdate: false,
    autoRuntimeUpdate: false,
    // url to check for updates
    baseUrl: `${updateHost}/1/releases`,
    winBaseUrl: `${winUpdateHost}/multi-channel/releases/CHANNEL/`
  },
  sync: {
    apiVersion: '0',
    serverUrl: isProduction ? 'https://sync.brave.com' : 'https://sync-staging.brave.com',
    debug: !isProduction,
    testS3Url: 'https://brave-sync-test.s3.dualstack.us-west-2.amazonaws.com/',
    s3Url: isProduction ? 'https://brave-sync.s3.dualstack.us-west-2.amazonaws.com' : 'https://brave-sync-staging.s3.dualstack.us-west-2.amazonaws.com',
    fetchInterval: isProduction ? (1000 * 60 * 3) : (1000 * 60),
    fetchOffset: isTest ? 0 : 30, // seconds; reduce syncUtil.now() by this amount to compensate for records pending S3 consistency. See brave/sync #139
    resendPendingRecordInterval: isProduction ? (1000 * 60 * 12) : (1000 * 60 * 4)
  },
  urlSuggestions: {
    ageDecayConstant: 50
  },
  defaultSettings: {
    'adblock.customRules': '',
    'general.language': null, // null means to use the OS lang
    'general.startup-mode': 'lastTime',
    'general.homepage': 'https://www.brave.com',
    'general.newtab-mode': 'newTabPage',
    'general.show-home-button': false,
    'general.useragent.value': null, // Set at runtime
    'general.autohide-menu': true,
    'general.wide-url-bar': false,
    'general.check-default-on-startup': true,
    'general.download-default-path': '',
    'general.download-always-ask': true,
    'search.default-search-engine': 'Google',
    'search.offer-search-suggestions': false, // false by default for privacy reasons
    'tabs.switch-to-new-tabs': false,
    'tabs.paint-tabs': true,
    'tabs.tabs-per-page': 20,
    'tabs.close-action': 'parent',
    'tabs.show-tab-previews': true,
    'tabs.show-dashboard-images': true,
    'privacy.history-suggestions': true,
    'privacy.bookmark-suggestions': true,
    'privacy.topsite-suggestions': true,
    'privacy.opened-tab-suggestions': true,
    'privacy.autocomplete.history-size': 500,
    'privacy.block-canvas-fingerprinting': false,
    'bookmarks.toolbar.show': false,
    'bookmarks.toolbar.showFavicon': false,
    'bookmarks.toolbar.showOnlyFavicon': false,
    'payments.enabled': false,
    'payments.notifications': false,
    'payments.allow-non-verified-publishers': true,
    // "Add funds to your wallet" -- Limit to once every n days to reduce nagging.
    'payments.notification-add-funds-timestamp': null,
    // "Out of money, pls add" / "In 24h we'll pay publishers [Review]"
    // After shown, set timestamp to next reconcile time - 1 day.
    'payments.notification-reconcile-soon-timestamp': null,
    'payments.notificationTryPaymentsDismissed': false, // True if you dismiss the message or enable Payments
    'payments.contribution-amount': 5, // USD
    'privacy.autofill-enabled': true,
    'privacy.do-not-track': false,
    'security.passwords.active-password-manager': null, // Set in settings.js by passwordManagerDefault (defaults to built in)
    'security.passwords.manager-enabled': true,
    'security.passwords.one-password-enabled': false,
    'security.passwords.dashlane-enabled': false,
    'security.passwords.last-pass-enabled': false,
    'security.passwords.enpass-enabled': false,
    'security.passwords.bitwarden-enabled': false,
    'security.fullscreen.content': fullscreenOption.ALWAYS_ASK,
    'security.autoplay.media': autoplayOption.ALWAYS_ALLOW,
    'security.flash.installed': false,
    'shields.blocked-count-badge': true,
    'shields.compact-bravery-panel': false,
    // sync
    'sync.enabled': false,
    'sync.device-name': 'browser-laptop',
    'sync.network.disabled': false,
    'sync.type.bookmark': true,
    'sync.type.history': false,
    'sync.type.siteSetting': true,
    'general.downloads.default-save-path': null,
    // Windows has issues with titlebar mode because it doesn't fire onMouseEnter events if you enter
    // your mouse from the top of the window.  Also users with Surface tablets or Surface books that
    // have immersive mode w/ touch makes it too hard to enter a URL.
    // Tracking issue for that and to re-enable title mode on Windows is at #9900.
    'general.disable-title-mode': process.platform === 'linux' || process.platform === 'win32',
    'advanced.hardware-acceleration-enabled': true,
    'advanced.default-zoom-level': null,
    'advanced.pdfjs-enabled': true,
    'advanced.torrent-viewer-enabled': true,
    'advanced.smooth-scroll-enabled': false,
    'advanced.send-crash-reports': true,
    'advanced.send-usage-statistics': false,
    'advanced.update-to-preview-releases': false,
    'advanced.hide-excluded-sites': false,
    'advanced.minimum-visit-time': 8000,
    'advanced.minimum-visits': 1,
    'advanced.auto-suggest-sites': true,
    'advanced.hide-lower-sites': true,
    'advanced.toolbar-ui-scale': 'normal',
    'advanced.swipe-nav-distance': 101,
    'shutdown.clear-history': false,
    'shutdown.clear-downloads': false,
    'shutdown.clear-cache': false,
    'shutdown.clear-all-site-cookies': false,
    'shutdown.clear-autocomplete-data': false,
    'shutdown.clear-autofill-data': false,
    'shutdown.clear-site-settings': false,
    'extensions.pocket.enabled': false,
    'extensions.vimium.enabled': false,
    'extensions.honey.enabled': false,
    'extensions.pinterest.enabled': false,
    'extensions.metamask.enabled': false,
    'general.bookmarks-toolbar-mode': null,
    'general.is-default-browser': null,
    'notification-add-funds-timestamp': null,
    'notification-reconcile-soon-timestamp': null
  },
  defaultFavicon: 'img/empty_favicon.png'
}
