/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const {BrowserWindow, app, ipcMain} = require('electron')
const sessionStore = require('./sessionStore')
const updateStatus = require('../js/constants/updateStatus')
const updater = require('./updater')
const appConfig = require('../js/constants/appConfig')
const async = require('async')
const messages = require('../js/constants/messages')
const appActions = require('../js/actions/appActions')
const platformUtil = require('./common/lib/platformUtil')

// Used to collect the per window state when shutting down the application
let perWindowState
let sessionStateStoreComplete
let sessionStateStoreCompleteCallback
let saveAppStateTimeout
let windowCloseRequestId
let shuttingDown
let lastWindowThatWasClosedState
let isAllWindowsClosed
let sessionStateSaveInterval
// Stores the last window state for each requested window in case a hung window happens,
// we'll at least have the last known window state.
let windowStateCache
let sessionStoreQueue
let appStore

// Useful for automated tests
const reset = () => {
  perWindowState = []
  sessionStateStoreComplete = false
  if (saveAppStateTimeout) {
    clearTimeout(saveAppStateTimeout)
  }
  saveAppStateTimeout = null
  windowCloseRequestId = 0
  shuttingDown = false
  lastWindowThatWasClosedState = undefined
  isAllWindowsClosed = false
  sessionStateSaveInterval = null
  windowStateCache = {}
  if (sessionStateStoreCompleteCallback) {
    sessionStateStoreCompleteCallback()
  }
  sessionStateStoreCompleteCallback = null
  sessionStoreQueue = async.queue((task, callback) => {
    task(callback)
  }, 1)
}
reset()

const logSaveAppStateError = (e) => {
  console.error('Error saving app state: ', e)
}

const saveAppState = (forceSave = false) => {
  if (!sessionStateStoreCompleteCallback) {
    return
  }

  if (!appStore) {
    appStore = require('../js/stores/appStore')
  }

  // If we're shutting down early and can't access the state, it's better
  // to not try to save anything at all and just quit.
  if (shuttingDown && !appStore.getState()) {
    app.exit(0)
  }

  const appState = appStore.getState().toJS()
  appState.perWindowState = perWindowState

  const receivedAllWindows = perWindowState.length === BrowserWindow.getAllWindows().length
  if (receivedAllWindows) {
    clearTimeout(saveAppStateTimeout)
  }

  if (!forceSave && !receivedAllWindows) {
    return
  }

  return sessionStore.saveAppState(appState, shuttingDown).catch((e) => {
    logSaveAppStateError(e)
  }).then(() => {
    if (receivedAllWindows || forceSave) {
      sessionStateStoreComplete = true
    }

    if (sessionStateStoreComplete) {
      if (shuttingDown) {
        // If the status is still UPDATE_AVAILABLE then the user wants to quit
        // and not restart
        if (appState.updates && (appState.updates.status === updateStatus.UPDATE_AVAILABLE ||
            appState.updates.status === updateStatus.UPDATE_AVAILABLE_DEFERRED)) {
          // In this case on win32, the process doesn't try to auto restart, so avoid the user
          // having to open the app twice.  Maybe squirrel detects the app is already shutting down.
          if (platformUtil.isWindows()) {
            appState.updates.status = updateStatus.UPDATE_APPLYING_RESTART
          } else {
            appState.updates.status = updateStatus.UPDATE_APPLYING_NO_RESTART
          }
        }

        // If there's an update to apply, then do it here.
        // Otherwise just quit.
        if (appState.updates && (appState.updates.status === updateStatus.UPDATE_APPLYING_NO_RESTART ||
            appState.updates.status === updateStatus.UPDATE_APPLYING_RESTART)) {
          updater.quitAndInstall()
        } else {
          app.quit()
        }
      } else {
        const cb = sessionStateStoreCompleteCallback
        sessionStateStoreCompleteCallback = null
        sessionStateStoreComplete = false
        cb()
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
    if (isAllWindowsClosed && lastWindowThatWasClosedState) {
      perWindowState.push(lastWindowThatWasClosedState)
      saveAppState(true)
    } else if (BrowserWindow.getAllWindows().length > 0) {
      ++windowCloseRequestId
      const windowIds = BrowserWindow.getAllWindows().map((win) => {
        return win.id
      })
      BrowserWindow.getAllWindows().forEach((win) => win.webContents.send(messages.REQUEST_WINDOW_STATE, windowCloseRequestId))
      // Just in case a window is not responsive, we don't want to wait forever.
      // In this case just save session store for the windows that we have already.
      saveAppStateTimeout = setTimeout(() => {
        // Rewrite perwindowstate here
        perWindowState = windowIds
          .filter((windowId) => windowStateCache[windowId])
          .map((windowId) => windowStateCache[windowId])
        saveAppState(true)
      }, appConfig.quitTimeout)
    } else {
      saveAppState()
    }
  })
}

const removeWindowFromCache = (windowId) => {
  if (shuttingDown) {
    return
  }
  delete windowStateCache[windowId]
}

const initWindowCacheState = (windowId, windowState) => {
  windowStateCache[windowId] = Object.assign({}, windowState)
}

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
  if (sessionStateSaveInterval !== undefined) {
    clearInterval(sessionStateSaveInterval)
  }
  initiateSessionStateSave()
})

const startSessionSaveInterval = () => {
  // save app state every 5 minutes regardless of update frequency
  initiateSessionStateSave()
  sessionStateSaveInterval = setInterval(initiateSessionStateSave, appConfig.sessionSaveInterval)
}

// User initiated exit using File->Quit
ipcMain.on(messages.RESPONSE_WINDOW_STATE, (evt, data, id) => {
  const senderWindowId = evt.sender.getOwnerBrowserWindow().id
  if (id !== windowCloseRequestId) {
    return
  }

  if (data) {
    perWindowState.push(data)
    windowStateCache[senderWindowId] = data
  }
  saveAppState()
})

ipcMain.on(messages.LAST_WINDOW_STATE, (evt, data) => {
  if (data) {
    lastWindowThatWasClosedState = data
  }
})

process.on(messages.UNDO_CLOSED_WINDOW, () => {
  if (lastWindowThatWasClosedState) {
    sessionStore.cleanPerWindowData(lastWindowThatWasClosedState)
    appActions.newWindow(undefined, undefined, lastWindowThatWasClosedState)
    lastWindowThatWasClosedState = undefined
  }
})

app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (!platformUtil.isDarwin()) {
    isAllWindowsClosed = true
    app.quit()
  }
})

module.exports = {
  startSessionSaveInterval,
  initiateSessionStateSave,
  reset,
  removeWindowFromCache,
  initWindowCacheState
}
