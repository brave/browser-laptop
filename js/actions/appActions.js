var AppDispatcher = require('../dispatcher/appDispatcher')
var AppConstants = require('../constants/appconstants')

const AppActions = {
  increment: function (text) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_INCREMENT,
      text: 'Incrementing it!'
    })
  },

  decrement: function (id, text) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_DECREMENT,
      id: id,
      text: 'Decrementing it!'
    })
  }
}

module.exports = AppActions
