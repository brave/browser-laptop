const ipcRenderer = require('electron').ipcRenderer
const locale = require('../app/locale')

exports.translation = (token) => {
  if (ipcRenderer) {
    // If in the renderer process - ask for translation from main process
    return ipcRenderer.sendSync('translation', token)
  } else {
    // Otherwise retrieve translation directly
    return locale.translation(token)
  }
}
