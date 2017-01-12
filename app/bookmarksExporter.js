/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'strict mode'

const electron = require('electron')
const dialog = electron.dialog
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const moment = require('moment')
const getSetting = require('../js/settings').getSetting
const settings = require('../js/constants/settings')

module.exports.dialog = () => {
  const focusedWindow = BrowserWindow.getFocusedWindow()
  const fileName = moment().format('DD_MM_YYYY') + '.html'
  const defaultPath = path.join(getSetting(settings.DEFAULT_DOWNLOAD_SAVE_PATH) || app.getPath('downloads'), fileName)

  dialog.showSaveDialog(focusedWindow, {
    defaultPath: defaultPath,
    filters: [{
      name: 'HTML',
      extensions: ['html']
    }]
  }, (filePath) => {
    if (filePath) {
      console.log(filePath)
    }
  })
}
