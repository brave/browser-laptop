const electron = require('electron')
const appActions = require('./actions/appActions')

module.exports = function (name) {
  if (name === 'electron') {
    return electron
  } else if (name === 'appActions') {
    return appActions
  } else if (name === 'immutable') {
    return require('immutable')
  } else if (name === 'currentWindow') {
    return electron.remote.BrowserWindow.getActiveWindow()
  } else if (name === 'allWindows') {
    return electron.remote.BrowserWindow.getAllWindows()
  }
}
