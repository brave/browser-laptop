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
const dialog = electron.dialog
const ipcMain = electron.ipcMain
const Immutable = require('immutable')
const Menu = require('./browser/menu')
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
const urlParse = require('url').parse
const CryptoUtil = require('../js/lib/cryptoUtil')
const keytar = require('keytar')
const siteSettings = require('../js/state/siteSettings')
const spellCheck = require('./spellCheck')
const locale = require('./locale')
const ledger = require('./ledger')
const contentSettings = require('../js/state/contentSettings')
const privacy = require('../js/state/privacy')
const async = require('async')
const settings = require('../js/constants/settings')
const sync = require('./sync')

// temporary fix for #4517, #4518 and #4472
app.commandLine.appendSwitch('enable-use-zoom-for-dsf', 'false')
app.commandLine.appendSwitch('enable-features', 'BlockSmallPluginContent,PreferHtmlOverPlugins')

// Used to collect the per window state when shutting down the application
let perWindowState = []
let sessionStateStoreCompleteOnQuit = false
let shuttingDown = false
let lastWindowState
let lastWindowClosed = false

// Domains to accept bad certs for. TODO: Save the accepted cert fingerprints.
let acceptCertDomains = {}
let errorCerts = {}
// Don't show the keytar prompt more than once per 24 hours
let throttleKeytar = false

// Map of password notification bar messages to their callbacks
const passwordCallbacks = {}

const prefsRestartCallbacks = {}
const prefsRestartLastValue = {}

const unsafeTestMasterKey = 'c66af15fc6555ebecf7cee3a5b82c108fd3cb4b587ab0b299d28e39c79ecc708'

const defaultProtocols = ['http', 'https']

const sessionStoreQueue = async.queue((task, callback) => {
  task(callback)
}, 1)

/**
 * Gets the master key for encrypting login credentials from the OS keyring.
 */
const getMasterKey = () => {
  if (throttleKeytar) {
    return null
  }

  if (process.env.NODE_ENV === 'test') {
    // workaround for https://travis-ci.org/brave/browser-laptop/builds/132700770
    return (new Buffer(unsafeTestMasterKey, 'hex')).toString('binary')
  }

  const appName = 'Brave'
  // Previously the master key was binary encoded, which caused compatibility
  // issues with various keyrings. In 0.8.3, switch to hex encoding for storage.
  const oldAccountName = 'login master key'
  const accountName = 'login master key v2'
  let oldMasterKey = keytar.getPassword(appName, oldAccountName)
  let masterKey = keytar.getPassword(appName, accountName)

  let success = false

  if (masterKey === null) {
    if (typeof oldMasterKey === 'string') {
      // The user made a v1 (binary) key. Try converting it to hex if it
      // appears to be 32 bytes.
      let oldBuffer = new Buffer(oldMasterKey, 'binary')
      if (oldBuffer.length === 32) {
        success = keytar.addPassword(appName, accountName, oldBuffer.toString('hex'))
      }
    }

    // Either the user denied access or no master key has ever been created.
    // We can't tell the difference so try making a new master key.
    success = success || keytar.addPassword(appName, accountName, CryptoUtil.getRandomBytes(32).toString('hex'))

    if (success) {
      // A key should have been created
      masterKey = keytar.getPassword(appName, accountName)
    }
  }

  if (typeof masterKey === 'string') {
    // Convert from hex to binary
    return (new Buffer(masterKey, 'hex')).toString('binary')
  } else {
    throttleKeytar = true
    setTimeout(() => {
      throttleKeytar = false
    }, 1000 * 60 * 60 * 24)
    return null
  }
}

const saveIfAllCollected = (forceSave) => {
  // If we're shutting down early and can't access the state, it's better
  // to not try to save anything at all and just quit.
  if (shuttingDown && !AppStore.getState()) {
    app.exit(0)
  }
  if (forceSave || perWindowState.length === BrowserWindow.getAllWindows().length) {
    const appState = AppStore.getState().toJS()
    appState.perWindowState = perWindowState

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
    }
    sessionStoreQueue.push(saveAppState.bind(null, appState))
  }
}

const logSaveAppStateError = (e) => {
  console.error('Error saving app state: ', e)
}

const saveAppState = (appState, cb) => {
  SessionStore.saveAppState(appState, shuttingDown).catch((e) => {
    logSaveAppStateError(e)
    cb()
  }).then(() => {
    if (shuttingDown) {
      sessionStateStoreCompleteOnQuit = true
      // If there's an update to apply, then do it here.
      // Otherwise just quit.
      if (appState.updates && (appState.updates.status === UpdateStatus.UPDATE_APPLYING_NO_RESTART ||
          appState.updates.status === UpdateStatus.UPDATE_APPLYING_RESTART)) {
        Updater.quitAndInstall()
      } else {
        app.quit()
      }
      // no callback here because we don't want to get a partial write during shutdown
    } else {
      cb()
    }
  })
}

/**
 * Saves the session storage for all windows
 */
const initiateSessionStateSave = (beforeQuit) => {
  if (shuttingDown && !beforeQuit) {
    return
  }

  perWindowState.length = 0
  // quit triggered by window-all-closed should save last window state
  if (lastWindowClosed && lastWindowState) {
    perWindowState.push(lastWindowState)
    saveIfAllCollected(true)
  } else {
    BrowserWindow.getAllWindows().forEach((win) => win.webContents.send(messages.REQUEST_WINDOW_STATE))
    saveIfAllCollected()
  }
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
    appActions.shuttingDown()
    shuttingDown = true
    if (sessionStateStoreCompleteOnQuit) {
      return
    }

    // When the browser is closing we need to send a signal
    // to record the currently active location in the ledger
    ledger.quit()

    e.preventDefault()

    clearInterval(sessionStateSaveInterval)
    initiateSessionStateSave(true)

    // Just in case a window is not responsive, we don't want to wait forever.
    // In this case just save session store for the windows that we have already.
    setTimeout(() => {
      saveIfAllCollected(true)
    }, appConfig.quitTimeout)
  })

  app.on('network-connected', () => {
    appActions.networkConnected()
  })

  app.on('network-disconnected', () => {
    appActions.networkDisconnected()
  })

  // User initiated exit using File->Quit
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

  process.on('window-alert',
    (webContents, extraData, title, message, defaultPromptText,
        shouldDisplaySuppressCheckbox, isBeforeUnloadDialog, isReload, cb) => {
      let suppress = false
      const buttons = ['OK']
      if (!webContents || webContents.isDestroyed()) {
        cb(false, '', suppress)
      } else {
        cb(true, '', suppress)
      }

      const hostWebContents = webContents.hostWebContents || webContents
      dialog.showMessageBox(BrowserWindow.fromWebContents(hostWebContents), {
        message,
        title,
        buttons: buttons
      })
    })

  process.on('window-confirm',
    (webContents, extraData, title, message, defaultPromptText,
        shouldDisplaySuppressCheckbox, isBeforeUnloadDialog, isReload, cb) => {
      let suppress = false
      const buttons = ['OK', 'Cancel']
      if (!webContents || webContents.isDestroyed()) {
        cb(false, '', suppress)
      }

      const hostWebContents = webContents.hostWebContents || webContents
      const response = dialog.showMessageBox(BrowserWindow.fromWebContents(hostWebContents), {
        message,
        title,
        buttons: buttons,
        cancelId: 1
      })
      cb(!response, '', suppress)
    })

  process.on('window-prompt',
    (webContents, extraData, title, message, defaultPromptText,
        shouldDisplaySuppressCheckbox, isBeforeUnloadDialog, isReload, cb) => {
      console.warn('window.prompt is not supported yet')
      let suppress = false
      cb(false, '', suppress)
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
    Menu.init(initialState, null)
    sync.init(initialState.sync || {})
    return loadedPerWindowState
  }).then((loadedPerWindowState) => {
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

    ipcMain.on(messages.QUIT_APPLICATION, () => {
      app.quit()
    })

    ipcMain.on(messages.PREFS_RESTART, (e, config, value) => {
      var message = config === settings.SYNC_ENABLED ? locale.translation('prefsRestartSync') : locale.translation('prefsRestart')
      if (prefsRestartLastValue[config] !== undefined && prefsRestartLastValue[config] !== value) {
        delete prefsRestartLastValue[config]
        appActions.hideMessageBox(message)
      } else {
        appActions.showMessageBox({
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
            appActions.hideMessageBox(message)
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
      if (acceptCertDomains[host]) {
        event.sender.send(messages.SET_SECURITY_STATE, frameKey, {
          secure: false
        })
      }
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

    ledger.init()

    ipcMain.on(messages.LEDGER_CREATE_WALLET, () => {
      ledger.boot()
    })

    let masterKey
    ipcMain.on(messages.DECRYPT_PASSWORD, (e, encrypted, authTag, iv, id) => {
      masterKey = masterKey || getMasterKey()
      if (!masterKey) {
        console.log('Could not access master password; aborting')
        return
      }
      let decrypted = CryptoUtil.decryptVerify(encrypted, authTag, masterKey, iv)
      e.sender.send(messages.DECRYPTED_PASSWORD, {
        id,
        decrypted
      })
    })
    ipcMain.on(messages.GET_PASSWORDS, (e, origin, action) => {
      const passwords = AppStore.getState().get('passwords')
      if (!passwords || passwords.size === 0) {
        return
      }

      let results = passwords.filter((password) => {
        return password.get('origin') === origin && password.get('action') === action
      })

      if (results.size === 0) {
        return
      }

      masterKey = masterKey || getMasterKey()
      if (!masterKey) {
        console.log('Could not access master password; aborting')
        return
      }

      let isUnique = results.size === 1
      results.forEach((result) => {
        let password = CryptoUtil.decryptVerify(result.get('encryptedPassword'),
                                                result.get('authTag'),
                                                masterKey,
                                                result.get('iv'))
        e.sender.send(messages.GOT_PASSWORD, result.get('username'),
                      password, origin, action, isUnique)
      })
    })

    ipcMain.on(messages.HIDE_CONTEXT_MENU, () => {
      if (BrowserWindow.getFocusedWindow()) {
        BrowserWindow.getFocusedWindow().webContents.send(messages.HIDE_CONTEXT_MENU)
      }
    })

    ipcMain.on(messages.SHOW_USERNAME_LIST, (e, origin, action, boundingRect, value) => {
      const passwords = AppStore.getState().get('passwords')
      if (!passwords || passwords.size === 0) {
        return
      }

      let usernames = {}
      let results = passwords.filter((password) => {
        return password.get('username') &&
          password.get('username').startsWith(value) &&
          password.get('origin') === origin &&
          password.get('action') === action
      })

      if (results.size === 0) {
        if (BrowserWindow.getFocusedWindow()) {
          BrowserWindow.getFocusedWindow().webContents.send(messages.HIDE_CONTEXT_MENU)
        }
        return
      }

      masterKey = masterKey || getMasterKey()
      if (!masterKey) {
        console.log('Could not access master password; aborting')
        return
      }

      results.forEach((result) => {
        usernames[result.get('username')] = CryptoUtil.decryptVerify(result.get('encryptedPassword'),
                                                                     result.get('authTag'),
                                                                     masterKey,
                                                                     result.get('iv')) || ''
      })
      let win = BrowserWindow.getFocusedWindow()
      if (!win) {
        return
      }
      if (Object.keys(usernames).length > 0) {
        win.webContents.send(messages.SHOW_USERNAME_LIST,
                             usernames, origin, action,
                             boundingRect)
      } else {
        win.webContents.send(messages.HIDE_CONTEXT_MENU)
      }
    })

    ipcMain.on(messages.SAVE_PASSWORD, (e, username, password, origin, action) => {
      if (!password || !origin || !action) {
        return
      }
      const originSettings = siteSettings.getSiteSettingsForURL(AppStore.getState().get('siteSettings'), origin)
      if (originSettings && originSettings.get('savePasswords') === false) {
        return
      }

      masterKey = masterKey || getMasterKey()
      if (!masterKey) {
        console.log('Could not access master password; aborting')
        return
      }

      const passwords = AppStore.getState().get('passwords')

      // If the same password already exists, don't offer to save it
      let result = passwords.findLast((pw) => {
        return pw.get('origin') === origin && pw.get('action') === action && (username ? pw.get('username') === username : !pw.get('username'))
      })
      if (result && password === CryptoUtil.decryptVerify(result.get('encryptedPassword'),
                                                          result.get('authTag'),
                                                          masterKey,
                                                          result.get('iv'))) {
        return
      }

      var message = username
        ? locale.translation('notificationPasswordWithUserName').replace(/{{\s*username\s*}}/, username).replace(/{{\s*origin\s*}}/, origin)
        : locale.translation('notificationPassword').replace(/{{\s*origin\s*}}/, origin)

      if (!(message in passwordCallbacks)) {
        // Notification not shown already
        appActions.showMessageBox({
          buttons: [
            {text: locale.translation('yes')},
            {text: locale.translation('no')},
            {text: locale.translation('neverForThisSite')}
          ],
          options: {
            persist: false,
            advancedText: locale.translation('notificationPasswordSettings'),
            advancedLink: 'about:passwords'
          },
          message
        })
      }

      passwordCallbacks[message] = (buttonIndex) => {
        delete passwordCallbacks[message]
        appActions.hideMessageBox(message)

        if (buttonIndex === 1) {
          return
        }
        if (buttonIndex === 2) {
          // Never save the password on this site
          appActions.changeSiteSetting(origin, 'savePasswords', false)
          return
        }

        // Save the password
        const encrypted = CryptoUtil.encryptAuthenticate(password, masterKey)
        appActions.savePassword({
          origin,
          action,
          username: username || '',
          encryptedPassword: encrypted.content,
          authTag: encrypted.tag,
          iv: encrypted.iv
        })
      }
    })

    ipcMain.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex, persist) => {
      if (passwordCallbacks[message]) {
        passwordCallbacks[message](buttonIndex)
      }
      if (prefsRestartCallbacks[message]) {
        prefsRestartCallbacks[message](buttonIndex, persist)
      }
    })

    ipcMain.on(messages.IMPORT_BROWSER_DATA_NOW, () => {
      Importer.init()
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
    })
    ready = true
  })
})
