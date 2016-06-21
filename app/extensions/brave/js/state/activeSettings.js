/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const braveryDefaults = (appState, appConfig) => {
  let defaults = {}
  Object.keys(appConfig.resourceNames).forEach((name) => {
    let value = appConfig.resourceNames[name]
    let enabled = appState.getIn([value, 'enabled'])
    defaults[value] = enabled === undefined ? appConfig[value].enabled : enabled
  })
  let replaceAds = defaults[appConfig.resourceNames.AD_INSERTION] || false
  let blockAds = defaults[appConfig.resourceNames.ADBLOCK] || false
  let blockTracking = defaults[appConfig.resourceNames.TRACKING_PROTECTION] || false
  let blockCookies = defaults[appConfig.resourceNames.COOKIEBLOCK] || false
  defaults.adControl = 'allowAdsAndTracking'
  if (blockAds && replaceAds && blockTracking) {
   defaults.adControl = 'showBraveAds'
  } else if (blockAds && !replaceAds && blockTracking) {
   defaults.adControl = 'blockAds'
  }
  defaults.cookieControl = blockCookies ? 'block3rdPartyCookie' : 'allowAllCookies'

  // TODO(bridiver) this should work just like the other bravery settings
  let fingerprintingProtection = appState.get('settings').get('privacy.block-canvas-fingerprinting')
  if (typeof fingerprintingProtection !== 'boolean') {
    fingerprintingProtection = appConfig.defaultSettings['privacy.block-canvas-fingerprinting']
  }
  defaults.fingerprintingProtection = fingerprintingProtection
  return defaults
}

const activeSettings = (siteSettings, appState, appConfig) => {
  let appSettings = appState.get('settings')
  let defaults = braveryDefaults(appState, appConfig)
  let settings = {}

  settings.locale = appState.getIn(['dictionary', 'locale'])

  settings.shieldsUp = (() => {
    if (siteSettings) {
      if (typeof siteSettings.get('shieldsUp') === 'boolean') {
        return siteSettings.get('shieldsUp')
      }
    }

    return true
  })()

  Object.keys(appConfig.resourceNames).forEach((resourceName) => {
    let name = appConfig.resourceNames[resourceName]
    settings[name] = (() => {
      if (settings.shieldsUp === false) {
        return false
      }

      if (siteSettings) {
        if (typeof siteSettings.get(name) === 'boolean') {
          return siteSettings.get(name)
        }
      }

      return defaults[name]
    })()
  })

  settings.adControl = (() => {
      if (settings.shieldsUp === false) {
        return 'allowAdsAndTracking'
      }
      if (siteSettings) {
        if (typeof siteSettings.get('adControl') === 'string') {
          return siteSettings.get('adControl')
        }
      }

      return defaults.adControl
    })()

  settings.cookieControl = (() => {
      if (settings.shieldsUp === false) {
        return 'allowAllCookies'
      }
      if (siteSettings) {
        if (typeof siteSettings.get('cookieControl') === 'string') {
          return siteSettings.get('cookieControl')
        }
      }

      return defaults.cookieControl
    })()

  settings.fingerprintingProtection = (() => {
      if (settings.shieldsUp === false) {
        return false
      }
      if (siteSettings) {
        if (typeof siteSettings.get('fingerprintingProtection') === 'boolean') {
          return siteSettings.get('fingerprintingProtection')
        }
      }

      return defaults.fingerprintingProtection
    })()

  settings.passwordManager = (() => {
      if (appSettings) {
        if (typeof appSettings.get('security.passwords.manager-enabled') === 'boolean') {
          return appSettings.get('security.passwords.manager-enabled')
        }
      }

      return appConfig.defaultSettings['security.passwords.manager-enabled']
    })()

  settings.adInsertion = {
    enabled: settings.adControl === 'showBraveAds',
    url: appConfig.adInsertion.url
  }

  return Object.assign(defaults, settings)
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports.activeSettings = activeSettings;
  module.exports.braveryDefaults = braveryDefaults;
}

