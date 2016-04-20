const electron = require('electron')
const app = require('electron').app
const dialog = electron.dialog
const Channel = require('./channel')
const path = require('path')

module.exports.showAbout = function () {
  // The timeout is in case there's a call just after the modal to hide the menu.
  // showMessageBox is a modal and blocks everything otherwise, so menu would remain open
  // while the dialog is displayed.
  setTimeout(() => {
    dialog.showMessageBox({
      title: 'Brave',
      message: `Brave: ${app.getVersion()}
Electron: ${process.versions['atom-shell']}
libchromiumcontent: ${process.versions['chrome']}
V8: ${process.versions.v8}
Node.js: ${process.versions.node}
Update channel: ${Channel.channel()}

This software uses libraries from the FFmpeg project under the LGPLv2.1`,
      icon: path.join(__dirname, '..', 'app', 'extensions', 'brave', 'img', 'braveAbout.png'),
      buttons: ['Ok']
    })
  }, 50)
}
