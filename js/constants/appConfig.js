/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// UPDATE_HOST should be set to the host name for the auto-updater server
const updateHost = process.env.UPDATE_HOST || 'https://brave-laptop-updates.global.ssl.fastly.net'
const winUpdateHost = process.env.WIN_UPDATE_HOST || 'https://brave-download.global.ssl.fastly.net'
const crashURL = process.env.CRASH_URL || 'https://laptop-updates.brave.com/1/crashes'

module.exports = {
  name: 'Brave',
  contactUrl: 'mailto:support@brave.com',
  resourceNames: {
    ADBLOCK: 'adblock',
    HTTPS_EVERYWHERE: 'httpsEverywhere',
    TRACKING_PROTECTION: 'trackingProtection',
    AD_INSERTION: 'adInsertion'
  },
  adblock: {
    url: 'https://s3.amazonaws.com/adblock-data/{version}/ABPFilterParserData.dat',
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
    url: 'https://s3.amazonaws.com/https-everywhere-data/{version}/rulesets.sqlite',
    targetsUrl: 'https://s3.amazonaws.com/https-everywhere-data/{version}/httpse-targets.json',
    version: '5.1.2', // latest stable release from https://eff.org/https-everywhere
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
    winBaseUrl: `${winUpdateHost}/releases/winx64`
  },
  defaultSettings: {
    'startup-mode': 'lastTime',
    homepage: 'http://www.brave.com',
    'default-search-engine': './content/search/google.xml',
    'switch-to-new-tabs': false,
    'history-suggestions': true,
    'bookmark-suggestions': true,
    'opened-tab-suggestions': true,
    'block-reported-sites': true,
    'paint-tabs': true
  }
}
