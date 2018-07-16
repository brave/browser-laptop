/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
const Immutable = require('immutable')
const {getTargetAboutUrl} = require('../lib/appUrlUtil')
const webrtcConstants = require('./webrtcConstants')

// BRAVE_UPDATE_HOST should be set to the host name for the auto-updater server
const updateHost = process.env.BRAVE_UPDATE_HOST || 'https://laptop-updates.brave.com'
const winUpdateHost = process.env.BRAVE_WIN_UPDATE_HOST || 'https://download.brave.com'
const adHost = process.env.AD_HOST || 'https://oip.brave.com'
const isTest = process.env.NODE_ENV === 'test'

const buildConfig = require('./buildConfig')
const isProduction = buildConfig.nodeEnv === 'production'
const {fullscreenOption, autoplayOption, tabPreviewTiming} = require('../../app/common/constants/settingsEnums')
const Channel = require('../../app/channel')

module.exports = {
  name: 'Brave',
  contactUrl: 'mailto:support+laptop@brave.com',
  quitTimeout: isTest ? 3 * 1000 : 10 * 1000,
  sessionSaveInterval: process.env.BRAVE_SESSION_SAVE_INTERVAL * 1000 || 1000 * 60 * 5,
  resourceNames: {
    ADBLOCK: 'adblock',
    SAFE_BROWSING: 'safeBrowsing',
    HTTPS_EVERYWHERE: 'httpsEverywhere',
    TRACKING_PROTECTION: 'trackingProtection',
    FINGERPRINTING_PROTECTION: 'fingerprintingProtection', // block 3p fingerprinting
    FINGERPRINTING_PROTECTION_ALL: 'fingerprintingProtectionAll', // block all fingerprinting
    AD_INSERTION: 'adInsertion',
    NOSCRIPT: 'noScript',
    FLASH: 'flash',
    WIDEVINE: 'widevine',
    COOKIEBLOCK: 'cookieblock', // block 3p cookies and referer
    COOKIEBLOCK_ALL: 'cookieblockAll', // block all cookies and referer
    SITEHACK: 'siteHacks',
    WEBTORRENT: 'webtorrent',
    FIREWALL: 'firewall'
    // ... other optional resource files are identified by uuid such as for regional adblock
  },
  cookieblock: {
    enabled: true
  },
  cookieblockAll: {
    enabled: false
  },
  fingerprintingProtection: {
    enabled: true
  },
  fingerprintingProtectionAll: {
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
    alternateDataFiles: 'https://adblock-data.s3.brave.com/{version}/{uuid}.dat',
    url: 'https://adblock-data.s3.brave.com/{version}/ABPFilterParserData.dat',
    // version is specified in the ad-block library
    msBetweenRechecks: 1000 * 60 * 60 * 2, // 2 hours
    enabled: true
  },
  safeBrowsing: {
    url: 'https://adblock-data.s3.brave.com/{version}/SafeBrowsingData.dat',
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
    version: '6.0',
    msBetweenRechecks: 1000 * 60 * 60 * 12, // 1/2 day
    enabled: true
  },
  siteHacks: {
    enabled: true
  },
  webtorrent: {
    enabled: true
  },
  firewall: {
    enabled: false
  },
  adInsertion: {
    enabled: false,
    url: adHost
  },
  payments: {
    delayNotificationTryPayments: 1000 * 60 * 60 * 24 * 10, // 10 days (from firstRunTimestamp)
    defaultContributionAmount: 7.5
  },
  tor: {
    partition: 'persist:tor'
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
    snsUrl: 'https://sns.us-west-2.amazonaws.com/',
    sqsUrl: 'https://sqs.us-west-2.amazonaws.com/',
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
    'general.autohide-menu': true,
    'general.wide-url-bar': false,
    'general.check-default-on-startup': Channel.channel() === 'dev',
    'general.download-default-path': '',
    'general.download-always-ask': true,
    'general.spellcheck-enabled': true,
    'general.spellcheck-languages': Immutable.fromJS(['en-US']),
    'search.default-search-engine': 'Google',
    'search.offer-search-suggestions': false, // false by default for privacy reasons
    'search.use-alternate-private-search-engine': false,
    'search.use-alternate-private-search-engine-tor': true,
    'tabs.switch-to-new-tabs': false,
    'tabs.paint-tabs': true,
    'tabs.tabs-per-page': 20,
    'tabs.close-action': 'parent',
    'tabs.show-tab-previews': true,
    'tabs.preview-timing': tabPreviewTiming.SHORT,
    'tabs.show-dashboard-images': true,
    'privacy.history-suggestions': true,
    'privacy.bookmark-suggestions': true,
    'privacy.topsite-suggestions': true,
    'privacy.opened-tab-suggestions': true,
    'privacy.autocomplete.history-size': 500,
    'bookmarks.toolbar.show': false,
    'privacy.autofill-enabled': true,
    'privacy.do-not-track': false,
    'security.passwords.active-password-manager': null, // Set in settings.js by passwordManagerDefault (defaults to built in)
    'security.passwords.enpass-enabled': false,
    'security.passwords.bitwarden-enabled': false,
    'security.fullscreen.content': fullscreenOption.ALWAYS_ASK,
    'security.autoplay.media': autoplayOption.ALWAYS_ALLOW,
    'security.flash.installed': false,
    'security.site-isolation-enabled': false,
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
    // payments
    'payments.allow-media-publishers': true,
    'payments.allow-non-verified-publishers': true,
    'payments.contribution-amount': null, // BAT
    'payments.enabled': false,
    'payments.minimum-visit-time': 8000,
    'payments.minimum-visits': 1,
    // "Add funds to your wallet" -- Limit to once every n days to reduce nagging.
    'payments.notification-add-funds-timestamp': null,
    // "Out of money, pls add" / "In 24h we'll pay publishers [Review]"
    // After shown, set timestamp to next reconcile time - 1 day.
    'payments.notification-reconcile-soon-timestamp': null,
    'payments.notification-try-payments-dismissed': false, // True if you dismiss the message or enable Payments
    'payments.notifications': true,
    'payments.sites-auto-suggest': true,
    'payments.sites-hide-excluded': false,
    'payments.sites-show-less': true,
    // advanced
    'advanced.hardware-acceleration-enabled': true,
    'advanced.default-zoom-level': null,
    'advanced.pdfjs-enabled': true,
    'advanced.torrent-viewer-enabled': true,
    'advanced.smooth-scroll-enabled': false,
    'advanced.send-crash-reports': true,
    'advanced.send-usage-statistics': false,
    'advanced.toolbar-ui-scale': 'normal',
    'advanced.swipe-nav-distance': 101,
    'advanced.payments-allow-promotions': true,
    'advanced.webrtc.policy': webrtcConstants.default,
    'shutdown.clear-history': false,
    'shutdown.clear-downloads': false,
    'shutdown.clear-cache': false,
    'shutdown.clear-all-site-cookies': false,
    'shutdown.clear-autocomplete-data': false,
    'shutdown.clear-autofill-data': false,
    'shutdown.clear-site-settings': false,
    'shutdown.clear-publishers': false,
    'extensions.pocket.enabled': false,
    'extensions.vimium.enabled': false,
    'extensions.honey.enabled': false,
    'extensions.pinterest.enabled': false,
    'extensions.metamask.enabled': false,
    'extensions.metamask.promptDismissed': false,
    'general.bookmarks-toolbar-mode': null,
    'general.is-default-browser': null,
    'notification-add-funds-timestamp': null,
    'notification-reconcile-soon-timestamp': null,
    // debug
    'debug.manual-tab-discard.enabled': false,
    'debug.verbose-tab-info.enabled': false,

    // DEPRECATED settings
    // DO NOT REMOVE OR CHANGE THESE VALUES
    // ########################
    // These values should only ever be references from ./settings.js
    // Any place using those should have a migration to convert the value
    // ########################

    // START - DEPRECATED WITH 0.11.4
    'security.passwords.manager-enabled': true,
    'security.passwords.one-password-enabled': false,
    'security.passwords.dashlane-enabled': false,
    'security.passwords.last-pass-enabled': false,
    // END - DEPRECATED WITH 0.11.4

    // START - DEPRECATED WITH 0.12.6
    'bookmarks.toolbar.showFavicon': false,
    'bookmarks.toolbar.showOnlyFavicon': false,
    // END - DEPRECATED WITH 0.12.6

    // START - DEPRECATED WITH 0.21.0
    'advanced.hide-excluded-sites': false,
    'advanced.minimum-visit-time': 8000,
    'advanced.minimum-visits': 1,
    'advanced.auto-suggest-sites': true,
    'advanced.hide-lower-sites': true
    // END - DEPRECATED WITH 0.21.0
  },
  defaultFavicon: 'img/empty_favicon.png'
}
