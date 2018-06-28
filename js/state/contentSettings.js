/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appDispatcher = require('../dispatcher/appDispatcher')
const AppStore = require('../stores/appStore')
const appConstants = require('../constants/appConstants')
const appConfig = require('../constants/appConfig')
const {registerContentSettings} = require('../../app/browser/contentSettings/hostContentSettings')
const {makeImmutable} = require('../../app/common/state/immutableUtil')
const Immutable = require('immutable')
const settings = require('../constants/settings')
const {cookieExceptions, localStorageExceptions} = require('../data/siteHacks')
const {defaultPasswordManager} = require('../constants/passwordManagers')
const urlParse = require('../../app/common/urlParse')
const siteSettings = require('./siteSettings')
const {registerUserPrefs} = require('./userPrefs')
const {getSetting} = require('../settings')
const {autoplayOption} = require('../../app/common/constants/settingsEnums')
const {getFlashResourceId} = require('../flash')

// Widevine not supported yet on linux
const widevineResourceId = `widevinecdmadapter.${process.platform === 'darwin' ? 'plugin' : 'dll'}`

// backward compatibility with appState siteSettings
const parseSiteSettingsPattern = (pattern) => {
  if (pattern === 'file:///') {
    return 'file:///*'
  }
  let normalizedPattern = pattern.replace('https?', 'https')
  let parsed = urlParse(normalizedPattern)
  if (muon.url.new(normalizedPattern).hostIsIPAddress()) {
    return parsed.host
  } else if (parsed.host) {
    return '[*.]' + parsed.host
  } else {
    // Probably won't match anything. Fail closed.
    return pattern
  }
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
  braveryDefaults = makeImmutable(braveryDefaults)
  return Immutable.fromJS({
    autoplay: [{
      setting: getSetting(settings.AUTOPLAY_MEDIA) === autoplayOption.ALWAYS_ALLOW ? 'allow' : 'block',
      primaryPattern: '*'
    }],
    cookies: getDefault3rdPartyStorageSettings(braveryDefaults, appSettings, appConfig),
    canvasFingerprinting: getDefaultFingerprintingSetting(braveryDefaults),
    referer: [{
      setting: braveryDefaults.get('cookieControl') !== 'allowAllCookies' ? 'block' : 'allow',
      primaryPattern: '*'
    }],
    adInsertion: [{
      setting: braveryDefaults.get('adControl') === 'showBraveAds' ? 'allow' : 'block',
      primaryPattern: '*'
    }],
    ads: [{
      setting: ['blockAds', 'showBraveAds'].includes(braveryDefaults.get('adControl')) ? 'block' : 'allow',
      primaryPattern: '*'
    }],
    doNotTrack: [{
      setting: getSetting(settings.DO_NOT_TRACK, appSettings) ? 'allow' : 'block',
      primaryPattern: '*'
    }],
    passwordManager: getDefaultPasswordManagerSettings(braveryDefaults, appSettings, appConfig),
    javascript: [{
      setting: braveryDefaults.get('noScript') ? 'block' : 'allow',
      primaryPattern: '*'
    }, {
      setting: 'allow',
      secondaryPattern: '*',
      primaryPattern: 'chrome-extension://*'
    }],
    runInsecureContent: [{
      setting: 'block',
      primaryPattern: '*'
    }],
    flashEnabled: [{ // whether flash is installed and enabled
      setting: braveryDefaults.get('flash') ? 'allow' : 'block',
      primaryPattern: '*'
    }],
    flashAllowed: [{ // whether user has expressed intent to run flash
      setting: 'block',
      primaryPattern: '*'
    }],
    torEnabled: [{ // set to 'block' when in a Tor tab
      setting: 'allow',
      primaryPattern: '*'
    }],
    dappDetection: [{
      setting: getSetting(settings.METAMASK_PROMPT_DISMISSED) || getSetting(settings.METAMASK_ENABLED) ? 'block' : 'allow',
      primaryPattern: '*'
    }],
    popups: [{
      setting: 'block',
      primaryPattern: '*'
    }],
    plugins: getDefaultPluginSettings(braveryDefaults, appSettings, appConfig)
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
      resourceId: getFlashResourceId(),
      primaryPattern: '*'
    },
    {
      setting: 'block',
      resourceId: widevineResourceId,
      primaryPattern: '*'
    },
    // allow autodetction of flash install by adobe
    {
      setting: 'allow',
      resourceId: getFlashResourceId(),
      primaryPattern: '[*.]adobe.com'
    },
    {
      setting: 'allow',
      resourceId: getFlashResourceId(),
      primaryPattern: '[*.]macromedia.com'
    }
  ]
}

const getDefaultFingerprintingSetting = (braveryDefaults, appSettings, appConfig) => {
  braveryDefaults = makeImmutable(braveryDefaults)
  if (braveryDefaults.get('fingerprintingProtection') === 'block3rdPartyFingerprinting') {
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
  } else if (braveryDefaults.get('fingerprintingProtection') === 'blockAllFingerprinting') {
    return [
      {
        setting: 'block',
        primaryPattern: '*',
        secondaryPattern: '*'
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

const getDefault3rdPartyStorageSettings = (braveryDefaults, appSettings, appConfig) => {
  braveryDefaults = makeImmutable(braveryDefaults)
  if (braveryDefaults.get('cookieControl') === 'block3rdPartyCookie') {
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
      }
    ]
    contentSettings.push(...localStorageExceptions.map((exceptionPair) => ({
      setting: 'allow',
      primaryPattern: exceptionPair[0],
      secondaryPattern: exceptionPair[1]
    })))
    return contentSettings
  } else if (braveryDefaults.get('cookieControl') === 'blockAllCookies') {
    return [
      {
        setting: 'block',
        primaryPattern: '*',
        secondaryPattern: '*'
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
    const noScriptExceptions = siteSetting.get('noScriptExceptions')
    if (noScriptExceptions && typeof noScriptExceptions.get(hostPattern) === 'number') {
      // Allow all is needed for inline scripts to run. XXX: this seems like
      // a muon bug.
      contentSettings = addContentSettings(contentSettings, 'javascript',
        primaryPattern, '*', 'allow')
      // Re-block the origins that aren't excluded
      noScriptExceptions.forEach((value, origin) => {
        if (value === false) {
          contentSettings = addContentSettings(contentSettings, 'javascript',
            primaryPattern, origin === 'file:///' ? 'file:///*' : origin, 'block')
        }
      })
    } else if (noScriptExceptions && noScriptExceptions.size) {
      noScriptExceptions.forEach((value, origin) => {
        if (typeof value === 'number') {
          contentSettings = addContentSettings(contentSettings, 'javascript',
            primaryPattern, origin, 'allow')
        }
      })
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
        for (let key in cookieExceptions) {
          const subResources = cookieExceptions[key]
          for (let i = 0; i < subResources.length; ++i) {
            contentSettings = addContentSettings(contentSettings, 'cookies', key, subResources[i], 'allow')
          }
        }
      } else if (siteSetting.get('cookieControl') === 'blockAllCookies') {
        contentSettings = addContentSettings(contentSettings, 'cookies', primaryPattern, '*', 'block')
        contentSettings = addContentSettings(contentSettings, 'referer', primaryPattern, '*', 'block')
      } else {
        contentSettings = addContentSettings(contentSettings, 'cookies', primaryPattern, '*', 'allow')
        contentSettings = addContentSettings(contentSettings, 'referer', primaryPattern, '*', 'allow')
      }
    }
    if (siteSetting.get('fingerprintingProtection')) {
      if (siteSetting.get('fingerprintingProtection') === 'block3rdPartyFingerprinting') {
        contentSettings = addContentSettings(contentSettings, 'canvasFingerprinting', primaryPattern, '*', 'block')
        contentSettings = addContentSettings(contentSettings, 'canvasFingerprinting', primaryPattern, '[firstParty]', 'allow')
      } else if (siteSetting.get('fingerprintingProtection') === 'blockAllFingerprinting') {
        contentSettings = addContentSettings(contentSettings, 'canvasFingerprinting', primaryPattern, '*', 'block')
      } else {
        contentSettings = addContentSettings(contentSettings, 'canvasFingerprinting', primaryPattern, '*', 'allow')
      }
    }
    if (siteSetting.get('adControl')) {
      contentSettings = addContentSettings(contentSettings, 'adInsertion', primaryPattern, '*', siteSetting.get('adControl') === 'showBraveAds' ? 'allow' : 'block')
    }
    if (typeof siteSetting.get('flash') === 'number' && braveryDefaults.get('flash')) {
      contentSettings = addContentSettings(contentSettings, 'plugins', primaryPattern, '*', 'allow', getFlashResourceId())
      contentSettings = addContentSettings(contentSettings, 'flashAllowed', primaryPattern, '*', 'allow', getFlashResourceId())
    }
    if (typeof siteSetting.get('widevine') === 'number' && braveryDefaults.get('widevine')) {
      contentSettings = addContentSettings(contentSettings, 'plugins', primaryPattern, '*', 'allow', widevineResourceId)
    }
    if (typeof siteSetting.get('autoplay') === 'boolean') {
      contentSettings = addContentSettings(contentSettings, 'autoplay', primaryPattern, '*', siteSetting.get('autoplay') ? 'allow' : 'block')
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
      contentSettings = addContentSettings(contentSettings, 'plugins', primaryPattern, '*', 'allow')
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

const updateUserPrefs = (appState, appConfig, isPrivate = false) => {
  const braveryDefaults = siteSettings.braveryDefaults(appState, appConfig)
  const defaultUserPrefs = getDefaultUserPrefContentSettings(braveryDefaults, appState, appConfig)

  return { 'content_settings': getSettingsFromSiteSettings(defaultUserPrefs, appState, appConfig, isPrivate) }
}

const updateContentSettings = (appState, appConfig, isPrivate = false) => {
  const braveryDefaults = siteSettings.braveryDefaults(appState, appConfig)
  const defaultHostContentSettings = getDefaultHostContentSettings(braveryDefaults, appState, appConfig)

  return getSettingsFromSiteSettings(defaultHostContentSettings, appState, appConfig, isPrivate)
}

let userPrefsUpdateTrigger
let contentSettingsUpdateTrigger

// Register callback to handle all updates
const doAction = (action) => {
  switch (action.actionType) {
    case appConstants.APP_REMOVE_SITE_SETTING:
    case appConstants.APP_CHANGE_SITE_SETTING:
    case appConstants.APP_CLEAR_SITE_SETTINGS:
    case appConstants.APP_ADD_NOSCRIPT_EXCEPTIONS:
      appDispatcher.waitFor([AppStore.dispatchToken], () => {
        userPrefsUpdateTrigger(action.temporary)
        contentSettingsUpdateTrigger(action.temporary)
      })
      break
    case appConstants.APP_CHANGE_SETTING:
    case appConstants.APP_SET_RESOURCE_ENABLED:
      appDispatcher.waitFor([AppStore.dispatchToken], () => {
        userPrefsUpdateTrigger()
        contentSettingsUpdateTrigger()
      })
      break
    case appConstants.APP_ALLOW_FLASH_ONCE:
    case appConstants.APP_ALLOW_FLASH_ALWAYS:
      appDispatcher.waitFor([AppStore.dispatchToken], () => {
        userPrefsUpdateTrigger(action.isPrivate)
        contentSettingsUpdateTrigger(action.isPrivate)
      })
      break
    default:
  }
}

module.exports.init = () => {
  userPrefsUpdateTrigger = registerUserPrefs((incognito = false) =>
    updateUserPrefs(AppStore.getState(), appConfig, incognito)
  )

  contentSettingsUpdateTrigger = registerContentSettings((incognito = false) =>
    updateContentSettings(AppStore.getState(), appConfig, incognito)
  )

  appDispatcher.register(doAction)
}
