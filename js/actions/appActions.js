var AppDispatcher = require('../dispatcher/appDispatcher')
var AppConstants = require('../constants/appconstants')

const AppActions = {
  loadUrl: function (loc) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_URL,
      location: loc
    })
  },

  setNavBarInput: function(loc) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_NAVBAR_INPUT,
      location: loc
    })
  }
}

module.exports = AppActions
