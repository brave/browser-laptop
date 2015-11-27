const AppDispatcher = require('../dispatcher/appDispatcher')
const AppConstants = require('../constants/appConstants')
const UrlUtil = require('./../../node_modules/urlutil.js/dist/node-urlutil.js')

const AppActions = {
  loadUrl: function (loc) {
    if (UrlUtil.isURL(loc)) {
      loc = UrlUtil.getUrlFromInput(loc)
    }
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_URL,
      location: loc
    })
  },

  setNavBarInput: function (loc) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_NAVBAR_INPUT,
      location: loc
    })
  },

  newFrame: function (frameOpts = {}, openInForeground = true) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_NEW_FRAME,
      frameOpts: frameOpts,
      openInForeground
    })
  }
}

module.exports = AppActions
