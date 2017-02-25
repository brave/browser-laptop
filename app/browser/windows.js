/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {app, BrowserWindow} = require('electron')
const appActions = require('../../js/actions/appActions')
const debounce = require('../../js/lib/debounce.js')
const { makeImmutable } = require('../common/state/immutableUtil')
const windowState = require('../common/state/windowState')

// TODO(bridiver) - set window uuid
let currentWindows = {}

const cleanupWindow = (windowId) => {
  delete currentWindows[windowId]
  appActions.windowClosed({ windowId })
}

const getWindowState = (win) => {
  if (win.isFullScreen()) {
    return 'fullscreen'
  } else if (win.isMinimized()) {
    return 'minimized'
  } else if (win.isMaximized()) {
    return 'maximized'
  } else {
    return 'normal'
  }
}

const getWindowValue = (windowId) => {
  let win = BrowserWindow.fromId(windowId)
  if (win) {
    return makeImmutable({
      windowId: win.id,
      focused: win.isFocused(),
      top: win.getBounds().y,
      left: win.getBounds().x,
      width: win.getSize()[0],
      height: win.getSize()[1],
      type: 'normal',
      state: getWindowState(win)
    })
  }
}

const updateWindow = (windowId) => {
  let windowValue = getWindowValue(windowId)
  if (windowValue) {
    appActions.windowUpdated(windowValue)
  }
}

const api = {
  init: (state, action) => {
    app.on('browser-window-created', function (event, win) {
      let windowId = -1
      const updateWindowMove = debounce(updateWindow, 1000)
      const updateWindowDebounce = debounce(updateWindow, 5)

      win.once('initialized', () => {
        windowId = win.id
        currentWindows[windowId] = win
        let windowValue = getWindowValue(windowId)
        appActions.windowCreated(windowValue)
      })
      win.once('closed', () => {
        cleanupWindow(windowId)
      })
      win.on('blur', () => {
        updateWindowDebounce(windowId)
      })
      win.on('focus', () => {
        updateWindowDebounce(windowId)
      })
      win.on('show', () => {
        updateWindowDebounce(windowId)
      })
      win.on('hide', () => {
        updateWindowDebounce(windowId)
      })
      win.on('maximize', () => {
        updateWindowDebounce(windowId)
      })
      win.on('unmaximize', () => {
        updateWindowDebounce(windowId)
      })
      win.on('minimize', () => {
        updateWindowDebounce(windowId)
      })
      win.on('restore', () => {
        updateWindowDebounce(windowId)
      })
      win.on('resize', () => {
        updateWindowDebounce(windowId)
      })
      win.on('move', () => {
        updateWindowMove(windowId)
      })
      win.on('enter-full-screen', () => {
        updateWindowDebounce(windowId)
      })
      win.on('leave-full-screen', () => {
        updateWindowDebounce(windowId)
      })
    })
    // TODO(bridiver) - handle restoring windows
    // windowState.getWindows(state).forEach((win) => {
    //   console.log('restore', win.toJS())
    //   // restore window
    // })
    return state
  },

  closeWindow: (state, action) => {
    action = makeImmutable(action)
    let windowId = action.get('windowId')
    let win = api.getWindow(windowId)
    try {
      if (!win.isDestroyed()) {
        win.close()
      }
    } catch (e) {
      // ignore
    }
    return windowState.removeWindowByWindowId(state, windowId)
  },

  getWindow: (windowId) => {
    return currentWindows[windowId]
  }
}

module.exports = api
