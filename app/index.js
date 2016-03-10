/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

if (process.platform === 'win32') {
  require('./windowsInit')
}

const Immutable = require('immutable')
const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain
const app = electron.app
const Menu = require('./menu')
const Updater = require('./updater')
const messages = require('../js/constants/messages')
const appActions = require('../js/actions/appActions')
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
const UpdateStatus = require('../js/constants/updateStatus')
const showAbout = require('./aboutDialog').showAbout
const urlParse = require('url').parse

let loadAppStatePromise = SessionStore.loadAppState().catch(() => {
  return SessionStore.defaultAppState()
})

// Used to collect the per window state when shutting down the application
let perWindowState = []
let sessionStateStoreAttempted = false
let lastWindowState

// URLs to accept bad certs for.
let acceptCertUrls = {}
// URLs to callback for auth.
let authCallbacks = {}

const saveIfAllCollected = () => {
  // If we're shutting down early and can't access the state, it's better
  // to not try to save anything at all and just quit.
  if (!AppStore.getState()) {
    app.exit(0)
  }
  if (perWindowState.length === BrowserWindow.getAllWindows().length) {
    const appState = AppStore.getState().toJS()
    appState.perWindowState = perWindowState
    if (perWindowState.length === 0 && lastWindowState) {
      appState.perWindowState.push(lastWindowState)
    }
    const ignoreCatch = () => {}

    // If the status is still UPDATE_AVAILABLE then the user wants to quit
    // and not restart
    if (appState.updates && (appState.updates.status === UpdateStatus.UPDATE_AVAILABLE ||
        appState.updates.status === UpdateStatus.UPDATE_AVAILABLE_DEFERRED)) {
      // In this case on win32, the process doesn't try to auto restart, so avoid the user
      // having to open the app twice.  Maybe squirrel detects the app is already shutting down.
      if (process.platform === 'win32') {
        appState.updates.status = UpdateStatus.UPDATE_APPLYING_RESTART
      } else {
        appState.updates.status = UpdateStatus.UPDATE_APPLYING_NO_RESTART
      }
    }

    SessionStore.saveAppState(appState).catch(ignoreCatch).then(() => {
      sessionStateStoreAttempted = true
      // If there's an update to apply, then do it here.
      // Otherwise just quit.
      if (appState.updates && (appState.updates.status === UpdateStatus.UPDATE_APPLYING_NO_RESTART ||
          appState.updates.status === UpdateStatus.UPDATE_APPLYING_RESTART)) {
        Updater.quitAndInstall()
      } else {
        app.quit()
      }
    })
  }
}

app.on('ready', function () {
  app.on('certificate-error', function (e, webContents, url, error, cert, cb) {
    if (acceptCertUrls[url] === true) {
      // Ignore the cert error
      e.preventDefault()
      cb(true)
      return
    }
    // Tell the page to show an unlocked icon. Note this is sent to the main
    // window webcontents, not the webview webcontents
    BrowserWindow.getAllWindows().map((win) => {
      win.webContents.send(messages.CERT_ERROR, {
        url,
        error,
        cert
      })
    })
  })
  app.on('login', function (e, webContents, request, authInfo, cb) {
    e.preventDefault()
    authCallbacks[request.url] = cb
    BrowserWindow.getAllWindows().map((win) => {
      win.webContents.send(messages.LOGIN_REQUIRED, {
        url: request.url,
        authInfo
      })
    })
  })
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
      appActions.newWindow()
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

  ipcMain.on(messages.LAST_WINDOW_STATE, (wnd, data) => {
    if (data) {
      lastWindowState = data
    }
  })
  ipcMain.on(messages.LOGIN_RESPONSE, (e, url, username, password) => {
    if (username || password) {
      // Having 2 of the same tab URLs open right now, where both require auth
      // can cause an error / alert here.  Ignore it for now.
      try {
        if (authCallbacks[url]) {
          authCallbacks[url](username, password)
        }
      } catch (e) {
        console.error(e)
      }
    }
    delete authCallbacks[url]
  })
  process.on(messages.UNDO_CLOSED_WINDOW, () => {
    if (lastWindowState) {
      appActions.newWindow(undefined, undefined, lastWindowState)
      lastWindowState = undefined
    }
  })

  loadAppStatePromise.then(initialState => {
    // For tests we always want to load default app state
    const perWindowState = initialState.perWindowState
    delete initialState.perWindowState
    appActions.setState(Immutable.fromJS(initialState))
    return perWindowState
  }).then(perWindowState => {
    if (!perWindowState || perWindowState.length === 0) {
      if (!CmdLine.newWindowURL) {
        appActions.newWindow()
      }
    } else {
      perWindowState.forEach(wndState => {
        appActions.newWindow(undefined, undefined, wndState)
      })
    }
    process.emit(messages.APP_INITIALIZED)

    if (CmdLine.newWindowURL) {
      appActions.newWindow(Immutable.fromJS({
        location: CmdLine.newWindowURL
      }))
    }

    ipcMain.on(messages.QUIT_APPLICATION, () => {
      app.quit()
    })

    ipcMain.on(messages.UPDATE_APP_MENU, (e, args) => {
      Menu.init(AppStore.getState().get('settings'), args)
    })

    ipcMain.on(messages.CHANGE_SETTING, (e, key, value) => {
      appActions.changeSetting(key, value)
    })

    ipcMain.on(messages.MOVE_SITE, (e, sourceDetail, destinationDetail, prepend, destinationIsParent) => {
      appActions.moveSite(Immutable.fromJS(sourceDetail), Immutable.fromJS(destinationDetail), prepend, destinationIsParent)
    })

    ipcMain.on(messages.CERT_ERROR_ACCEPTED, (event, url) => {
      acceptCertUrls[url] = true
      BrowserWindow.getFocusedWindow().webContents.send(messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL, url)
    })

    ipcMain.on(messages.CHECK_CERT_ERROR_ACCEPTED, (event, host, frameKey) => {
      // If the host is associated with a URL with a cert error, update the
      // security state to insecure
      if (Object.keys(acceptCertUrls).map(url => { return urlParse(url).host }).includes(host)) {
        BrowserWindow.getFocusedWindow().webContents.send(messages.SET_SECURITY_STATE, frameKey, {
          secure: false
        })
      }
    })

    ipcMain.on(messages.CERT_ERROR_REJECTED, (event, previousLocation, frameKey) => {
      BrowserWindow.getFocusedWindow().webContents.send(messages.CERT_ERROR_REJECTED, previousLocation, frameKey)
    })

    AppStore.addChangeListener(() => {
      Menu.init(AppStore.getState().get('settings'))
    })

    Filtering.init()
    HttpsEverywhere.init()
    TrackingProtection.init()
    AdBlock.init()
    SiteHacks.init()

    ipcMain.on(messages.UPDATE_REQUESTED, () => {
      Updater.updateNowRequested()
    })

    // Setup the crash handling
    CrashHerald.init()

    // This loads package.json into an object
    // TODO: Seems like this can be done with app.getVersion() insteand?
    PackageLoader.load((err, pack) => {
      if (err) throw new Error('package.json could not be accessed')

      // Setup the auto updater, check the env variable first because it's
      // used to check the update channel before releases.
      Updater.init(process.platform, process.env.BRAVE_UPDATE_VERSION || pack.version)

      // This is fired by a menu entry (for now - will be scheduled)
      process.on(messages.CHECK_FOR_UPDATE, () => Updater.checkForUpdate(true))
      ipcMain.on(messages.CHECK_FOR_UPDATE, () => Updater.checkForUpdate(true))

      process.on(messages.SHOW_ABOUT, showAbout)
      ipcMain.on(messages.SHOW_ABOUT, showAbout)

      // This is fired from a auto-update metadata call
      process.on(messages.UPDATE_META_DATA_RETRIEVED, (metadata) => {
        console.log(metadata)
      })
    })
  })
})
