/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const urlParse = require('url').parse
const Immutable = require('immutable')

/**
  * Obtains the site settings stored for a specific pattern.
  * @param {Object} siteSettings - The top level app state site settings indexed by hostPattern.
  * @param {string} hostPattern - The host pattern to lookup.
  *   Supported hostPattern values are of the form: protocol|(http[?|s])://[*.]<hostname>[:*]
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
  settingObjs.push(
    `${parsedUrl.protocol}//${parsedUrl.host}`,
    `${parsedUrl.protocol}//${parsedUrl.hostname}:*`,
    `${parsedUrl.protocol}//*`
  )
  if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
    settingObjs.push(`http?://${parsedUrl.host}`,
      `http?://${parsedUrl.hostname}:*`)
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
      settingObjs.push(`http?://*.${parsedUrl.host}`,
        `http?://*.${parsedUrl.hostname}:*`)
    }
  }

  settingObjs = settingObjs.map((hostPattern) => siteSettings.get(hostPattern))

  // Merge all the settingObj with the more specific first rules taking precedence
  const settingObj = settingObjs.reduce((mergedSettingObj, settingObj) =>
    (settingObj || Immutable.Map()).merge(mergedSettingObj), Immutable.Map())
  if (settingObj.size === 0) {
    return undefined
  }
  return Immutable.fromJS(settingObj)
}

