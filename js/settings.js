const appConfig = require('./constants/appConfig')
const Immutable = require('immutable')

module.exports.getSetting = (settingsCollection, settingKey) => {
  if (settingsCollection.constructor === Immutable.Map) {
    return settingsCollection.get(settingKey) !== undefined ? settingsCollection.get(settingKey) : appConfig.defaultSettings[settingKey]
  } else {
    return settingsCollection[settingKey] !== undefined ? settingsCollection[settingKey] : appConfig.defaultSettings[settingKey]
  }
}
