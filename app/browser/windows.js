/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const Immutable = require('immutable')
const appActions = require('../../js/actions/appActions')
const appStore = require('../../js/stores/appStore')
const appUrlUtil = require('../../js/lib/appUrlUtil')
const {getLocationIfPDF} = require('../../js/lib/urlutil')
const debounce = require('../../js/lib/debounce')
const {getSetting} = require('../../js/settings')
const locale = require('../locale')
const LocalShortcuts = require('../localShortcuts')
const {initWindowCacheState} = require('../sessionStoreShutdown')
const {makeImmutable} = require('../common/state/immutableUtil')
const {getPinnedTabsByWindowId} = require('../common/state/tabState')
const messages = require('../../js/constants/messages')
const settings = require('../../js/constants/settings')
const config = require('../../js/constants/config')
const appDispatcher = require('../../js/dispatcher/appDispatcher')
const platformUtil = require('../common/lib/platformUtil')
const windowState = require('../common/state/windowState')
const pinnedSitesState = require('../common/state/pinnedSitesState')
const {zoomLevel} = require('../common/constants/toolbarUserInterfaceScale')
const activeTabHistory = require('./activeTabHistory')

const isDarwin = platformUtil.isDarwin()
const {app, BrowserWindow, ipcMain} = electron

// TODO(bridiver) - set window uuid
let currentWindows = {}
const windowPinnedTabStateMemoize = new WeakMap()

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

const cleanupWindow = (windowId) => {
  delete currentWindows[windowId]
  activeTabHistory.clearTabbedWindow(windowId)
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

const updateWindow = (windowId, updateDefault = false) => {
  const windowValue = getWindowValue(windowId)
  if (windowValue) {
    appActions.windowUpdated(windowValue, updateDefault, windowId)
  }
}

const onWindowResize = (windowId) => {
  const windowValue = getWindowValue(windowId)
  if (windowValue) {
    appActions.onWindowResize(windowValue, windowId)
  }
}

const siteMatchesTab = (site, tab) => {
  const matchesLocation = getLocationIfPDF(tab.get('url')) === site.get('location')
  const matchesPartition = tab.get('partitionNumber', 0) === site.get('partitionNumber', 0)
  return matchesLocation && matchesPartition
}

const updatePinnedTabs = (win, appState) => {
  // don't continue if window won't need pinned tabs updated
  if (
    !win ||
    win.isDestroyed() ||
    win.webContents.browserWindowOptions.disposition === 'new-popup'
  ) {
    return
  }
  const windowId = win.id
  const statePinnedSites = pinnedSitesState.getSites(appState)
  // no need to continue if we've already processed this state for this window
  if (windowPinnedTabStateMemoize.get(win) === statePinnedSites) {
    return
  }
  // cache that this state has been updated for this window,
  // so we do not repeat the operation until
  // this specific part of the state has changed
  // See
  windowPinnedTabStateMemoize.set(win, statePinnedSites)
  let pinnedWindowTabs = getPinnedTabsByWindowId(appState, windowId)
  // sites are instructions of what should be pinned
  // tabs are sites our window already has pinned
  // for each site which should be pinned, find if it's already pinned
  const statePinnedSitesOrdered = statePinnedSites.sort((a, b) => a.get('order') - b.get('order'))
  for (const site of statePinnedSitesOrdered.values()) {
    const existingPinnedTabIdx = pinnedWindowTabs.findIndex(tab => siteMatchesTab(site, tab))
    if (existingPinnedTabIdx !== -1) {
      // if it's already pinned we don't need to consider the tab in further searches
      pinnedWindowTabs = pinnedWindowTabs.remove(existingPinnedTabIdx)
    } else {
      // if it's not already pinned, create new pinned tab
      appActions.createTabRequested({
        url: site.get('location'),
        partitionNumber: site.get('partitionNumber'),
        pinned: true,
        active: false,
        windowId
      })
    }
  }
  // all that's left for tabs are the ones that we should close
  for (const tab of pinnedWindowTabs) {
    appActions.tabCloseRequested(tab.get('tabId'), true)
  }
}

function showDeferredShowWindow (win) {
  win.show()
  if (win.__shouldFullscreen) {
    // this timeout helps with an issue that
    // when a user is loading from state, and
    // has many full screen windows and non fullscreen windows
    // the non fullscreen windows can get opened on top of the fullscreen
    // spaces because macOS has switched away from the desktop space
    setTimeout(() => {
      win.setFullScreen(true)
    }, 100)
  } else if (win.__shouldMaximize) {
    win.maximize()
  }
  // reset temporary properties on win object
  win.__showWhenRendered = undefined
  win.__shouldFullscreen = undefined
  win.__shouldMaximize = undefined
}

const api = {
  init: (state, action) => {
    app.on('browser-window-created', function (event, win) {
      let windowId = -1
      const updateWindowMove = debounce(updateWindow, 100)
      const updateWindowDebounce = debounce(updateWindow, 5)
      const onWindowResizeDebounce = debounce(onWindowResize, 5)

      win.once('initialized', () => {
        windowId = win.id
        currentWindows[windowId] = win
        let windowValue = getWindowValue(windowId)

        win.setMenuBarVisibility(true)
        win.webContents.once('will-destroy', () => {
          LocalShortcuts.unregister(win)
        })
        win.webContents.once('close', () => {
          LocalShortcuts.unregister(win)
        })

        win.once('close', () => {
          LocalShortcuts.unregister(win)
        })
        win.on('scroll-touch-begin', function (e) {
          win.webContents.send('scroll-touch-begin')
        })
        win.on('scroll-touch-end', function (e) {
          win.webContents.send('scroll-touch-end')
        })
        win.on('scroll-touch-edge', function (e) {
          win.webContents.send('scroll-touch-edge')
        })
        win.on('swipe', function (e, direction) {
          win.webContents.send('swipe', direction)
        })
        win.on('enter-full-screen', function () {
          if (win.isMenuBarVisible()) {
            win.setMenuBarVisibility(false)
          }
        })
        win.on('leave-full-screen', function () {
          win.webContents.send(messages.LEAVE_FULL_SCREEN)

          if (getSetting(settings.AUTO_HIDE_MENU) === false) {
            win.setMenuBarVisibility(true)
          }
        })
        win.on('app-command', function (e, cmd) {
          switch (cmd) {
            case 'browser-backward':
              win.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_BACK)
              return
            case 'browser-forward':
              win.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_FORWARD)
          }
        })
        win.webContents.on('crashed', (e) => {
          console.error('Window crashed. Reloading...')
          win.loadURL(appUrlUtil.getBraveExtIndexHTML())

          ipcMain.on(messages.NOTIFICATION_RESPONSE, function notificationResponseCallback (e, message, buttonIndex, persist) {
            if (message === locale.translation('unexpectedErrorWindowReload')) {
              appActions.hideNotification(message)
              ipcMain.removeListener(messages.NOTIFICATION_RESPONSE, notificationResponseCallback)
            }
          })

          appActions.showNotification({
            position: 'global',
            buttons: [
              {text: locale.translation('ok')}
            ],
            options: {
              persist: false
            },
            message: locale.translation('unexpectedErrorWindowReload')
          })
        })

        LocalShortcuts.register(win)

        appActions.windowCreated(windowValue, windowId)
      })
      win.once('closed', () => {
        appActions.windowClosed(windowId)
        cleanupWindow(windowId)
      })
      win.on('blur', () => {
        appActions.windowBlurred(windowId)
        updateWindowDebounce(windowId)
      })
      win.on('focus', () => {
        updateWindowDebounce(windowId, true)
      })
      win.on('show', () => {
        updateWindowDebounce(windowId)
      })
      win.on('hide', () => {
        updateWindowDebounce(windowId)
      })
      win.on('maximize', () => {
        updateWindowDebounce(windowId, true)
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
        onWindowResizeDebounce(windowId)
      })
      win.on('move', () => {
        updateWindowMove(windowId, true)
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

  pinnedTabsChanged: () => {
    setImmediate(() => {
      const state = appStore.getState()
      for (let windowId in currentWindows) {
        if (currentWindows[windowId].__ready) {
          updatePinnedTabs(currentWindows[windowId], state)
        }
      }
    })
  },

  minimize: (windowId) => {
    setImmediate(() => {
      const win = currentWindows[windowId]
      if (win && !win.isDestroyed()) {
        win.minimize()
      }
    })
  },

  maximize: (windowId) => {
    setImmediate(() => {
      const win = currentWindows[windowId]
      if (win && !win.isDestroyed()) {
        win.maximize()
      }
    })
  },

  unmaximize: (windowId) => {
    setImmediate(() => {
      const win = currentWindows[windowId]
      if (win && !win.isDestroyed()) {
        win.unmaximize()
      }
    })
  },

  setTitle: (windowId, title) => {
    setImmediate(() => {
      const win = currentWindows[windowId]
      if (win && !win.isDestroyed() && title != null) {
        win.setTitle(title)
      }
    })
  },

  setFullScreen: (windowId, fullScreen) => {
    setImmediate(() => {
      const win = currentWindows[windowId]
      if (win && !win.isDestroyed()) {
        win.setFullScreen(fullScreen)
      }
    })
  },

  openDevTools: (windowId, fullScreen) => {
    setImmediate(() => {
      const win = currentWindows[windowId]
      if (win && !win.isDestroyed()) {
        win.webContents.openDevTools()
      }
    })
  },

  windowReady: (windowId) => {
    setImmediate(() => {
      const win = currentWindows[windowId]
      if (win && !win.isDestroyed()) {
        const state = appStore.getState()
        updatePinnedTabs(win, state)
        win.__ready = true
        win.emit(messages.WINDOW_RENDERER_READY)
      }
    })
  },

  windowRendered: (windowIdOrWin) => {
    setImmediate(() => {
      const win = windowIdOrWin instanceof electron.BrowserWindow
        ? windowIdOrWin
        : currentWindows[windowIdOrWin]
      if (win && win.__showWhenRendered && !win.isDestroyed() && !win.isVisible()) {
        // window is hidden by default until we receive 'ready' message,
        // so show it now
        showDeferredShowWindow(win)
      }
    })
  },

  closeWindow: (windowId) => {
    let win = api.getWindow(windowId)
    try {
      setImmediate(() => {
        if (win && !win.isDestroyed()) {
          win.close()
        }
      })
    } catch (e) {
      // ignore
    }
  },

  createWindow: function (windowOptionsIn, parentWindow, maximized, frames, immutableState = Immutable.Map(), hideUntilRendered = true, cb = null) {
    const defaultOptions = {
      // hide the window until the window reports that it is rendered
      show: true,
      fullscreenable: true
    }
    const windowOptions = Object.assign(
      defaultOptions,
      windowOptionsIn
    )
    // will only hide until rendered if the options specify to show window
    // so that a caller can control showing the window themselves with the option { show: false }
    const showWhenRendered = hideUntilRendered && windowOptions.show
    if (showWhenRendered) {
      // prevent browserwindow from opening window immediately
      windowOptions.show = false
    }
    // normally macOS will open immediately-created windows from fullscreen
    // parent windows as fullscreen
    // but if we are showing the window async, we will set the window
    // fullscreen once it is ready to be shown
    // (windowOptionsIn.fullscreen may already be set when loading from saved state,
    // so this just sets it for other scenarios)
    if (showWhenRendered && isDarwin && parentWindow && parentWindow.isFullScreen()) {
      windowOptions.fullscreen = true
    }
    // if delaying window show, remember if the window should be opened fullscreen
    // and remove the fullscreen property for now
    // (otherwise the window will be shown immediately by macOS / muon)
    let fullscreenWhenRendered = false
    if (showWhenRendered && windowOptions.fullscreen) {
      windowOptions.fullscreen = false
      fullscreenWhenRendered = true
    }
    // create window with Url to renderer
    const win = new electron.BrowserWindow(windowOptions)
    win.loadURL(appUrlUtil.getBraveExtIndexHTML())
    // TODO: pass UUID
    initWindowCacheState(win.id, immutableState)
    // let the windowReady handler know to show the window
    win.__showWhenRendered = showWhenRendered
    if (win.__showWhenRendered) {
      // let the windowReady handler know to set the window state
      win.__shouldFullscreen = fullscreenWhenRendered
      win.__shouldMaximize = maximized
      // the window is hidden until render, but we'll check to see
      // if it is shown in a timeout as, if the window errors, it won't send
      // the message to ask to be shown
      // in those cases, we want to still show it, so that the user can find the error message
      setTimeout(() => {
        if (win && !win.isDestroyed() && !win.isVisible()) {
          showDeferredShowWindow(win)
        }
      }, config.windows.timeoutToShowWindowMs)
    } else {
      // window should be shown already
      // manual maximize
      if (maximized) {
        win.maximize()
      }
      // NOTE: we don't need to fullscreen manually since it's specified in options
      // passed to BrowserWindow constructor
    }
    // let store know there's a new window
    // so it can subscribe to state updates
    appDispatcher.registerWindow(win, win.webContents)
    // when window has finished loading, assume it has communications
    // handler setup, and then send state
    win.webContents.on('did-finish-load', (e) => {
      const appStore = require('../../js/stores/appStore')
      const toolbarUserInterfaceScale = getSetting(settings.TOOLBAR_UI_SCALE)
      win.webContents.setZoomLevel(zoomLevel[toolbarUserInterfaceScale] || 0.0)

      const position = win.getPosition()
      const size = win.getSize()
      const windowState = (immutableState && immutableState.toJS()) || undefined
      const mem = muon.shared_memory.create({
        windowValue: {
          disposition: windowOptions.disposition,
          id: win.id,
          focused: win.isFocused(),
          left: position[0],
          top: position[1],
          height: size[1],
          width: size[0]
        },
        appState: appStore.getLastEmittedState().toJS(),
        windowState,
        // TODO: dispatch frame create action on appStore, as this is what the window does anyway
        // ...and do it after the window has rendered
        frames
      })

      e.sender.sendShared(messages.INITIALIZE_WINDOW, mem)
      // TODO: remove callback, use store action, returning a new window UUID from this function
      if (cb) {
        cb()
      }
    })
    return win
  },

  getWindow: (windowId) => {
    return currentWindows[windowId]
  },

  getActiveWindowId: () => {
    if (BrowserWindow.getFocusedWindow()) {
      return BrowserWindow.getFocusedWindow().id
    }
    return windowState.WINDOW_ID_NONE
  },

  privateMethods: () => {
    return process.env.NODE_ENV === 'test'
    ? {
      cleanupWindow,
      getWindowState,
      getWindowValue,
      updateWindow,
      siteMatchesTab,
      updatePinnedTabs
    }
    : {}
  }
}

module.exports = api
