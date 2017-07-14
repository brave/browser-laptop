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
const ipcMain = electron.ipcMain
const Immutable = require('immutable')
const updater = require('./updater')
const Importer = require('./importer')
const messages = require('../js/constants/messages')
const appActions = require('../js/actions/appActions')
const SessionStore = require('./sessionStore')
const {startSessionSaveInterval} = require('./sessionStoreShutdown')
const appStore = require('../js/stores/appStore')
const Autofill = require('./autofill')
const Extensions = require('./extensions')
const TrackingProtection = require('./trackingProtection')
const AdBlock = require('./adBlock')
const AdInsertion = require('./browser/ads/adInsertion')
const HttpsEverywhere = require('./httpsEverywhere')
const PDFJS = require('./pdfJS')
const SiteHacks = require('./siteHacks')
const CmdLine = require('./cmdLine')
const urlParse = require('./common/urlParse')
const spellCheck = require('./spellCheck')
const locale = require('./locale')
const contentSettings = require('../js/state/contentSettings')
const privacy = require('../js/state/privacy')
const settings = require('../js/constants/settings')
const BookmarksExporter = require('./browser/bookmarksExporter')
const siteUtil = require('../js/state/siteUtil')

app.commandLine.appendSwitch('enable-features', 'BlockSmallPluginContent,PreferHtmlOverPlugins')

// Domains to accept bad certs for. TODO: Save the accepted cert fingerprints.
let acceptCertDomains = {}
let errorCerts = {}

const prefsRestartCallbacks = {}
const prefsRestartLastValue = {}

const defaultProtocols = ['http', 'https']

// exit cleanly on signals
;['SIGTERM', 'SIGHUP', 'SIGINT', 'SIGBREAK'].forEach((signal) => {
  process.on(signal, () => {
    app.quit()
  })
})

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

  app.on('network-connected', () => {
    appActions.networkConnected()
  })

  app.on('network-disconnected', () => {
    appActions.networkDisconnected()
  })

  loadAppStatePromise.then((initialState) => {
    // Do this after loading the state
    // For tests we always want to load default app state
    const loadedPerWindowState = initialState.perWindowState
    delete initialState.perWindowState
    // Retore map order after load
    let state = Immutable.fromJS(initialState)
    state = state.set('sites', state.get('sites').sort(siteUtil.siteSort))
    appActions.setState(state)
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
    PDFJS.init()

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

    // DO NOT TO THIS LIST
    // using ipcMain.on is deprecated and should be replaced by actions/reducers
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

    ipcMain.on(messages.CHECK_CERT_ERROR_ACCEPTED, (event, host, tabId) => {
      // If the host is associated with a URL with a cert error, update the
      // security state to insecure
      event.sender.send(messages.SET_SECURITY_STATE, tabId, {
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

    startSessionSaveInterval()

    ipcMain.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex, persist) => {
      if (prefsRestartCallbacks[message]) {
        prefsRestartCallbacks[message](buttonIndex, persist)
      }
    })

    ipcMain.on(messages.IMPORT_BROWSER_DATA_NOW, () => {
      Importer.init()
    })

    ipcMain.on(messages.EXPORT_BOOKMARKS, () => {
      BookmarksExporter.showDialog(appStore.getState().get('sites'))
    })
    // DO NOT TO THIS LIST - see above

    // We need the initial state to read the UPDATE_TO_PREVIEW_RELEASES preference
    loadAppStatePromise.then((initialState) => {
      updater.init(
        process.platform,
        process.arch,
        process.env.BRAVE_UPDATE_VERSION || app.getVersion(),
        initialState.settings[settings.UPDATE_TO_PREVIEW_RELEASES]
      )

      // This is fired by a menu entry
      process.on(messages.CHECK_FOR_UPDATE, () => updater.checkForUpdate(true))
      ipcMain.on(messages.CHECK_FOR_UPDATE, () => updater.checkForUpdate(true))

      // This is fired from a auto-update metadata call
      process.on(messages.UPDATE_META_DATA_RETRIEVED, (metadata) => {
        console.log(metadata)
      })
    })

    // This is fired by a menu entry
    process.on(messages.IMPORT_BROWSER_DATA_NOW, () => {
      Importer.init()
    })

    process.on(messages.EXPORT_BOOKMARKS, () => {
      BookmarksExporter.showDialog(appStore.getState().get('sites'))
    })

    ready = true
  }
})
