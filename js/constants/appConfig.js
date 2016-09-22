/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
const { getTargetAboutUrl } = require('../lib/appUrlUtil')

// BRAVE_UPDATE_HOST should be set to the host name for the auto-updater server
const updateHost = process.env.BRAVE_UPDATE_HOST || 'https://brave-laptop-updates.global.ssl.fastly.net'
const winUpdateHost = process.env.BRAVE_WIN_UPDATE_HOST || 'https://brave-download.global.ssl.fastly.net'
const crashURL = process.env.BRAVE_CRASH_URL || 'https://brave-laptop-updates.herokuapp.com/1/crashes'
const adHost = process.env.AD_HOST || 'https://oip.brave.com'

module.exports = {
  name: 'Brave',
  contactUrl: 'mailto:support+laptop@brave.com',
  quitTimeout: 10 * 1000,
  resourceNames: {
    ADBLOCK: 'adblock',
    SAFE_BROWSING: 'safeBrowsing',
    HTTPS_EVERYWHERE: 'httpsEverywhere',
    TRACKING_PROTECTION: 'trackingProtection',
    AD_INSERTION: 'adInsertion',
    NOSCRIPT: 'noScript',
    FLASH: 'flash',
    COOKIEBLOCK: 'cookieblock' // block 3p cookies and referer
  },
  cookieblock: {
    enabled: true
  },
  noScript: {
    enabled: false
  },
  flash: {
    enabled: false,
    installUrl: 'https://get.adobe.com/flashplayer/',
    url: getTargetAboutUrl('about:flash')
  },
  adblock: {
    url: 'https://s3.amazonaws.com/adblock-data/{version}/ABPFilterParserData.dat',
    version: '1',
    msBetweenRechecks: 1000 * 60 * 60 * 24, // 1 day
    enabled: true
  },
  safeBrowsing: {
    url: 'https://s3.amazonaws.com/safe-browsing-data/{version}/SafeBrowsingData.dat',
    version: '1',
    msBetweenRechecks: 1000 * 60 * 60 * 24, // 1 day
    enabled: true
  },
  trackingProtection: {
    url: 'https://s3.amazonaws.com/tracking-protection-data/{version}/TrackingProtection.dat',
    version: '1',
    msBetweenRechecks: 1000 * 60 * 60 * 24, // 1 day
    enabled: true
  },
  httpsEverywhere: {
    url: 'https://s3.amazonaws.com/https-everywhere-data/{version}/httpse.json',
    version: '5.2', // latest major point release from https://eff.org/https-everywhere
    msBetweenRechecks: 1000 * 60 * 60 * 24, // 1 day
    enabled: true
  },
  siteHacks: {
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
  defaultSettings: {
    'general.language': null, // null means to use the OS lang
    'general.startup-mode': 'lastTime',
    'general.homepage': 'https://www.brave.com',
    'general.show-home-button': false,
    'general.useragent.value': null, // Set at runtime
    'general.autohide-menu': true,
    'search.default-search-engine': 'Google',
    'search.offer-search-suggestions': false, // false by default for privacy reasons
    'tabs.switch-to-new-tabs': false,
    'tabs.paint-tabs': true,
    'tabs.tabs-per-page': 10,
    'tabs.show-tab-previews': true,
    'privacy.history-suggestions': true,
    'privacy.bookmark-suggestions': true,
    'privacy.opened-tab-suggestions': true,
    'privacy.autocomplete.history-size': 500,
    'privacy.block-canvas-fingerprinting': false,
    'bookmarks.toolbar.show': false,
    'bookmarks.toolbar.showFavicon': false,
    'bookmarks.toolbar.showOnlyFavicon': false,
    'payments.enabled': false,
    'payments.notifications': false,
    'payments.notificationTryPaymentsDismissed': false, // True if you dismiss the message or enable Payments
    'payments.contribution-amount': 5, // USD
    'privacy.autofill-enabled': true,
    'privacy.do-not-track': false,
    'security.passwords.active-password-manager': null, // Set in settings.js by passwordManagerDefault (defaults to built in)
    'security.passwords.manager-enabled': true,
    'security.passwords.one-password-enabled': false,
    'security.passwords.dashlane-enabled': false,
    'security.passwords.last-pass-enabled': false,
    'general.downloads.default-save-path': null,
    'general.disable-title-mode': process.platform === 'win32',
    'advanced.hardware-acceleration-enabled': true,
    'advanced.default-zoom-level': null,
    'advanced.pdfjs-enabled': true,
    'advanced.smooth-scroll-enabled': false,
    'shutdown.clear-history': false,
    'shutdown.clear-downloads': false,
    'shutdown.clear-cache': false,
    'shutdown.clear-all-site-cookies': false,
    'shutdown.clear-autocomplete-data': false,
    'shutdown.clear-autofill-data': false
  },
  defaultFavicon: 'img/empty_favicon.png',
  uaExceptionHosts: [
    'get.adobe.com', 'adobe.com', 'www.adobe.com', 'helpx.adobe.com'
  ] // hosts to send true UA to
}
