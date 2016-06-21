/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const urlParse = require('url').parse

module.exports.braveryDefaults = (appState, appConfig) => {
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

module.exports.activeSettings = (siteSettings, appState, appConfig) => {
  let defaults = module.exports.braveryDefaults(appState, appConfig)
  let settings = {}

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

  settings.adInsertion = {
    enabled: settings.adControl === 'showBraveAds',
    url: appConfig.adInsertion.url
  }

  return Object.assign(defaults, settings)
}

/**
  * Obtains a squashed settings object of all matching host patterns with more exact matches taking precedence
  * @param {Object} siteSettings - The top level app state site settings indexed by hostPattern.
  * @param {string} location - The current page location to get settings for.
  * @return {Object} A merged settings object for the specified site setting or undefined
  */
module.exports.getSiteSettingsForURL = (siteSettings, location) => {
  if (!location || !siteSettings) {
    return undefined
  }
  // Example: https://www.brianbondy.com:8080/projects
  //   parsedUrl.host: www.brianbondy.com:8080
  //   parsedUrl.hostname: www.brianbondy.com
  //   parsedUrl.protocol: https:

  // Stores all related settingObjs with the most specific ones first
  // They will be reduced to a single setting object.
  let settingObjs = []

  const parsedUrl = urlParse(location)
  if (!parsedUrl.host || !parsedUrl.hostname || !parsedUrl.protocol) {
    return undefined
  }

  settingObjs.push(
    `${parsedUrl.protocol}//${parsedUrl.host}`,
    `${parsedUrl.protocol}//${parsedUrl.hostname}:*`,
    `${parsedUrl.protocol}//*`
  )
  if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
    settingObjs.push(`https?://${parsedUrl.host}`,
      `https?://${parsedUrl.hostname}:*`)
  }

  let host = parsedUrl.host
  while (host.length > 0) {
    const parsedUrl = urlParse(location)
    host = host.split('.').slice(1).join('.')
    location = `${parsedUrl.protocol}//${host}`
    settingObjs.push(
      `${parsedUrl.protocol}//*.${parsedUrl.host}`,
      `${parsedUrl.protocol}//*.${parsedUrl.hostname}:*`
    )
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      settingObjs.push(`https?://*.${parsedUrl.host}`,
        `https?://*.${parsedUrl.hostname}:*`)
    }
  }
  settingObjs.push('*')
  settingObjs = settingObjs.map((hostPattern) => siteSettings.get(hostPattern))

  // Merge all the settingObj with the more specific first rules taking precedence
  const settingObj = settingObjs.reduce((mergedSettingObj, settingObj) =>
    (settingObj || Immutable.Map()).merge(mergedSettingObj), Immutable.Map())
  if (settingObj.size === 0) {
    return undefined
  }
  return Immutable.fromJS(settingObj)
}

/**
  * Obtains the site settings stored for a specific pattern.
  * @param {Object} siteSettings - The top level app state site settings indexed by hostPattern.
  * @param {string} hostPattern - The host pattern to lookup.
  *   Supported hostPattern values are of the form: protocol|(https[?])://[*.]<hostname>[:*]
  * @return {Object} The exact setting object for the specified host pattern or undefined.
  */
module.exports.getSiteSettingsForHostPattern = (siteSettings, hostPattern) =>
  siteSettings.get(hostPattern)

/**
  * Merges the settings for the specified host pattern.
  * @param {Object} siteSettings - The top level app state site settings indexed by hostPattern.
  * @param {string} hostPattern - The host pattern to merge into
  * @param {string} key - A setting key
  * @param {string|number} value - A setting value
  */
module.exports.mergeSiteSetting = (siteSettings, hostPattern, key, value) =>
  (siteSettings || Immutable.Map()).mergeIn([hostPattern], {
    [key]: value
  })

/**
  * Remove all site settings for the specified hostPattern.
  * @param {Object} siteSettings - The top level app state site settings indexed by hostPattern.
  * @param {string} hostPattern - The host pattern to remove all settings for.
  */
module.exports.removeSiteSettings = (siteSettings, hostPattern) =>
  siteSettings.delete(hostPattern)
