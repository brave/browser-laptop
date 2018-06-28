// @flow
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

let ready = false

require('v8-compile-cache')

const CrashHerald = require('./crash-herald')
const telemetry = require('./telemetry')
const {setUserPref} = require('../js/state/userPrefs')

// set initial base line checkpoint
telemetry.setCheckpoint('init')

const handleUncaughtError = (stack, message) => {
  muon.crashReporter.setJavascriptInfoCrashValue(JSON.stringify({stack, message}))
  muon.crashReporter.dumpWithoutCrashing()

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
  var message, ref, stack
  if (typeof error === 'string') {
    stack = error
  } else {
    stack = (ref = error.stack) != null ? ref : error.name + ': ' + error.message
  }
  message = 'Uncaught Exception:\n' + stack
  console.error('An uncaught exception occurred in the main process ' + message)
  handleUncaughtError(stack, message)
})

process.on('unhandledRejection', function (reason, promise) {
  console.error('Unhandled promise rejection in the main process ' + reason)
  handleUncaughtError(promise, reason)
})

process.on('warning', warning => console.warn(warning.stack))

if (process.platform === 'win32') {
  require('./windowsInit')
}

if (process.platform === 'linux') {
  require('./linuxInit')
}

const electron = require('electron')
const app = electron.app
const ipcMain = electron.ipcMain
const Immutable = require('immutable')
const updater = require('./updater')
const Importer = require('./importer')
const messages = require('../js/constants/messages')
const appActions = require('../js/actions/appActions')
const tabActions = require('./common/actions/tabActions')
const SessionStore = require('./sessionStore')
const {startSessionSaveInterval} = require('./sessionStoreShutdown')
const appStore = require('../js/stores/appStore')
const Autofill = require('./autofill')
const Extensions = require('./extensions')
const TrackingProtection = require('./trackingProtection')
const AdBlock = require('./adBlock')
const AdInsertion = require('./browser/ads/adInsertion')
const HttpsEverywhere = require('./httpsEverywhere')
const Firewall = require('./firewall')
const PDFJS = require('./pdfJS')
const SiteHacks = require('./siteHacks')
const CmdLine = require('./cmdLine')
const urlParse = require('./common/urlParse')
const locale = require('./locale')
const contentSettings = require('../js/state/contentSettings')
const privacy = require('../js/state/privacy')
const settings = require('../js/constants/settings')
const {getSetting} = require('../js/settings')
const BookmarksExporter = require('./browser/bookmarksExporter')

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
loadAppStatePromise.then((initialImmutableState) => {
  const {HARDWARE_ACCELERATION_ENABLED, SMOOTH_SCROLL_ENABLED, SEND_CRASH_REPORTS, SITE_ISOLATION_ENABLED} = require('../js/constants/settings')
  const initialSettings = initialImmutableState.get('settings')
  if (getSetting(SITE_ISOLATION_ENABLED, initialSettings) === true) {
    // This needs to happen as early as possible :O
    app.commandLine.appendSwitch('site-per-process')
  }

  CrashHerald.init(getSetting(SEND_CRASH_REPORTS, initialSettings))

  telemetry.setCheckpointAndReport('state-loaded')

  // Check in case a user is upgrading with this setting.
  // For non-legacy users, they will always have these settings in sync.
  const oldHardwareAccelValue = getSetting(HARDWARE_ACCELERATION_ENABLED, initialSettings)
  if (oldHardwareAccelValue !== app.getBooleanPref('hardware_acceleration_mode.enabled')) {
    // This won't take effect until the next restart of the app, so some users
    // may have to restart an extra time if UI doesn't work.
    app.setBooleanPref('hardware_acceleration_mode.enabled', oldHardwareAccelValue)
  }

  if (getSetting(SMOOTH_SCROLL_ENABLED, initialSettings) === false) {
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

  // Load the certificate error page
  // and provide details about the error,
  // including enough data for in-page actions to force the
  // insecure page to load or show the certificate.
  tabActions.setContentsError(webContents.getId(), {
    url,
    error,
    cert,
    tabId: webContents.getId()
  })
  appActions.loadURLRequested(webContents.getId(), 'about:certerror')
}

app.on('ready', () => {
  setUserPref('safebrowsing.enabled', false)

  app.on('certificate-error', (e, webContents, url, error, cert, resourceType, strictEnforcement, expiredPreviousDecision, muonCb) => {
    let host = urlParse(url).host
    if (host && acceptCertDomains[host] === true) {
      // Ignore the cert error
      muonCb('continue')
      return
    } else {
      muonCb('deny')
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

  loadAppStatePromise.then((initialImmutableState) => {
    // Do this after loading the state
    // For tests we always want to load default app state
    const loadedPerWindowImmutableState = initialImmutableState.get('perWindowState')
    initialImmutableState = initialImmutableState.delete('perWindowState')
    // Restore map order after load
    appActions.setState(initialImmutableState)
    setImmediate(() => perWindowStateLoaded(loadedPerWindowImmutableState))
  })

  const perWindowStateLoaded = (loadedPerWindowImmutableState) => {
    // TODO(bridiver) - this shold be refactored into reducers
    // DO NOT ADD ANYHING TO THIS LIST
    // See tabsReducer.js for app state init example
    contentSettings.init()
    privacy.init()
    Autofill.init()
    Extensions.init()
    SiteHacks.init()
    HttpsEverywhere.init()
    TrackingProtection.init()
    AdBlock.init()
    AdInsertion.init()
    PDFJS.init()
    Firewall.init()

    if (!loadedPerWindowImmutableState || loadedPerWindowImmutableState.size === 0) {
      if (!CmdLine.newWindowURL()) {
        appActions.newWindow()
      }
    } else {
      const lastIndex = loadedPerWindowImmutableState.size - 1
      loadedPerWindowImmutableState
        .sort((a, b) => {
          let comparison = 0
          const aTime = a.getIn(['windowInfo', 'focusTime'], 0)
          const bTime = b.getIn(['windowInfo', 'focusTime'], 0)

          if (aTime > bTime) {
            comparison = 1
          } else if (aTime < bTime) {
            comparison = -1
          }

          return comparison
        })
        .forEach((wndState, i) => {
          const isLastWindow = i === lastIndex
          if (CmdLine.shouldDebugWindowEvents && isLastWindow) {
            console.log(`The restored window which should get focus has ${wndState.get('frames').size} frames`)
          }
          appActions.newWindow(undefined, isLastWindow ? undefined : { inactive: true }, wndState, true)
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
      let isDefaultBrowser
      if (['development', 'test'].includes(process.env.NODE_ENV)) {
        isDefaultBrowser = true
      } else if (process.platform === 'linux') {
        const Channel = require('./channel')
        const desktopName = Channel.getLinuxDesktopName()
        isDefaultBrowser = app.isDefaultProtocolClient('', desktopName)
      } else {
        isDefaultBrowser = defaultProtocols.every(p => app.isDefaultProtocolClient(p))
      }
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
            {text: locale.translation('no')},
            {text: locale.translation('yes')}
          ],
          options: {
            persist: false
          },
          position: 'global',
          message
        })
        prefsRestartCallbacks[message] = (buttonIndex, persist) => {
          delete prefsRestartCallbacks[message]
          if (buttonIndex === 1) {
            const args = process.argv.slice(1)
            args.push('--relaunch')
            app.relaunch({args})
            app.quit()
          } else {
            delete prefsRestartLastValue[config]
            appActions.hideNotification(message)
          }
        }
        if (prefsRestartLastValue[config] === undefined && typeof value === 'boolean') {
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
        console.error('Cannot add url `' + url + '` to accepted domain list', e)
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
      BookmarksExporter.showDialog(appStore.getState())
    })
    // DO NOT TO THIS LIST - see above

    loadAppStatePromise.then((initialImmutableState) => {
      updater.init(
        process.platform,
        process.arch,
        process.env.BRAVE_UPDATE_VERSION || app.getVersion(),
        process.env.BRAVE_ENABLE_PREVIEW_UPDATES !== undefined
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
      BookmarksExporter.showDialog(appStore.getState())
    })

    ready = true
  }
})
