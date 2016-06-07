/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const urlParse = require('url').parse
const Immutable = require('immutable')

const getSiteSettings = (appState, isPrivate) => {
  let settings = appState.get('siteSettings')
  // temporary settings override site settings
  if (isPrivate) {
    settings = settings.mergeDeep(appState.get('temporarySiteSettings'))
  }
  return settings
}

/**
  * Obtains a squashed settings object of all matching host patterns with more exact matches taking precedence
  * @param {Object} siteSettings - The top level app state site settings indexed by hostPattern.
  * @param {string} location - The current page location to get settings for.
  * @return {Object} A merged settings object for the specified site setting or undefined
  */
const getSiteSettingsForURL = (siteSettings, location) => {
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getSiteSettings,
    getSiteSettingsForURL
  }
}

