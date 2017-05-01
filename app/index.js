// @flow
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

let ready = false

// Setup the crash handling
const CrashHerald = require('./crash-herald')
const telemetry = require('./telemetry')

// set initial base line checkpoint
telemetry.setCheckpoint('init')

const handleUncaughtError = (error) => {
  var message, ref, stack
  stack = (ref = error.stack) != null ? ref : error.name + ': ' + error.message
  message = 'Uncaught Exception:\n' + stack
  console.error('An uncaught exception occurred in the main process ' + message)

  // TODO(bridiver) - this should also send a notification to Brave

  if (!ready) {
    console.error('Waiting 60 seconds for process to load')
    setTimeout(() => {
      if (!ready) {
        console.error('Process failed to load within 60 seconds')
        process.exit(1)
      }
    }, 60 * 1000)
  }
}
process.on('uncaughtException', function (error) {
  handleUncaughtError(error)
})

process.on('unhandledRejection', function (error, promise) {
  handleUncaughtError(error)
})

process.on('warning', warning => console.warn(warning.stack))

if (process.platform === 'win32') {
  require('./windowsInit')
}

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain
const Immutable = require('immutable')
const Updater = require('./updater')
const Importer = require('./importer')
const messages = require('../js/constants/messages')
const appConfig = require('../js/constants/appConfig')
const appActions = require('../js/actions/appActions')
const SessionStore = require('./sessionStore')
const AppStore = require('../js/stores/appStore')
const PackageLoader = require('./package-loader')
const Autofill = require('./autofill')
const Extensions = require('./extensions')
const TrackingProtection = require('./trackingProtection')
const AdBlock = require('./adBlock')
const AdInsertion = require('./browser/ads/adInsertion')
const HttpsEverywhere = require('./httpsEverywhere')
const SiteHacks = require('./siteHacks')
const CmdLine = require('./cmdLine')
const UpdateStatus = require('../js/constants/updateStatus')
const urlParse = require('./common/urlParse')
const spellCheck = require('./spellCheck')
const locale = require('./locale')
const contentSettings = require('../js/state/contentSettings')
const privacy = require('../js/state/privacy')
const async = require('async')
const settings = require('../js/constants/settings')
const BookmarksExporter = require('./browser/bookmarksExporter')

app.commandLine.appendSwitch('enable-features', 'BlockSmallPluginContent,PreferHtmlOverPlugins')

// Used to collect the per window state when shutting down the application
let perWindowState = []
let sessionStateStoreComplete = false
let sessionStateStoreCompleteCallback = null
let requestId = 0
let shuttingDown = false
let lastWindowState
let lastWindowClosed = false

// Domains to accept bad certs for. TODO: Save the accepted cert fingerprints.
let acceptCertDomains = {}
let errorCerts = {}

const prefsRestartCallbacks = {}
const prefsRestartLastValue = {}

const defaultProtocols = ['http', 'https']

const sessionStoreQueue = async.queue((task, callback) => {
  task(callback)
}, 1)

const logSaveAppStateError = (e) => {
  console.error('Error saving app state: ', e)
}

const saveAppState = (forceSave = false) => {
  // If we're shutting down early and can't access the state, it's better
  // to not try to save anything at all and just quit.
  if (shuttingDown && !AppStore.getState()) {
    app.exit(0)
  }

  const appState = AppStore.getState().toJS()
  appState.perWindowState = perWindowState

  const receivedAllWindows = perWindowState.length === BrowserWindow.getAllWindows().length
  if (!forceSave && !receivedAllWindows) {
    return
  }

  return SessionStore.saveAppState(appState, shuttingDown).catch((e) => {
    logSaveAppStateError(e)
  }).then(() => {
    if (receivedAllWindows || forceSave) {
      sessionStateStoreComplete = true
    }

    if (sessionStateStoreComplete) {
      if (shuttingDown) {
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

        // If there's an update to apply, then do it here.
        // Otherwise just quit.
        if (appState.updates && (appState.updates.status === UpdateStatus.UPDATE_APPLYING_NO_RESTART ||
            appState.updates.status === UpdateStatus.UPDATE_APPLYING_RESTART)) {
          Updater.quitAndInstall()
        } else {
          app.quit()
        }
      } else {
        sessionStateStoreCompleteCallback()
        sessionStateStoreCompleteCallback = null
      }
    }
  })
}

/**
 * Saves the session storage for all windows
 */
const initiateSessionStateSave = () => {
  sessionStoreQueue.push((cb) => {
    sessionStateStoreComplete = false
    sessionStateStoreCompleteCallback = cb

    perWindowState.length = 0
    // quit triggered by window-all-closed should save last window state
    if (lastWindowClosed && lastWindowState) {
      perWindowState.push(lastWindowState)
    } else if (BrowserWindow.getAllWindows().length > 0) {
      ++requestId
      BrowserWindow.getAllWindows().forEach((win) => win.webContents.send(messages.REQUEST_WINDOW_STATE, requestId))
      // Just in case a window is not responsive, we don't want to wait forever.
      // In this case just save session store for the windows that we have already.
      setTimeout(() => {
        saveAppState(true)
      }, appConfig.quitTimeout)
    } else {
      saveAppState()
    }
  })
}

let loadAppStatePromise = SessionStore.loadAppState()

// Some settings must be set right away on startup, those settings should be handled here.
loadAppStatePromise.then((initialState) => {
  telemetry.setCheckpointAndReport('state-loaded')
  const {HARDWARE_ACCELERATION_ENABLED, SMOOTH_SCROLL_ENABLED, SEND_CRASH_REPORTS} = require('../js/constants/settings')
  if (initialState.settings[HARDWARE_ACCELERATION_ENABLED] === false) {
    app.disableHardwareAcceleration()
  }
  if (initialState.settings[SEND_CRASH_REPORTS] !== false) {
    console.log('Crash reporting enabled')
    CrashHerald.init()
  } else {
    console.log('Crash reporting disabled')
  }
  if (initialState.settings[SMOOTH_SCROLL_ENABLED] === false) {
    app.commandLine.appendSwitch('disable-smooth-scrolling')
  }
})

const notifyCertError = (webContents, url, error, cert) => {
  errorCerts[url] = {
    subjectName: cert.subjectName,
    issuerName: cert.issuerName,
    serialNumber: cert.serialNumber,
    validStart: cert.validStart,
    validExpiry: cert.validExpiry,
    fingerprint: cert.fingerprint
  }

  // Tell the page to show an unlocked icon. Note this is sent to the main
  // window webcontents, not the webview webcontents
  let sender = webContents.hostWebContents || webContents
  sender.send(messages.CERT_ERROR, {
    url,
    error,
    cert,
    tabId: webContents.getId()
  })
}

app.on('ready', () => {
  let sessionStateSaveInterval = null
  app.on('certificate-error', (e, webContents, url, error, cert, resourceType, overridable, strictEnforcement, expiredPreviousDecision, cb) => {
    let host = urlParse(url).host
    if (host && acceptCertDomains[host] === true) {
      // Ignore the cert error
      cb('continue')
      return
    } else {
      cb('deny')
    }

    if (resourceType !== 'mainFrame') {
      return
    }

    notifyCertError(webContents, url, error, cert)
  })

  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      lastWindowClosed = true
      app.quit()
    }
  })

  app.on('before-quit', (e) => {
    if (shuttingDown && sessionStateStoreComplete) {
      return
    }

    e.preventDefault()

    // before-quit can be triggered multiple times because of the preventDefault call
    if (shuttingDown) {
      return
    } else {
      shuttingDown = true
    }

    appActions.shuttingDown()
    clearInterval(sessionStateSaveInterval)
    initiateSessionStateSave()
  })

  app.on('network-connected', () => {
    appActions.networkConnected()
  })

  app.on('network-disconnected', () => {
    appActions.networkDisconnected()
  })

  // User initiated exit using File->Quit
  ipcMain.on(messages.RESPONSE_WINDOW_STATE, (evt, data, id) => {
    if (id !== requestId) {
      return
    }

    if (data) {
      perWindowState.push(data)
    }
    saveAppState()
  })

  ipcMain.on(messages.LAST_WINDOW_STATE, (evt, data) => {
    if (data) {
      lastWindowState = data
    }
  })

  process.on(messages.UNDO_CLOSED_WINDOW, () => {
    if (lastWindowState) {
      appActions.newWindow(undefined, undefined, lastWindowState)
      lastWindowState = undefined
    }
  })

  loadAppStatePromise.then((initialState) => {
    // Do this after loading the state
    // For tests we always want to load default app state
    const loadedPerWindowState = initialState.perWindowState
    delete initialState.perWindowState
    appActions.setState(Immutable.fromJS(initialState))
    setImmediate(() => perWindowStateLoaded(loadedPerWindowState))
  })

  const perWindowStateLoaded = (loadedPerWindowState) => {
    // TODO(bridiver) - this shold be refactored into reducers
    // DO NOT ADD ANYHING TO THIS LIST
    // See tabsReducer.js for app state init example
    contentSettings.init()
    privacy.init()
    Autofill.init()
    Extensions.init()
    SiteHacks.init()
    spellCheck.init()
    HttpsEverywhere.init()
    TrackingProtection.init()
    AdBlock.init()
    AdInsertion.init()

    if (!loadedPerWindowState || loadedPerWindowState.length === 0) {
      if (!CmdLine.newWindowURL()) {
        appActions.newWindow()
      }
    } else {
      loadedPerWindowState.forEach((wndState) => {
        appActions.newWindow(undefined, undefined, wndState)
      })
    }
    process.emit(messages.APP_INITIALIZED)

    if (process.env.BRAVE_IS_DEFAULT_BROWSER !== undefined) {
      if (process.env.BRAVE_IS_DEFAULT_BROWSER === 'true') {
        appActions.changeSetting(settings.IS_DEFAULT_BROWSER, true)
      } else if (process.env.BRAVE_IS_DEFAULT_BROWSER === 'false') {
        appActions.changeSetting(settings.IS_DEFAULT_BROWSER, false)
      }
    } else {
      // Default browser checking
      let isDefaultBrowser = ['development', 'test'].includes(process.env.NODE_ENV)
        ? true : defaultProtocols.every(p => app.isDefaultProtocolClient(p))
      appActions.changeSetting(settings.IS_DEFAULT_BROWSER, isDefaultBrowser)
    }

    if (CmdLine.newWindowURL()) {
      appActions.newWindow(Immutable.fromJS({
        location: CmdLine.newWindowURL()
      }))
    }

    ipcMain.on(messages.PREFS_RESTART, (e, config, value) => {
      var message = locale.translation('prefsRestart')
      if (prefsRestartLastValue[config] !== undefined && prefsRestartLastValue[config] !== value) {
        delete prefsRestartLastValue[config]
        appActions.hideNotification(message)
      } else {
        appActions.showNotification({
          buttons: [
            {text: locale.translation('yes')},
            {text: locale.translation('no')}
          ],
          options: {
            persist: false
          },
          message
        })
        prefsRestartCallbacks[message] = (buttonIndex, persist) => {
          delete prefsRestartCallbacks[message]
          if (buttonIndex === 0) {
            const args = process.argv.slice(1)
            args.push('--relaunch')
            app.relaunch({args})
            app.quit()
          } else {
            delete prefsRestartLastValue[config]
            appActions.hideNotification(message)
          }
        }
        if (prefsRestartLastValue[config] === undefined) {
          prefsRestartLastValue[config] = value
        }
      }
    })

    ipcMain.on(messages.SET_CLIPBOARD, (e, text) => {
      electron.clipboard.writeText(text)
    })

    ipcMain.on(messages.CERT_ERROR_ACCEPTED, (event, url) => {
      try {
        let host = urlParse(url).host
        if (host) {
          acceptCertDomains[host] = true
        }
      } catch (e) {
        console.log('Cannot add url `' + url + '` to accepted domain list', e)
      }
    })

    ipcMain.on(messages.CHECK_CERT_ERROR_ACCEPTED, (event, host, frameKey) => {
      // If the host is associated with a URL with a cert error, update the
      // security state to insecure
      event.sender.send(messages.SET_SECURITY_STATE, frameKey, {
        secure: 2
      })
    })

    ipcMain.on(messages.GET_CERT_ERROR_DETAIL, (event, url) => {
      if (errorCerts[url]) {
        event.sender.send(messages.SET_CERT_ERROR_DETAIL, {
          subjectName: errorCerts[url].subjectName,
          issuerName: errorCerts[url].issuerName,
          serialNumber: errorCerts[url].serialNumber,
          validStart: errorCerts[url].validStart,
          validExpiry: errorCerts[url].validExpiry,
          fingerprint: errorCerts[url].fingerprint
        })
      }
    })

    // save app state every 5 minutes regardless of update frequency
    sessionStateSaveInterval = setInterval(initiateSessionStateSave, 1000 * 60 * 5)

    ipcMain.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex, persist) => {
      if (prefsRestartCallbacks[message]) {
        prefsRestartCallbacks[message](buttonIndex, persist)
      }
    })

    ipcMain.on(messages.IMPORT_BROWSER_DATA_NOW, () => {
      Importer.init()
    })

    ipcMain.on(messages.EXPORT_BOOKMARKS, () => {
      BookmarksExporter.showDialog(AppStore.getState().get('sites'))
    })

    // This loads package.json into an object
    // TODO: Seems like this can be done with app.getVersion() insteand?
    PackageLoader.load((err, pack) => {
      if (err) throw new Error('package.json could not be accessed')

      // Setup the auto updater, check the env variable first because it's
      // used to check the update channel before releases.
      Updater.init(process.platform, process.arch, process.env.BRAVE_UPDATE_VERSION || pack.version)

      // This is fired by a menu entry (for now - will be scheduled)
      process.on(messages.CHECK_FOR_UPDATE, () => Updater.checkForUpdate(true))
      ipcMain.on(messages.CHECK_FOR_UPDATE, () => Updater.checkForUpdate(true))

      // This is fired from a auto-update metadata call
      process.on(messages.UPDATE_META_DATA_RETRIEVED, (metadata) => {
        console.log(metadata)
      })

      // This is fired by a menu entry
      process.on(messages.IMPORT_BROWSER_DATA_NOW, () => {
        Importer.init()
      })

      process.on(messages.EXPORT_BOOKMARKS, () => {
        BookmarksExporter.showDialog(AppStore.getState().get('sites'))
      })
    })
    ready = true
  }
})
