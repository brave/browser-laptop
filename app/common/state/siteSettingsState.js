const appConfig = require('../../../js/constants/appConfig')
const siteSettings = require('../../../js/state/siteSettings')

const api = {
  getAllSiteSettings: (state, isPrivate) => {
    if (isPrivate) {
      return state.get('siteSettings').mergeDeep(state.get('temporarySiteSettings'))
    }
    return state.get('siteSettings')
  },

  isNoScriptEnabled (state, isPrivate) {
    const settings = api.getAllSiteSettings(state, isPrivate)
    return siteSettings.activeSettings(settings, state, appConfig).noScript === true
  }
}

module.exports = api
