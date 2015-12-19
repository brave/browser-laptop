/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const electron = require('electron')
const ipcMain = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = require('./menu')
const LocalShortcuts = require('./localShortcuts')
const Updater = require('./updater')
const messages = require('../js/constants/messages')

// Report crashes
electron.crashReporter.start()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windows = []

app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const spawnWindow = () => {
  let mainWindow = new BrowserWindow({
    width: 1360,
    height: 800,
    minWidth: 400
    // Neither a frame nor a titlebar
    // frame: false,
    // A frame but no title bar and windows buttons in titlebar 10.10 OSX and up only?
    // 'title-bar-style': 'hidden'
  })
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('file://' + __dirname + '/index-dev.html')
  } else {
    mainWindow.loadURL('file://' + __dirname + '/index.html')
  }
  mainWindow.on('closed', function () {
    LocalShortcuts.unregister(mainWindow)

    var index = windows.indexOf(mainWindow)
    if (index > -1) {
      windows.splice(index, 1)
    }
  })

  LocalShortcuts.register(mainWindow)
  return mainWindow
}

app.on('ready', function () {
  windows.push(spawnWindow())

  ipcMain.on(messages.QUIT_APPLICATION, () => {
    app.quit()
  })

  ipcMain.on(messages.CONTEXT_MENU_OPENED, (e, nodeName) => {
    BrowserWindow.getFocusedWindow().webContents.send(messages.CONTEXT_MENU_OPENED, nodeName)
  })

  ipcMain.on(messages.NEW_WINDOW, () => windows.push(spawnWindow()))
  process.on(messages.NEW_WINDOW, () => windows.push(spawnWindow()))

  ipcMain.on(messages.CLOSE_WINDOW, () => BrowserWindow.getFocusedWindow().close())
  process.on(messages.CLOSE_WINDOW, () => BrowserWindow.getFocusedWindow().close())

  Menu.init()

  ipcMain.on(messages.UPDATE_REQUESTED, () => {
    Updater.update()
  })

  // this only works on prod
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    Updater.init(process.platform)

    // this is fired by the menu entry
    process.on(messages.CHECK_FOR_UPDATE, () => Updater.checkForUpdate())
  } else {
    process.on(messages.CHECK_FOR_UPDATE, () => Updater.fakeCheckForUpdate())
  }
})
