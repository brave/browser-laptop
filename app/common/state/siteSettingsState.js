const appConfig = require('../../../js/constants/appConfig')
const siteSettings = require('../../../js/state/siteSettings')

const siteSettingsState = {
  getAllSiteSettings: (state, frame) => {
    if (frame && frame.get('isPrivate')) {
      return state.get('siteSettings').mergeDeep(state.get('temporarySiteSettings'))
    }
    return state.get('siteSettings')
  },

  isNoScriptEnabled (state, settings) {
    return siteSettings.activeSettings(settings, state, appConfig).noScript === true
  }
}

module.exports = siteSettingsState
