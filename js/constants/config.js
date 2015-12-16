/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// VAULT_HOST can be set to:
// https://vault.brave.com for production
// https://vault-staging.brave.com for a dev build
// http://localhost:3000 for production
var vaultHost = process.env.VAULT_HOST || 'https://vault-staging.brave.com'

export default {
  zoom: {
    min: 0.2,
    max: 3,
    step: 0.1,
    defaultValue: 1
  },
  maxClosedFrames: 100,
  thumbnail: {
    width: 160,
    height: 100
  },
  defaultLocale: 'en-US',
  defaultUrl: 'about:blank',
  urlBarSuggestions: {
    maxTopSites: 5,
    maxSearch: 3,
    maxSites: 2,
    maxOpenedFrames: 2
  },
  navigationBar: {
    defaultSearchSuggestions: false
  },
  defaultOpenSearchPath: './content/search/duckduckgo.xml',
  vault: {
    replacementUrl: (userId) => `${vaultHost}/v1/users/${userId}/replacement`,
    syncUrl: (userId) => `${vaultHost}/v1/users/${userId}/appState`,
    authUrl: (userId) => `${vaultHost}/v1/users/${userId}`,
    intentUrl: (userId) => `${vaultHost}/v1/users/${userId}/intents`
  },
  updates: {
    // Check for front end updates every hour
    appUpdateCheckFrequency: 1000 * 60 * 60,
    // Check after 2 minutes, near startup
    runtimeUpdateCheckDelay: 1000 * 60 * 2,
    // If true user will not be notified before updates are reloaded
    autoAppUpdate: false,
    autoRuntimeUpdate: false
  }
}
