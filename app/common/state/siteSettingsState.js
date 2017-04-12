const appConfig = require('../../../js/constants/appConfig')
const siteSettings = require('../../../js/state/siteSettings')

module.exports.isNoScriptEnabled = (settings, state) => {
  return siteSettings.activeSettings(settings, state, appConfig).noScript === true
}
