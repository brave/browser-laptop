const electron = require('electron')
const appActions = require('./actions/appActions')

module.exports = function (name) {
  if (name === 'electron') {
    return electron
  } else if (name === 'appActions') {
    return appActions
  } else if (name === 'immutable') {
    return require('immutable')
  }
}
