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
const urlParse = require('url').parse
const { navigatableTypes } = require('../js/lib/appUrlUtil')
const isDarwin = process.platform === 'darwin'
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

// Checks an array of arguments if it can find a url
const getUrlFromCommandLine = (argv) => {
  if (argv) {
    if (argv.length === 2 && !argv[1].startsWith('-')) {
      const parsedUrl = urlParse(argv[1])
      if (navigatableTypes.includes(parsedUrl.protocol)) {
        return argv[1]
      }
    }
    const index = argv.indexOf('--')
    if (index !== -1 && index + 1 < argv.length && !argv[index + 1].startsWith('-')) {
      const parsedUrl = urlParse(argv[index + 1])
      if (navigatableTypes.includes(parsedUrl.protocol)) {
        return argv[index + 1]
      }
    }
  }
  return undefined
}

// For macOS, there are events like open-url instead
if (!isDarwin) {
  const openUrl = getUrlFromCommandLine(process.argv)
  if (openUrl) {
    const parsedUrl = urlParse(openUrl)
    if (navigatableTypes.includes(parsedUrl.protocol)) {
      module.exports.newWindowURL = openUrl
    }
  }
}

app.on('ready', () => {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    const appAlreadyStartedShouldQuit = app.makeSingleInstance((argv, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (isDarwin) {
        focusOrOpenWindow()
      } else {
        focusOrOpenWindow(getUrlFromCommandLine(argv))
      }
    })
    if (appAlreadyStartedShouldQuit) {
      app.exit(0)
    }
  }
})

app.on('will-finish-launching', () => {
  app.on('activate', () => {
    // (macOS) open a new window when the user clicks on the app icon if there aren't any open
    focusOrOpenWindow()
  })

  // User clicked a link when w were the default or via command line like:
  // open -a Brave http://www.brave.com
  app.on('open-url', (event, path) => {
    event.preventDefault()
    const parsedUrl = urlParse(path)
    if (navigatableTypes.includes(parsedUrl.protocol)) {
      if (!focusOrOpenWindow(path)) {
        module.exports.newWindowURL = path
      }
    }
  })

  // User clicked on a file or dragged a file to the dock on macOS
  app.on('open-file', (event, path) => {
    event.preventDefault()

    if (!focusOrOpenWindow(path)) {
      module.exports.newWindowURL = path
    }
  })
})

process.on(messages.APP_INITIALIZED, () => { appInitialized = true })
