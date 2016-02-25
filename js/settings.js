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
