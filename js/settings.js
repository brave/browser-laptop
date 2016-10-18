/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appConfig = require('./constants/appConfig')
const Immutable = require('immutable')
const settings = require('./constants/settings')
const {passwordManagers, defaultPasswordManager, extensionIds, displayNames} = require('./constants/passwordManagers')
const bookmarksToolbarMode = require('../app/common/constants/bookmarksToolbarMode')

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

const bookmarksBarDefault = (settingKey, settingsCollection) => {
  const faviconsOnly = resolveValue(settings.SHOW_BOOKMARKS_TOOLBAR_ONLY_FAVICON, settingsCollection) === true
  if (faviconsOnly) return bookmarksToolbarMode.FAVICONS_ONLY

  const favicons = resolveValue(settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON, settingsCollection) === true
  if (favicons) return bookmarksToolbarMode.TEXT_AND_FAVICONS

  return bookmarksToolbarMode.TEXT_ONLY
}

// Retrofit a new setting based on old values; we don't want to lose existing user settings.
const getDefaultSetting = (settingKey, settingsCollection) => {
  switch (settingKey) {
    case settings.ACTIVE_PASSWORD_MANAGER:
      return passwordManagerDefault(settingKey, settingsCollection)
    case settings.BOOKMARKS_TOOLBAR_MODE:
      return bookmarksBarDefault(settingKey, settingsCollection)
  }
  return undefined
}

const resolveValue = (settingKey, settingsCollection) => {
  const appSettings = (process.type === 'browser'
      ? require('./stores/appStore').getState().get('settings')
      : require('./stores/appStoreRenderer').state.get('settings')) || Immutable.Map()
  if (settingsCollection && settingsCollection.constructor === Immutable.Map) {
    return settingsCollection.get(settingKey) !== undefined ? settingsCollection.get(settingKey) : appConfig.defaultSettings[settingKey]
  }
  if (settingsCollection) {
    return settingsCollection[settingKey] !== undefined ? settingsCollection[settingKey] : appConfig.defaultSettings[settingKey]
  }
  return appSettings.get(settingKey) !== undefined ? appSettings.get(settingKey) : appConfig.defaultSettings[settingKey]
}

module.exports.getSetting = (settingKey, settingsCollection) => {
  const setting = resolveValue(settingKey, settingsCollection)
  if (setting) return setting
  return getDefaultSetting(settingKey, settingsCollection)
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
