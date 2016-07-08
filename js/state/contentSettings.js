/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const AppDispatcher = require('../dispatcher/appDispatcher')
const AppStore = require('../stores/appStore')
const AppConstants = require('../constants/appConstants')
const appConfig = require('../constants/appConfig')
const settings = require('../constants/settings')
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

const getPasswordManagerEnabled = (appState) => {
  let appSettings = appState.get('settings')
  if (appSettings) {
    if (typeof appSettings.get(settings.PASSWORD_MANAGER_ENABLED) === 'boolean') {
      return appSettings.get(settings.PASSWORD_MANAGER_ENABLED)
    }
  }
  return appConfig.defaultSettings[settings.PASSWORD_MANAGER_ENABLED]
}

const getBlock3rdPartyStorage = (braveryDefaults) => {
  if (braveryDefaults.cookieControl === 'block3rdPartyCookie') {
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
  } else {
    return [
      {
        setting: 'allow',
        primaryPattern: '*',
        secondaryPattern: '*'
      }
    ]
  }
}

const getContentSettingsFromSiteSettings = (appState) => {
  let braveryDefaults = siteSettings.braveryDefaults(appState, appConfig)

  let contentSettings = {
    cookies: getBlock3rdPartyStorage(braveryDefaults),
    referer: [{
      setting: braveryDefaults.cookieControl === 'block3rdPartyCookie' ? 'block' : 'allow',
      primaryPattern: '*'
    }],
    adInsertion: [{
      setting: braveryDefaults.adControl === 'showBraveAds' ? 'allow' : 'block',
      primaryPattern: '*'
    }],
    passwordManager: [{
      setting: getPasswordManagerEnabled(appState) ? 'allow' : 'block',
      primaryPattern: '*'
    }],
    javascript: [],
    canvasFingerprinting: [{
      setting: braveryDefaults.fingerprintingProtection ? 'block' : 'allow',
      primaryPattern: '*'
    }],
    flashEnabled: [{
      setting: braveryDefaults.flash ? 'allow' : 'block',
      primaryPattern: '*'
    }],
    flashActive: [{
      setting: 'block',
      primaryPattern: '*'
    }]
  }

  let hostSettings = appState.get('siteSettings').toJS()
  for (var hostPattern in hostSettings) {
    let hostSetting = hostSettings[hostPattern]
    if (hostSetting.noScript) {
      // TODO(bridiver) - enable this when we support temporary overrides
      // addContentSettings(contentSettings.javascript, hostPattern)
    }
    if (hostSetting.cookieControl) {
      if (hostSetting.cookieControl === 'block3rdPartyCookie') {
        addContentSettings(contentSettings.cookies, hostPattern, '*', 'block')
        addContentSettings(contentSettings.cookies, hostPattern, parseSiteSettingsPattern(hostPattern), 'allow')
        addContentSettings(contentSettings.referer, hostPattern, '*', 'block')
      } else {
        addContentSettings(contentSettings.cookies, hostPattern, '*', 'allow')
        addContentSettings(contentSettings.referer, hostPattern, '*', 'allow')
      }
    }
    if (typeof hostSetting.fingerprintingProtection === 'boolean') {
      addContentSettings(contentSettings.canvasFingerprinting, hostPattern, '*', hostSetting.fingerprintingProtection ? 'block' : 'allow')
    }
    if (hostSetting.adControl) {
      addContentSettings(contentSettings.adInsertion, hostPattern, '*', hostSetting.adControl === 'showBraveAds' ? 'allow' : 'block')
    }
    if (typeof hostSetting.flash === 'number') {
      addContentSettings(contentSettings.flashActive, hostPattern, '*', 'allow')
    }

    // these should always be the last rules so they take precendence over the others
    if (hostSetting.shieldsUp === false) {
      addContentSettings(contentSettings.cookies, hostPattern, '*', 'allow')
      addContentSettings(contentSettings.canvasFingerprinting, hostPattern, '*', 'allow')
      addContentSettings(contentSettings.adInsertion, hostPattern, '*', 'block')
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
    case AppConstants.APP_REMOVE_SITE_SETTING:
      AppDispatcher.waitFor([AppStore.dispatchToken], () => {
        updateTrigger('content_settings', action.temporary)
      })
      break
    case AppConstants.APP_SET_RESOURCE_ENABLED:
      AppDispatcher.waitFor([AppStore.dispatchToken], () => {
        updateTrigger()
      })
      break
    case AppConstants.APP_CHANGE_SETTING:
      AppDispatcher.waitFor([AppStore.dispatchToken], () => {
        updateTrigger()
      })
      break
    default:
  }
}

module.exports.init = () => {
  updateTrigger = registerUserPrefs(() => getContentSettingsFromSiteSettings(AppStore.getState()))
  AppDispatcher.register(doAction)
}
