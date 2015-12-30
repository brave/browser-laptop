/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain
const app = electron.app
const Menu = require('./menu')
const Updater = require('./updater')
const messages = require('../js/constants/messages')
const AppActions = require('../js/actions/appActions')
require('../js/stores/appStore')

// Report crashes
electron.crashReporter.start()

app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('ready', function () {
  AppActions.newWindow()

  ipcMain.on(messages.QUIT_APPLICATION, () => {
    app.quit()
  })

  ipcMain.on(messages.CONTEXT_MENU_OPENED, (e, nodeName) => {
    BrowserWindow.getFocusedWindow().webContents.send(messages.CONTEXT_MENU_OPENED, nodeName)
  })

  Menu.init()

  ipcMain.on(messages.UPDATE_REQUESTED, () => {
    Updater.update()
  })

  // this only works on prod
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    Updater.init(process.platform)

    // this is fired by a menu entry
    process.on(messages.CHECK_FOR_UPDATE, () => Updater.checkForUpdate())
  } else {
    process.on(messages.CHECK_FOR_UPDATE, () => Updater.fakeCheckForUpdate())
  }
})
