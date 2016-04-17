/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// BRAVE_UPDATE_HOST should be set to the host name for the auto-updater server
const updateHost = process.env.BRAVE_UPDATE_HOST || 'https://brave-laptop-updates.global.ssl.fastly.net'
const winUpdateHost = process.env.BRAVE_WIN_UPDATE_HOST || 'https://brave-download.global.ssl.fastly.net'
const crashURL = process.env.BRAVE_CRASH_URL || 'https://laptop-updates.brave.com/1/crashes'

module.exports = {
  name: 'Brave',
  contactUrl: 'mailto:support@brave.com',
  resourceNames: {
    ADBLOCK: 'adblock',
    SAFE_BROWSING: 'safeBrowsing',
    HTTPS_EVERYWHERE: 'httpsEverywhere',
    TRACKING_PROTECTION: 'trackingProtection',
    AD_INSERTION: 'adInsertion',
    COOKIEBLOCK: 'cookieblock' // block 3p cookies and referer
  },
  cookieblock: {
    enabled: true
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
    version: '5.1.6', // latest stable release from https://eff.org/https-everywhere
    msBetweenRechecks: 1000 * 60 * 60 * 24, // 1 day
    enabled: true
  },
  siteHacks: {
    enabled: true
  },
  adInsertion: {
    enabled: true
  },
  crashes: {
    crashSubmitUrl: crashURL
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
    winBaseUrl: `${winUpdateHost}/multi-channel/releases/CHANNEL/winx64`
  },
  defaultSettings: {
    'general.startup-mode': 'lastTime',
    'general.homepage': 'https://www.brave.com',
    'general.useragent.value': null, // Set at runtime
    'search.default-search-engine': 'content/search/google.xml',
    'tabs.switch-to-new-tabs': false,
    'tabs.paint-tabs': true,
    'tabs.tabs-per-tab-page': 10,
    'tabs.show-tab-previews': true,
    'privacy.history-suggestions': true,
    'privacy.bookmark-suggestions': true,
    'privacy.opened-tab-suggestions': true,
    'privacy.autocomplete.history-size': 500,
    'privacy.block-canvas-fingerprinting': false,
    'bookmarks.toolbar.show': false,
    'privacy.do-not-track': false,
    'security.passwords.manager-enabled': true,
    'security.passwords.one-password-enabled': false
  }
}
