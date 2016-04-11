/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const electron = require('electron')
const app = electron.app
const messages = require('../js/constants/messages')
const BrowserWindow = electron.BrowserWindow
const appActions = require('../js/actions/appActions')
let appInitialized = false

const focusOrOpenWindow = function (url) {
  // don't try to do anything if the app hasn't been initialized
  if (!appInitialized) {
    return false
  }

  let win = BrowserWindow.getFocusedWindow()
  if (!win) {
    win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) {
        win.restore()
      }
      win.focus()
    }
  }

  if (!win) {
    appActions.newWindow(Immutable.fromJS({
      location: url
    }))
  } else if (url) {
    win.webContents.send(messages.SHORTCUT_NEW_FRAME, url)
  }

  return true
}

if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
  const appAlreadyStartedShouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    focusOrOpenWindow()
  })
  if (appAlreadyStartedShouldQuit) {
    app.exit(0)
  }
}

app.on('will-finish-launching', () => {
  app.on('activate', () => {
    // (OS X) open a new window when the user clicks on the app icon if there aren't any open
    focusOrOpenWindow()
  })

  // User clicked a link when w were the default or via command line like:
  // open -a Brave http://www.brave.com
  app.on('open-url', (event, path) => {
    event.preventDefault()

    if (!focusOrOpenWindow(path)) {
      module.exports.newWindowURL = path
    }
  })
})

process.on(messages.APP_INITIALIZED, () => { appInitialized = true })
