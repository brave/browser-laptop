/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

 // windows installation events etc...
if (process.platform === 'win32') {
  // TODO - register browser as HTTP handler in Windows (maybe need to fork)
  if (require('electron-squirrel-startup')) {
    process.exit(0)
  }
}

const Immutable = require('immutable')
const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain
const app = electron.app
const Menu = require('./menu')
const Updater = require('./updater')
const messages = require('../js/constants/messages')
const AppActions = require('../js/actions/appActions')
const SessionStore = require('./sessionStore')
const AppStore = require('../js/stores/appStore')
const CrashHerald = require('./crash-herald')
const PackageLoader = require('./package-loader')
const Filtering = require('./filtering')
const TrackingProtection = require('./trackingProtection')
const AdBlock = require('./adBlock')
const HttpsEverywhere = require('./httpsEverywhere')
const SiteHacks = require('./siteHacks')
const CmdLine = require('./cmdLine')

let loadAppStatePromise = SessionStore.loadAppState().catch(() => {
  return SessionStore.defaultAppState()
})

// Used to collect the per window state when shutting down the application
let perWindowState = []
let sessionStateStoreAttempted = false

const saveIfAllCollected = () => {
  if (perWindowState.length === BrowserWindow.getAllWindows().length) {
    const appState = AppStore.getState().toJS()
    appState.perWindowState = perWindowState
    const ignoreCatch = () => {}

    if (process.env.NODE_ENV !== 'test') {
      SessionStore.saveAppState(appState).catch(ignoreCatch).then(() => {
        sessionStateStoreAttempted = true
        app.quit()
      })
    } else {
      sessionStateStoreAttempted = true
      app.quit()
    }
  }
}

app.on('ready', function () {
  app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      setTimeout(app.quit, 0)
    }
  })

  app.on('activate', function () {
    // (OS X) open a new window when the user clicks on the app icon if there aren't any open
    if (BrowserWindow.getAllWindows().length === 0) {
      AppActions.newWindow()
    }
  })

  app.on('before-quit', function (e) {
    if (sessionStateStoreAttempted || BrowserWindow.getAllWindows().length === 0) {
      saveIfAllCollected()
      return
    }

    e.preventDefault()
    BrowserWindow.getAllWindows().forEach(win => win.webContents.send(messages.REQUEST_WINDOW_STATE))
  })

  ipcMain.on(messages.RESPONSE_WINDOW_STATE, (wnd, data) => {
    if (data) {
      perWindowState.push(data)
    }
    saveIfAllCollected()
  })

  loadAppStatePromise.then(initialState => {
    // For tests we always want to load default app state
    if (process.env.NODE_ENV === 'test') {
      initialState = SessionStore.defaultAppState()
    }

    const perWindowState = initialState.perWindowState

    delete initialState.perWindowState
    AppActions.setState(Immutable.fromJS(initialState))
    return perWindowState
  }).then(perWindowState => {
    if (!perWindowState || perWindowState.length === 0) {
      if (!CmdLine.newWindowURL) {
        AppActions.newWindow()
      }
    } else {
      perWindowState.forEach(wndState => {
        AppActions.newWindow(undefined, undefined, wndState)
      })
    }
    process.emit(messages.APP_INITIALIZED)

    if (CmdLine.newWindowURL) {
      AppActions.newWindow(Immutable.fromJS({
        location: CmdLine.newWindowURL
      }))
    }

    ipcMain.on(messages.QUIT_APPLICATION, () => {
      app.quit()
    })

    ipcMain.on(messages.UPDATE_APP_MENU, (e, args) => {
      Menu.init(args)
    })

    ipcMain.on(messages.CONTEXT_MENU_OPENED, (e, nodeName) => {
      BrowserWindow.getFocusedWindow().webContents.send(messages.CONTEXT_MENU_OPENED, nodeName)
    })
    ipcMain.on(messages.STOP_LOAD, () => {
      BrowserWindow.getFocusedWindow().webContents.send(messages.STOP_LOAD)
    })
    ipcMain.on(messages.GO_BACK, () => {
      BrowserWindow.getFocusedWindow().webContents.send(messages.GO_BACK)
    })
    ipcMain.on(messages.GO_FORWARD, () => {
      BrowserWindow.getFocusedWindow().webContents.send(messages.GO_FORWARD)
    })

    // Load HTTPS Everywhere browser "extension"
    HttpsEverywhere.init()

    Filtering.init()
    TrackingProtection.init()
    AdBlock.init()
    SiteHacks.init()

    ipcMain.on(messages.UPDATE_REQUESTED, () => {
      Updater.update()
    })

    // Setup the crash handling
    CrashHerald.init()

    // This loads package.json into an object
    PackageLoader.load((err, pack) => {
      Menu.init({
        version: pack.version
      })

      if (err) throw new Error('package.json could not be accessed')

      // Setup the auto updater, check the env variable first because it's
      // used to cehck the update channel before releases.
      Updater.init(process.platform, process.env.BRAVE_UPDATE_VERSION || pack.version)

      // This is fired by a menu entry (for now - will be scheduled)
      process.on(messages.CHECK_FOR_UPDATE, () => Updater.checkForUpdate(true))

      // This is fired from a auto-update metadata call
      process.on(messages.UPDATE_META_DATA_RETRIEVED, (metadata) => {
        console.log(metadata)
      })
    })
  })
})
