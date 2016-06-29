/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// VAULT_HOST can be set to:
// https://vault.brave.com for production
// https://vault-staging.brave.com for a dev build
// http://localhost:3000 for production
const vaultHost = process.env.VAULT_HOST || 'https://vault-staging.brave.com'
const adHost = process.env.AD_HOST || 'https://oip.brave.com'

module.exports = {
  zoom: {
    defaultValue: 0,
    // Each zoomLevel is multiplied by 20 to get the percentage offset from 100. That's 0.05 per percentage offset.
    zoomLevels: [-3.75, -3.35, -2.5, -1.65, -1.25, -0.5, -0.25, 0, 0.25, 0.5, 1.25, 2.5, 3.75, 5, 7.5, 10, 15, 20]
  },
  maxClosedFrames: 100,
  thumbnail: {
    width: 160,
    height: 100
  },
  defaultLocale: 'en-US',
  defaultUrl: 'about:newtab',
  urlBarSuggestions: {
    maxOpenedFrames: 2,
    maxBookmarkSites: 2,
    maxHistorySites: 2,
    maxAboutPages: 2,
    maxSearch: 3,
    maxTopSites: 5
  },
  navigationBar: {
    defaultSearchSuggestions: false
  },
  defaultOpenSearchPath: 'content/search/google.xml',
  vault: {
    syncUrl: (userId) => `${vaultHost}/v1/users/${userId}/appState`,
    authUrl: (userId) => `${vaultHost}/v1/users/${userId}`,
    replacementUrl: adHost
  },
  braveExtensionId: 'mnojpmjdmbbfmejpflffifhffcmidifd'
}
