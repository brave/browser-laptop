/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const AppDispatcher = require('../dispatcher/appDispatcher')
const AppStore = require('../stores/appStore')
const AppConstants = require('../constants/appConstants')
const appConfig = require('../constants/appConfig')
const urlParse = require('url').parse
const siteSettings = require('./siteSettings')
const { registerUserPrefs } = require('./userPrefs')

// backward compatibility with appState siteSettings
const parseSiteSettingsPattern = (pattern) => {
  let normalizedPattern = pattern.replace('https?', 'https')
  let parsed = urlParse(normalizedPattern)
  return '[*.]' + parsed.host
}

const addContentSettings = (settingList, hostPattern, secondaryPattern = undefined, setting = 'block') => {
  let contentSettingsPattern = parseSiteSettingsPattern(hostPattern)
  settingList.push({
    setting,
    secondaryPattern,
    primaryPattern: contentSettingsPattern
  })
}

const getBlock3rdPartyStorage = () => {
  return [
    {
      setting: 'block',
      primaryPattern: '*',
      secondaryPattern: '*'
    },
    {
      setting: 'allow',
      primaryPattern: '*',
      secondaryPattern: '[firstParty]'
    }
  ]
}

const getAllowAllCookies = () => {
  return [
    {
      setting: 'allow',
      primaryPattern: '*',
      secondaryPattern: '*'
    }
  ]
}

const getContentSettingsFromSiteSettings = (appState) => {
  let braveryDefaults = siteSettings.braveryDefaults(appState, appConfig)

  let contentSettings = {
    cookies: braveryDefaults.cookieControl === 'block3rdPartyCookie' ? getBlock3rdPartyStorage() : getAllowAllCookies(),
    javascript: [],
    canvasFingerprinting: [{
      setting: braveryDefaults.fingerprintingProtection ? 'block' : 'allow',
      primaryPattern: '*'
    }]
  }

  let settings = appState.get('siteSettings').toJS()
  for (var hostPattern in settings) {
    let setting = settings[hostPattern]
    if (setting.noScript) {
      // TODO(bridiver) - enable this when we support temporary overrides
      // addContentSettings(contentSettings.javascript, hostPattern)
    }
    if (setting.cookieControl) {
      if (setting.cookieControl === 'block3rdPartyCookie') {
        addContentSettings(contentSettings.cookies, hostPattern, '*', 'block')
        addContentSettings(contentSettings.cookies, hostPattern, parseSiteSettingsPattern(hostPattern), 'allow')
      } else {
        addContentSettings(contentSettings.cookies, hostPattern, '*', 'allow')
      }
    }
    if (setting.fingerprintingProtection) {
      addContentSettings(contentSettings.canvasFingerprinting, hostPattern, '*', setting.fingerprintingProtection ? 'block' : 'allow')
    }
  }
  return { content_settings: contentSettings }
}

let updateTrigger

// Register callback to handle all updates
const doAction = (action) => {
  switch (action.actionType) {
    case AppConstants.APP_CHANGE_SITE_SETTING:
      AppDispatcher.waitFor([AppStore.dispatchToken], () => {
        updateTrigger('content_settings', action.temporary)
      })
      break
    case AppConstants.APP_SET_RESOURCE_ENABLED:
      AppDispatcher.waitFor([AppStore.dispatchToken], () => {
        if (action.resourceName === 'cookieblock' || action.resourceName === 'fingerprintingProtection') {
          updateTrigger()
        }
      })
      break
    default:
  }
}

module.exports.init = () => {
  updateTrigger = registerUserPrefs(() => getContentSettingsFromSiteSettings(AppStore.getState()))
  AppDispatcher.register(doAction)
}
