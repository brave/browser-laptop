const fakeSettings = {
  getSetting: function (settingKey, settingsCollection) {
    if (typeof fakeSettings.mockReturnValue === 'boolean') {
      return fakeSettings.mockReturnValue
    } else {
      return true
    }
  },
  mockReturnValue: undefined
}

module.exports = fakeSettings
