/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')
const app = electron.app
const messages = require('../js/constants/messages')
const appActions = require('../js/actions/appActions')
const urlParse = require('./common/urlParse')
const {fileUrl} = require('../js/lib/appUrlUtil')
const sessionStore = require('./sessionStore')
const fs = require('fs')
const path = require('path')

const isDarwin = process.platform === 'darwin'
const debugTabEventsFlagName = '--debug-tab-events'

let appInitialized = false
let newWindowURL
const debugWindowEventsFlagName = '--debug-window-events'
const disableBufferWindowFlagName = '--disable-buffer-window'
const disableDeferredWindowLoadFlagName = '--show-windows-immediately'
const debugStoreActionsFlagName = '--debug-store-actions'

const focusOrOpenWindow = function (url) {
  // don't try to do anything if the app hasn't been initialized
  if (!appInitialized) {
    return false
  }
  // create a tab and focus the tab's window
  if (url) {
    const tabCreateProperties = {
      url,
      fromCmdLine: true
    }
    // request to create tab in a new or existing window, and focus the window
    appActions.createTabRequested(tabCreateProperties, false, false, true)
    return true
  }
  // focus the active window, or create a new one with default tabs
  appActions.focusOrCreateWindow()
  return true
}

// Checks an array of arguments if it can find a url
const getUrlFromCommandLine = (argv) => {
  if (argv) {
    if (argv.length === 2 && !argv[1].startsWith('-')) {
      const parsedUrl = urlParse(argv[1])
      if (sessionStore.isProtocolHandled(parsedUrl.protocol)) {
        return argv[1]
      }
      const filePath = path.resolve(argv[1])
      if (fs.existsSync(filePath)) {
        return fileUrl(filePath)
      }
    }
    const index = argv.indexOf('--')
    if (index !== -1 && index + 1 < argv.length && !argv[index + 1].startsWith('-')) {
      const parsedUrl = urlParse(argv[index + 1])
      if (sessionStore.isProtocolHandled(parsedUrl.protocol)) {
        return argv[index + 1]
      }
      const filePath = path.resolve(argv[index + 1])
      if (fs.existsSync(filePath)) {
        return fileUrl(filePath)
      }
    }
  }
  return undefined
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
    if (!appInitialized) {
      newWindowURL = path
    } else {
      const parsedUrl = urlParse(path)
      if (sessionStore.isProtocolHandled(parsedUrl.protocol)) {
        focusOrOpenWindow(path)
      }
    }
  })

  // User clicked on a file or dragged a file to the dock on macOS
  app.on('open-file', (event, path) => {
    event.preventDefault()
    path = encodeURI(path)
    if (!focusOrOpenWindow(path)) {
      newWindowURL = path
    }
  })
})

process.on(messages.APP_INITIALIZED, () => { appInitialized = true })

const api = module.exports = {
  newWindowURL () {
    const openUrl = newWindowURL || getUrlFromCommandLine(process.argv)
    if (openUrl) {
      const parsedUrl = urlParse(openUrl)
      if (sessionStore.isProtocolHandled(parsedUrl.protocol)) {
        newWindowURL = openUrl
      }
    }
    return newWindowURL
  },

  getValueForKey (key, args = process.argv) {
    // TODO: support --blah=bloop as well as the currently supported --blah bloop
    //       and also boolean values inferred by key existance or 'no-' prefix
    //       similar to https://github.com/substack/minimist/blob/master/index.js#97
    const keyArgIndex = args.findIndex(arg => arg === key)
    const valueIndex = keyArgIndex + 1
    if (keyArgIndex !== -1 && args.length > valueIndex) {
      return args[valueIndex]
    }
    return null
  },

  getFirstRunPromoCode (args = process.argv) {
    const installerPath = api.getValueForKey('--squirrel-installer-path', args)
    if (!installerPath || typeof installerPath !== 'string') {
      return null
    }

    // parse promo code from installer path
    // first, get filename
    const fileName = path.win32.parse(installerPath).name
    const promoCodeFilenameRegex = /-(([a-zA-Z\d]{3}\d{3})|([a-zA-Z]{1,}-[a-zA-Z]{1,}))\s?(?:\(\d+\))?$/g
    const matches = promoCodeFilenameRegex.exec(fileName)
    if (matches && matches.length > 1) {
      return matches[1]
    }
    return null
  },

  shouldDebugTabEvents: process.argv.includes(debugTabEventsFlagName),
  shouldDebugWindowEvents: process.argv.includes(debugWindowEventsFlagName),
  disableBufferWindow: process.env.NODE_ENV === 'test' || process.argv.includes(disableBufferWindowFlagName),
  disableDeferredWindowLoad: process.argv.includes(disableDeferredWindowLoadFlagName),
  shouldDebugStoreActions: process.argv.includes(debugStoreActionsFlagName)
}
