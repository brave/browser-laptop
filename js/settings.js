/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appConfig = require('./constants/appConfig')
const Immutable = require('immutable')
const settings = require('./constants/settings')
const {passwordManagers, extensionIds, displayNames} = require('./constants/passwordManagers')

// Retrofit the new single setting; we don't want to erase values set by the user.
const passwordManagerDefault = (settingKey, settingsCollection) => {
  const onePasswordEnabled = resolveValue(settings.ONE_PASSWORD_ENABLED, settingsCollection) === true
  if (onePasswordEnabled) { return passwordManagers.ONE_PASSWORD }

  const dashlaneEnabled = resolveValue(settings.DASHLANE_ENABLED, settingsCollection) === true
  if (dashlaneEnabled) { return passwordManagers.DASHLANE }

  const lastPassEnabled = resolveValue(settings.LAST_PASS_ENABLED, settingsCollection) === true
  if (lastPassEnabled) { return passwordManagers.LAST_PASS }

  // default to Built-In
  return passwordManagers.BUILT_IN
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
  if (settingKey === settings.ACTIVE_PASSWORD_MANAGER) {
    const currentValue = resolveValue(settingKey, settingsCollection)
    return !currentValue
      ? passwordManagerDefault(settingKey, settingsCollection)
      : currentValue
  }
  return resolveValue(settingKey, settingsCollection)
}

module.exports.getActivePasswordManager = (settingsCollection) => {
  const passwordManager = resolveValue(settings.ACTIVE_PASSWORD_MANAGER, settingsCollection)

  let details = {
    name: passwordManager,
    extensionId: extensionIds[passwordManager],
    displayName: displayNames[passwordManager]
  }

  if (passwordManager === passwordManagers.LAST_PASS) {
    details.popupWidth = 350
    details.popupHeight = 448
  }

  return Immutable.fromJS(details)
}
