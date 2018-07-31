/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appConfig = require('./constants/appConfig')
const Immutable = require('immutable')
const settings = require('./constants/settings')
const config = require('./constants/config')
const {passwordManagers, defaultPasswordManager, extensionIds, displayNames} = require('./constants/passwordManagers')
const {bookmarksToolbarMode} = require('../app/common/constants/settingsEnums')

// individual settings were deprecated with 0.11.4
// DO NOT ADD TO THIS LIST
const passwordManagerDefault = (settingKey, settingsCollection) => {
  const onePasswordEnabled = resolveValue(settings.ONE_PASSWORD_ENABLED, settingsCollection) === true
  if (onePasswordEnabled) return passwordManagers.ONE_PASSWORD

  const dashlaneEnabled = resolveValue(settings.DASHLANE_ENABLED, settingsCollection) === true
  if (dashlaneEnabled) return passwordManagers.DASHLANE

  const lastPassEnabled = resolveValue(settings.LAST_PASS_ENABLED, settingsCollection) === true
  if (lastPassEnabled) return passwordManagers.LAST_PASS

  const disabled = resolveValue(settings.PASSWORD_MANAGER_ENABLED, settingsCollection) === false
  if (disabled) return passwordManagers.UNMANAGED

  return defaultPasswordManager
}

// individual settings were deprecated with 0.12.6
// DO NOT ADD TO THIS LIST
const bookmarksBarDefault = (settingKey, settingsCollection) => {
  const faviconsOnly = resolveValue(settings.SHOW_BOOKMARKS_TOOLBAR_ONLY_FAVICON, settingsCollection) === true
  if (faviconsOnly) return bookmarksToolbarMode.FAVICONS_ONLY

  const favicons = resolveValue(settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON, settingsCollection) === true
  if (favicons) return bookmarksToolbarMode.TEXT_AND_FAVICONS

  return bookmarksToolbarMode.TEXT_ONLY
}

const contributionDefaultAmount = (settingKey, settingsCollection) => {
  return appConfig.payments.defaultContributionAmount
}

const getDefaultSetting = (settingKey, settingsCollection) => {
  // Two use cases for this:
  switch (settingKey) {
    // 1) Retrofit a new setting based on old values
    // we don't want to lose existing user settings.
    case settings.ACTIVE_PASSWORD_MANAGER:
      return passwordManagerDefault(settingKey, settingsCollection)
    case settings.BOOKMARKS_TOOLBAR_MODE:
      return bookmarksBarDefault(settingKey, settingsCollection)

    // 2) Get a default value when no value is set
    // allows for default to change until user locks it in
    //
    // These are overridden when:
    // >> user picks their own setting in about:preferences#payments
    case settings.PAYMENTS_CONTRIBUTION_AMOUNT:
      return contributionDefaultAmount(settingKey, settingsCollection)
    // >> locale is intialized (which determines default search engine)
    case settings.DEFAULT_SEARCH_ENGINE:
      return config.defaultSearchEngineByLocale.default
  }
  return undefined
}

const resolveValue = (settingKey, settingsCollection) => {
  if (settingsCollection && Immutable.Map.isMap(settingsCollection) &&
    settingsCollection.get(settingKey) !== undefined) {
    return settingsCollection.get(settingKey)
  }
  if (settingsCollection && settingsCollection[settingKey] !== undefined) {
    return settingsCollection[settingKey]
  }
  const appStore = (process.type === 'browser'
      ? require('./stores/appStore').getState()
      : require('./stores/appStoreRenderer').state) || Immutable.Map()
  const appSettings = appStore.get('settings') || Immutable.Map()
  return appSettings.get(settingKey) !== undefined ? appSettings.get(settingKey) : appConfig.defaultSettings[settingKey]
}

module.exports.getSetting = (settingKey, settingsCollection, defaultWhenNull = true) => {
  const setting = resolveValue(settingKey, settingsCollection)
  if (typeof setting !== 'undefined' && setting !== null) return setting
  return defaultWhenNull
    ? getDefaultSetting(settingKey, settingsCollection)
    : setting
}

module.exports.getActivePasswordManager = (settingsCollection) => {
  const passwordManager = module.exports.getSetting(settings.ACTIVE_PASSWORD_MANAGER, settingsCollection)

  let details = {
    name: passwordManager,
    extensionId: extensionIds[passwordManager],
    displayName: displayNames[passwordManager]
  }

  return Immutable.fromJS(details)
}
