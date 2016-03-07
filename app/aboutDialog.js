const electron = require('electron')
const app = require('electron').app
const dialog = electron.dialog
const Channel = require('./channel')
const path = require('path')

module.exports.showAbout = function () {
  dialog.showMessageBox({
    title: 'Brave',
    message: 'Version: ' + app.getVersion() + '\n' +
      'Electron: ' + process.versions['atom-shell'] + '\n' +
      'libchromiumcontent: ' + process.versions['chrome'] + '\n' +
      'Channel: ' + Channel.channel(),
    icon: path.join(__dirname, '..', 'app', 'img', 'braveAbout.png'),
    buttons: ['Ok']
  })
}
