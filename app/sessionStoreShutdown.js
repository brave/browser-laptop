/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const {app, ipcMain} = require('electron')
const sessionStore = require('./sessionStore')
const windows = require('./browser/windows')
const updateStatus = require('../js/constants/updateStatus')
const updater = require('./updater')
const appConfig = require('../js/constants/appConfig')
const async = require('async')
const messages = require('../js/constants/messages')
const appActions = require('../js/actions/appActions')
const platformUtil = require('./common/lib/platformUtil')
const Immutable = require('immutable')
const {makeImmutable} = require('./common/state/immutableUtil')

// Used to collect the per window state when shutting down the application
let immutablePerWindowState
let sessionStateStoreComplete
let sessionStateStoreCompleteCallback
let saveAppStateTimeout
let windowCloseRequestId
let shuttingDown
let immutableLastWindowClosedState
let isAllWindowsClosed
let sessionStateSaveInterval
// Stores the last window state for each requested window in case a hung window happens,
// we'll at least have the last known window state.
let immutableWindowStateCache
let sessionStoreQueue
let appStore

windows.on('new-window-state', (windowId, immutableWindowState) => {
  immutableWindowStateCache = immutableWindowStateCache.set(windowId, immutableWindowState)
})

// Useful for automated tests
const reset = () => {
  immutablePerWindowState = Immutable.List()
  sessionStateStoreComplete = false
  if (saveAppStateTimeout) {
    clearTimeout(saveAppStateTimeout)
  }
  saveAppStateTimeout = null
  windowCloseRequestId = 0
  shuttingDown = false
  immutableLastWindowClosedState = undefined
  isAllWindowsClosed = false
  sessionStateSaveInterval = null
  immutableWindowStateCache = Immutable.Map()
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

  let immutableAppState = appStore.getState().set('perWindowState', immutablePerWindowState)
  const receivedAllWindows = immutablePerWindowState.size === windows.getAllRendererWindows().length
  if (receivedAllWindows) {
    clearTimeout(saveAppStateTimeout)
  }

  if (!forceSave && !receivedAllWindows) {
    return
  }

  return sessionStore.saveAppState(immutableAppState, shuttingDown).catch((e) => {
    logSaveAppStateError(e)
  }).then(() => {
    if (receivedAllWindows || forceSave) {
      sessionStateStoreComplete = true
    }

    if (sessionStateStoreComplete) {
      if (shuttingDown) {
        // If the status is still UPDATE_AVAILABLE then the user wants to quit
        // and not restart
        if (immutableAppState.get('updates') && (immutableAppState.getIn(['updates', 'status']) === updateStatus.UPDATE_AVAILABLE ||
            immutableAppState.getIn(['updates', 'status']) === updateStatus.UPDATE_AVAILABLE_DEFERRED)) {
          // In this case on win32, the process doesn't try to auto restart, so avoid the user
          // having to open the app twice.  Maybe squirrel detects the app is already shutting down.
          if (platformUtil.isWindows()) {
            immutableAppState = immutableAppState.setIn(['updates', 'status'], updateStatus.UPDATE_APPLYING_RESTART)
          } else {
            immutableAppState = immutableAppState.setIn(['updates', 'status'], updateStatus.UPDATE_APPLYING_NO_RESTART)
          }
        }

        // If there's an update to apply, then do it here.
        // Otherwise just quit.
        if (immutableAppState.get('updates') && (immutableAppState.getIn(['updates', 'status']) === updateStatus.UPDATE_APPLYING_NO_RESTART ||
            immutableAppState.getIn(['updates', 'status']) === updateStatus.UPDATE_APPLYING_RESTART)) {
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
    immutablePerWindowState = Immutable.List()

    // quit triggered by window-all-closed should save last window state
    if (isAllWindowsClosed && immutableLastWindowClosedState) {
      immutablePerWindowState = immutablePerWindowState.push(immutableLastWindowClosedState)
      saveAppState(true)
    } else if (windows.getAllRendererWindows().length > 0) {
      ++windowCloseRequestId
      const windowIds = windows.getAllRendererWindows().map((win) => {
        return win.id
      })
      windows.getAllRendererWindows().forEach((win) => {
        win.webContents.send(messages.REQUEST_WINDOW_STATE, windowCloseRequestId)
      })
      // Just in case a window is not responsive, we don't want to wait forever.
      // In this case just save session store for the windows that we have already.
      saveAppStateTimeout = setTimeout(() => {
        // Rewrite perwindowstate here
        immutablePerWindowState = Immutable.fromJS(windowIds
          .filter((windowId) => immutableWindowStateCache.get(windowId))
          .map((windowId) => immutableWindowStateCache.get(windowId)))
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
  immutableWindowStateCache = immutableWindowStateCache.delete(windowId)
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
  module.exports.initiateSessionStateSave()
})

const startSessionSaveInterval = () => {
  // save app state every 5 minutes regardless of update frequency
  sessionStateSaveInterval = setInterval(module.exports.initiateSessionStateSave, appConfig.sessionSaveInterval)
}

// User initiated exit using File->Quit
ipcMain.on(messages.RESPONSE_WINDOW_STATE, (evt, mem) => {
  const memory = mem.memory()
  const data = memory.windowState
  const id = memory.requestId
  const immutableWindowState = makeImmutable(data)
  const senderWindowId = evt.sender.getOwnerBrowserWindow().id
  if (id !== windowCloseRequestId) {
    return
  }

  if (data) {
    immutablePerWindowState = immutablePerWindowState.push(immutableWindowState)
    immutableWindowStateCache = immutableWindowStateCache.set(senderWindowId, immutableWindowState)
  }
  saveAppState()
})

ipcMain.on(messages.LAST_WINDOW_STATE, (evt, data) => {
  // Remember last window (that was not buffer window, i.e. had frames).
  // When the last tab of a window closes, the window is closed before the tab closes, so
  // a used closing window will almost always have at least 1 frame.
  if (data && data.frames && data.frames.length) {
    immutableLastWindowClosedState = Immutable.fromJS(data)
  }
})

process.on(messages.UNDO_CLOSED_WINDOW, () => {
  if (immutableLastWindowClosedState) {
    immutableLastWindowClosedState = sessionStore.cleanPerWindowData(immutableLastWindowClosedState)
    appActions.newWindow(undefined, undefined, immutableLastWindowClosedState)
    immutableLastWindowClosedState = undefined
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
  removeWindowFromCache
}
