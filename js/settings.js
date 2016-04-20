/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appConfig = require('./constants/appConfig')
const Immutable = require('immutable')

module.exports.getSetting = (settingKey, settingsCollection) => {
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
