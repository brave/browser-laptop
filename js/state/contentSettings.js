/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const AppDispatcher = require('../dispatcher/appDispatcher')
const AppStore = require('../stores/appStore')
const AppConstants = require('../constants/appConstants')
const appConfig = require('../constants/appConfig')
const config = require('../constants/config')
const settings = require('../constants/settings')
const {passwordManagers, defaultPasswordManager} = require('../constants/passwordManagers')
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
    const passwordManager = appSettings.get(settings.ACTIVE_PASSWORD_MANAGER)
    if (typeof passwordManager === 'string') {
      return passwordManager === passwordManagers.BUILT_IN
    }
  }
  return defaultPasswordManager === passwordManagers.BUILT_IN
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
      },
      {
        // Needed for coinbase widget localStorage to work in about:preferences
        setting: 'allow',
        primaryPattern: `chrome-extension://${config.braveExtensionId}`,
        secondaryPattern: config.coinbaseOrigin
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
    javascript: [{
      setting: braveryDefaults.noScript ? 'block' : 'allow',
      primaryPattern: '*'
    }, {
      setting: 'allow',
      secondaryPattern: '*',
      primaryPattern: 'file:///*'
    }, {
      setting: 'allow',
      secondaryPattern: '*',
      primaryPattern: 'chrome-extension://*'
    }],
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
  // We do 2 passes for setting content settings. On the first pass we consider all shield types.
  for (let hostPattern in hostSettings) {
    let hostSetting = hostSettings[hostPattern]
    if (typeof hostSetting.noScript === 'boolean') {
      // TODO: support temporary override
      addContentSettings(contentSettings.javascript, hostPattern, '*',
        hostSetting.noScript ? 'block' : 'allow')
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
  }
  // On the second pass we consider only shieldsUp === false settings since we want those to take precedence.
  for (let hostPattern in hostSettings) {
    let hostSetting = hostSettings[hostPattern]
    if (hostSetting.shieldsUp === false) {
      addContentSettings(contentSettings.cookies, hostPattern, '*', 'allow')
      addContentSettings(contentSettings.canvasFingerprinting, hostPattern, '*', 'allow')
      addContentSettings(contentSettings.adInsertion, hostPattern, '*', 'block')
      addContentSettings(contentSettings.javascript, hostPattern, '*', 'allow')
      addContentSettings(contentSettings.referer, hostPattern, '*', 'allow')
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
