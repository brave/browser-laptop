/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const AppDispatcher = require('../dispatcher/appDispatcher')
const AppStore = require('../stores/appStore')
const appConstants = require('../constants/appConstants')
const appConfig = require('../constants/appConfig')
const config = require('../constants/config')
const hostContentSettings = require('../../app/browser/contentSettings/hostContentSettings')
const {makeImmutable} = require('../../app/common/state/immutableUtil')
const Immutable = require('immutable')
const settings = require('../constants/settings')
const {cookieExceptions, localStorageExceptions} = require('../data/siteHacks')
const {defaultPasswordManager} = require('../constants/passwordManagers')
const urlParse = require('url').parse
const siteSettings = require('./siteSettings')
const { setUserPref } = require('./userPrefs')
const { getSetting } = require('../settings')

// backward compatibility with appState siteSettings
const parseSiteSettingsPattern = (pattern) => {
  let normalizedPattern = pattern.replace('https?', 'https')
  let parsed = urlParse(normalizedPattern)
  return '[*.]' + parsed.host
}

const toContentSetting = (primaryPattern, secondaryPattern = undefined, setting = 'block', resourceId = undefined) => {
  return Immutable.fromJS({
    setting,
    primaryPattern,
    secondaryPattern,
    resourceId
  })
}

const addContentSettings = (contentSettings, key, primaryPattern, secondaryPattern, setting, resourceId) => {
  let contentSettingsForKey = contentSettings.get(key)
  if (!contentSettingsForKey) {
    return contentSettings
  } else {
    contentSettingsForKey = contentSettingsForKey.push(toContentSetting(primaryPattern, secondaryPattern, setting, resourceId))
    return contentSettings.set(key, contentSettingsForKey)
  }
}

// Content settings handled by HostContentSettingsMap in Muon
const getDefaultHostContentSettings = (braveryDefaults, appSettings, appConfig) => {
  return Immutable.fromJS({
    plugins: getDefaultPluginSettings(braveryDefaults, appSettings, appConfig)
  })
}

// Content settings currently handled by UserPrefs in Muon
// Usage of these settings is deprecated and we should be transitioning to HostContentSettings
// Check with @bridiver before adding additional user pref content settings
const getDefaultUserPrefContentSettings = (braveryDefaults, appSettings, appConfig) => {
  return Immutable.fromJS({
    cookies: getDefault3rdPartyStorageSettings(braveryDefaults, appSettings, appConfig),
    referer: [{
      setting: braveryDefaults.cookieControl === 'block3rdPartyCookie' ? 'block' : 'allow',
      primaryPattern: '*'
    }],
    adInsertion: [{
      setting: braveryDefaults.adControl === 'showBraveAds' ? 'allow' : 'block',
      primaryPattern: '*'
    }],
    passwordManager: getDefaultPasswordManagerSettings(braveryDefaults, appSettings, appConfig),
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
    runInsecureContent: [{
      setting: 'block',
      primaryPattern: '*'
    }],
    popups: [{
      setting: 'block',
      primaryPattern: '*'
    }]
  })
}

const getDefaultPasswordManagerSettings = (braveryDefaults, appSettings, appConfig) => {
  let bravePasswordManagerSetting = 'block'
  if (appSettings) {
    const passwordManager = getSetting(settings.ACTIVE_PASSWORD_MANAGER, appSettings)
    let useBuiltIn = passwordManager === defaultPasswordManager
    bravePasswordManagerSetting = useBuiltIn ? 'allow' : 'block'
  }

  return [
    {
      setting: bravePasswordManagerSetting,
      primaryPattern: '*'
    }
  ]
}

const getDefaultPluginSettings = (braveryDefaults, appSettings, appConfig) => {
  return [
    {
      setting: 'block',
      primaryPattern: '*'
    },
    {
      setting: 'block',
      resourceId: appConfig.flash.resourceId,
      primaryPattern: '*'
    },
    {
      setting: 'block',
      resourceId: appConfig.widevine.resourceId,
      primaryPattern: '*'
    }
  ]
}

const getDefault3rdPartyStorageSettings = (braveryDefaults, appSettings, appConfig) => {
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

const siteSettingsToContentSettings = (currentSiteSettings, defaultContentSettings, braveryDefaults, appConfig) => {
  let contentSettings = makeImmutable(defaultContentSettings)
  currentSiteSettings = makeImmutable(currentSiteSettings)
  braveryDefaults = makeImmutable(braveryDefaults)

  // We do 2 passes for setting content settings. On the first pass we consider all shield types.
  currentSiteSettings.forEach((siteSetting, hostPattern) => {
    let primaryPattern = parseSiteSettingsPattern(hostPattern)

    if (['number', 'boolean'].includes(typeof siteSetting.get('noScript'))) {
      contentSettings = addContentSettings(contentSettings, 'javascript', primaryPattern, '*', siteSetting.get('noScript') === true ? 'block' : 'allow')
    }
    if (typeof siteSetting.get('runInsecureContent') === 'boolean') {
      contentSettings = addContentSettings(contentSettings, 'runInsecureContent', primaryPattern, '*',
        siteSetting.get('runInsecureContent') ? 'allow' : 'block')
    }
    if (siteSetting.get('cookieControl')) {
      if (siteSetting.get('cookieControl') === 'block3rdPartyCookie') {
        contentSettings = addContentSettings(contentSettings, 'cookies', primaryPattern, '*', 'block')
        contentSettings = addContentSettings(contentSettings, 'cookies', primaryPattern, primaryPattern, 'allow')
        contentSettings = addContentSettings(contentSettings, 'referer', primaryPattern, '*', 'block')
        cookieExceptions.forEach((exceptionPair) => {
          contentSettings = addContentSettings(contentSettings, 'cookies', exceptionPair[0], exceptionPair[1], 'allow')
        })
      } else {
        contentSettings = addContentSettings(contentSettings, 'cookies', primaryPattern, '*', 'allow')
        contentSettings = addContentSettings(contentSettings, 'referer', primaryPattern, '*', 'allow')
      }
    }
    if (typeof siteSetting.get('fingerprintingProtection') === 'boolean') {
      contentSettings = addContentSettings(contentSettings, 'canvasFingerprinting', primaryPattern, '*', siteSetting.get('fingerprintingProtection') ? 'block' : 'allow')
    }
    if (siteSetting.get('adControl')) {
      contentSettings = addContentSettings(contentSettings, 'adInsertion', primaryPattern, '*', siteSetting.get('adControl') === 'showBraveAds' ? 'allow' : 'block')
    }
    if (typeof siteSetting.get('flash') === 'number') { // && braveryDefaults.flash) {
      contentSettings = addContentSettings(contentSettings, 'plugins', primaryPattern, '*', 'allow', appConfig.flash.resourceId)
    }
    if (typeof siteSetting.get('widevine') === 'number' && braveryDefaults.widevine) {
      contentSettings = addContentSettings(contentSettings, 'plugins', primaryPattern, '*', 'allow', appConfig.widevine.resourceId)
    }
  })
  // On the second pass we consider only shieldsUp === false settings since we want those to take precedence.
  currentSiteSettings.forEach((siteSetting, hostPattern) => {
    let primaryPattern = parseSiteSettingsPattern(hostPattern)

    if (siteSetting.get('shieldsUp') === false) {
      contentSettings = addContentSettings(contentSettings, 'cookies', primaryPattern, '*', 'allow')
      contentSettings = addContentSettings(contentSettings, 'canvasFingerprinting', primaryPattern, '*', 'allow')
      contentSettings = addContentSettings(contentSettings, 'adInsertion', primaryPattern, '*', 'block')
      contentSettings = addContentSettings(contentSettings, 'javascript', primaryPattern, '*', 'allow')
      contentSettings = addContentSettings(contentSettings, 'referer', primaryPattern, '*', 'allow')
    }
  })
  return contentSettings
}

const getSettingsFromSiteSettings = (defaultSettings, appState, appConfig, isPrivate = false) => {
  let currentSiteSettings = appState.get('siteSettings')
  const temporarySiteSettings = appState.get('temporarySiteSettings')
  const braveryDefaults = siteSettings.braveryDefaults(appState, appConfig)

  if (isPrivate) {
    currentSiteSettings = currentSiteSettings.merge(temporarySiteSettings)
  }

  return siteSettingsToContentSettings(currentSiteSettings, defaultSettings, braveryDefaults, appConfig)
}

const updateContentSettings = (appState, appConfig, isPrivate = false) => {
  const braveryDefaults = siteSettings.braveryDefaults(appState, appConfig)
  const defaultUserPrefs = getDefaultUserPrefContentSettings(braveryDefaults, appState, appConfig)
  const defaultHostContentSettings = getDefaultHostContentSettings(braveryDefaults, appState, appConfig)

  setUserPref('content_settings', getSettingsFromSiteSettings(defaultUserPrefs, appState, appConfig, isPrivate), isPrivate)
  hostContentSettings.setContentSettings(getSettingsFromSiteSettings(defaultHostContentSettings, appState, appConfig, isPrivate), isPrivate)
}

// Register callback to handle all updates
const doAction = (action) => {
  switch (action.actionType) {
    case appConstants.APP_REMOVE_SITE_SETTING:
    case appConstants.APP_CHANGE_SITE_SETTING:
      AppDispatcher.waitFor([AppStore.dispatchToken], () => {
        updateContentSettings(AppStore.getState(), appConfig, action.temporary)
      })
      break
    case appConstants.APP_CHANGE_SETTING:
    case appConstants.APP_SET_RESOURCE_ENABLED:
      AppDispatcher.waitFor([AppStore.dispatchToken], () => {
        updateContentSettings(AppStore.getState(), appConfig)
      })
      break
    case appConstants.APP_ALLOW_FLASH_ONCE:
    case appConstants.APP_ALLOW_FLASH_ALWAYS:
      AppDispatcher.waitFor([AppStore.dispatchToken], () => {
        updateContentSettings(AppStore.getState(), appConfig, action.isPrivate)
      })
      break
    default:
  }
}

module.exports.init = () => {
  AppDispatcher.register(doAction)
}
