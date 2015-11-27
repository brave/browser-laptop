var AppDispatcher = require('../dispatcher/appDispatcher')
var AppConstants = require('../constants/appConstants')

const AppActions = {
  loadUrl: function (loc) {
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
