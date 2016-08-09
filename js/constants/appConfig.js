/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
const { getTargetAboutUrl } = require('../lib/appUrlUtil')

// BRAVE_UPDATE_HOST should be set to the host name for the auto-updater server
const updateHost = process.env.BRAVE_UPDATE_HOST || 'https://brave-laptop-updates.global.ssl.fastly.net'
const winUpdateHost = process.env.BRAVE_WIN_UPDATE_HOST || 'https://brave-download.global.ssl.fastly.net'
const crashURL = process.env.BRAVE_CRASH_URL || 'https://brave-laptop-updates.herokuapp.com/1/crashes'

module.exports = {
  name: 'Brave',
  contactUrl: 'mailto:support+laptop@brave.com',
  quitTimeout: 10 * 1000,
  resourceNames: {
    ADBLOCK: 'adblock',
    SAFE_BROWSING: 'safeBrowsing',
    HTTPS_EVERYWHERE: 'httpsEverywhere',
    TRACKING_PROTECTION: 'trackingProtection',
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
    'shutdown.clear-all-site-cookies': false
  },
  defaultFavicon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA0xpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTExIDc5LjE1ODMyNSwgMjAxNS8wOS8xMC0wMToxMDoyMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MUNFNTM2NTcxQzQyMTFFNjhEODk5OTY1MzJCOUU0QjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MUNFNTM2NTYxQzQyMTFFNjhEODk5OTY1MzJCOUU0QjEiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjUxZDUzZDBmLTYzOWMtMTE3OS04Yjk3LTg3Y2M5YTUyOWRmMSIgc3RSZWY6ZG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjUxZDUzZDBmLTYzOWMtMTE3OS04Yjk3LTg3Y2M5YTUyOWRmMSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PmF3+n4AAAAoSURBVHja7M1BAQAABAQw9O98SvDbCqyT1KepZwKBQCAQCAQ3VoABAAu6Ay00hnjWAAAAAElFTkSuQmCC',
  uaExceptionHosts: [
    'get.adobe.com', 'adobe.com', 'www.adobe.com', 'helpx.adobe.com'
  ] // hosts to send true UA to
}
