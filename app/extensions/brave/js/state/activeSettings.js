/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const activeSettings = (siteSettings, appState, appConfig) => {
  let settings = appState.get('settings')

  let noScript = (() => {
    if (siteSettings) {
      if (siteSettings.get('shieldsUp') === false) {
        return false
      }

      if (typeof siteSettings.get('noScript') === 'boolean') {
        return siteSettings.get('noScript')
      }
    }

    return appConfig.noScript.enabled
  })()

  let adInsertion = (() => {
      if (siteSettings) {
        if (siteSettings.get('shieldsUp') === false) {
          return false
        }

        if (typeof siteSettings.get('adControl') === 'string') {
          if (['blockAds', 'allowAdsAndTracking'].includes(siteSettings.get('adControl'))) {
            return false
          } else {
            return true
          }
        }
      }

      return appConfig.adInsertion.enabled
    })()

  let passwordManager = (() => {
      if (settings) {
        if (typeof settings.get('security.passwords.manager-enabled') === 'boolean') {
          return settings.get('security.passwords.manager-enabled')
        }
      }

      return appConfig.defaultSettings['security.passwords.manager-enabled']
    })()

  let fingerprintingProtection = (() => {
      if (siteSettings) {
        if (siteSettings.get('shieldsUp') === false) {
          return false
        }

        if (typeof siteSettings.get('fingerprintingProtection') === 'boolean') {
          return siteSettings.get('fingerprintingProtection')
        }
      }

      return appConfig.defaultSettings['privacy.block-canvas-fingerprinting']
    })()

  let block3rdPartyStorage = (() => {
      if (siteSettings) {
        if (siteSettings.get('shieldsUp') === false) {
          return false
        }

        if (typeof siteSettings.get('cookieControl') === 'string') {
          return siteSettings.get('cookieControl') === 'block3rdPartyCookie'
        }
      }

      let enabled = appState.getIn(['cookieblock', 'enabled'])
      if (typeof enabled !== 'boolean') {
        enabled = appConfig.cookieblock.enabled
      }

      return enabled
    })()

  return {
    adInsertion: {
      enabled: adInsertion,
      url: appConfig.adInsertion.url
    },
    passwordManager,
    fingerprintingProtection,
    block3rdPartyStorage,
    noScript,
    locale: appState.getIn(['dictionary', 'locale'])
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports.activeSettings = activeSettings;
}

