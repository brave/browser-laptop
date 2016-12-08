/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const AppDispatcher = require('../dispatcher/appDispatcher')
const AppStore = require('../stores/appStore')
const appConstants = require('../constants/appConstants')
const appConfig = require('../constants/appConfig')
const config = require('../constants/config')
const settings = require('../constants/settings')
const {cookieExceptions, localStorageExceptions} = require('../data/siteHacks')
const {passwordManagers, defaultPasswordManager} = require('../constants/passwordManagers')
const urlParse = require('url').parse
const siteSettings = require('./siteSettings')
const {setUserPref} = require('./userPrefs')
const {getSetting} = require('../settings')

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
    const passwordManager = getSetting(settings.ACTIVE_PASSWORD_MANAGER, appSettings)
    if (typeof passwordManager === 'string') {
      return passwordManager === passwordManagers.BUILT_IN
    }
  }
  return defaultPasswordManager === passwordManagers.BUILT_IN
}

const getBlock3rdPartyStorage = (braveryDefaults) => {
  if (braveryDefaults.cookieControl === 'block3rdPartyCookie') {
    const contentSettings = [
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
    contentSettings.push(...localStorageExceptions.map((exceptionPair) => ({
      setting: 'allow',
      primaryPattern: exceptionPair[0],
      secondaryPattern: exceptionPair[1]
    })))
    return contentSettings
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

const hostSettingsToContentSettings = (hostSettings, contentSettingsSource) => {
  let contentSettings = contentSettingsSource
  // We do 2 passes for setting content settings. On the first pass we consider all shield types.
  for (let hostPattern in hostSettings) {
    let hostSetting = hostSettings[hostPattern]
    if (['number', 'boolean'].includes(typeof hostSetting.noScript)) {
      addContentSettings(contentSettings.javascript, hostPattern, '*',
        hostSetting.noScript === true ? 'block' : 'allow')
    }
    if (typeof hostSetting.runInsecureContent === 'boolean') {
      addContentSettings(contentSettings.runInsecureContent, hostPattern, '*',
        hostSetting.runInsecureContent ? 'allow' : 'block')
    }
    if (hostSetting.cookieControl) {
      if (hostSetting.cookieControl === 'block3rdPartyCookie') {
        addContentSettings(contentSettings.cookies, hostPattern, '*', 'block')
        addContentSettings(contentSettings.cookies, hostPattern, parseSiteSettingsPattern(hostPattern), 'allow')
        addContentSettings(contentSettings.referer, hostPattern, '*', 'block')
        cookieExceptions.forEach((exceptionPair) =>
          addContentSettings(contentSettings.cookies, exceptionPair[0], exceptionPair[1], 'allow'))
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
    if (typeof hostSetting.flash === 'number' && AppStore.getState().get('flashInitialized')) {
      addContentSettings(contentSettings.flashActive, hostPattern, '*', 'allow')
      addContentSettings(contentSettings.plugins, hostPattern, '*', 'allow')
    }
    if (typeof hostSetting.widevine === 'number' && AppStore.getState().getIn(['widevine', 'enabled'])) {
      addContentSettings(contentSettings.plugins, hostPattern, '*', 'allow')
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
  return contentSettings
}

const getContentSettingsFromSiteSettings = (appState, isPrivate = false) => {
  let braveryDefaults = siteSettings.braveryDefaults(appState, appConfig)

  const contentSettings = {
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
    }],
    runInsecureContent: [{
      setting: 'block',
      primaryPattern: '*'
    }],
    plugins: [{
      setting: 'block',
      primaryPattern: '*'
    }]
  }

  const regularSettings = hostSettingsToContentSettings(appState.get('siteSettings').toJS(), contentSettings)
  if (isPrivate) {
    const privateSettings =
      hostSettingsToContentSettings(appState.get('siteSettings').merge(appState.get('temporarySiteSettings')).toJS(),
        contentSettings)
    return { content_settings: privateSettings }
  }
  return { content_settings: regularSettings }
}

// Register callback to handle all updates
const doAction = (action) => {
  switch (action.actionType) {
    case appConstants.APP_CHANGE_SITE_SETTING:
      AppDispatcher.waitFor([AppStore.dispatchToken], () => {
        if (action.temporary) {
          setUserPref('content_settings', getContentSettingsFromSiteSettings(AppStore.getState(), true).content_settings, true)
        } else {
          setUserPref('content_settings', getContentSettingsFromSiteSettings(AppStore.getState()).content_settings)
        }
      })
      break
    case appConstants.APP_REMOVE_SITE_SETTING:
      AppDispatcher.waitFor([AppStore.dispatchToken], () => {
        if (action.temporary) {
          setUserPref('content_settings', getContentSettingsFromSiteSettings(AppStore.getState(), true).content_settings, true)
        } else {
          setUserPref('content_settings', getContentSettingsFromSiteSettings(AppStore.getState()).content_settings)
        }
      })
      break
    case appConstants.APP_SET_RESOURCE_ENABLED:
      AppDispatcher.waitFor([AppStore.dispatchToken], () => {
        setUserPref('content_settings', getContentSettingsFromSiteSettings(AppStore.getState()).content_settings)
      })
      break
    case appConstants.APP_CHANGE_SETTING:
      AppDispatcher.waitFor([AppStore.dispatchToken], () => {
        setUserPref('content_settings', getContentSettingsFromSiteSettings(AppStore.getState()).content_settings)
      })
      break
    default:
  }
}

module.exports.init = () => {
  AppDispatcher.register(doAction)
}
