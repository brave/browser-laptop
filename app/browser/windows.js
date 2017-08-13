/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {app, BrowserWindow, ipcMain} = require('electron')
const appActions = require('../../js/actions/appActions')
const appUrlUtil = require('../../js/lib/appUrlUtil')
const {getLocationIfPDF} = require('../../js/lib/urlutil')
const debounce = require('../../js/lib/debounce')
const {getSetting} = require('../../js/settings')
const locale = require('../locale')
const LocalShortcuts = require('../localShortcuts')
const {makeImmutable} = require('../common/state/immutableUtil')
const {getPinnedTabsByWindowId} = require('../common/state/tabState')
const messages = require('../../js/constants/messages')
const settings = require('../../js/constants/settings')
const windowState = require('../common/state/windowState')
const Immutable = require('immutable')
const pinnedSitesState = require('../common/state/pinnedSitesState')
const pinnedSitesUtil = require('../common/lib/pinnedSitesUtil')

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
  const windowValue = getWindowValue(windowId)
  if (windowValue) {
    appActions.windowUpdated(windowValue)
  }
}

const updatePinnedTabs = (win) => {
  if (win.webContents.browserWindowOptions.disposition === 'new-popup') {
    return
  }

  const appStore = require('../../js/stores/appStore')
  const state = appStore.getState()
  const windowId = win.id
  const pinnedSites = pinnedSitesState.getSites(state).map(site => pinnedSitesUtil.getPinnedSiteProps(site))
  const pinnedTabs = getPinnedTabsByWindowId(state, windowId)

  pinnedSites.filter((site) =>
    pinnedTabs.find((tab) =>
      getLocationIfPDF(tab.get('url')) === site.get('location') &&
      (tab.get('partitionNumber') || 0) === (site.get('partitionNumber') || 0))).forEach((site) => {
        win.__alreadyPinnedSites = win.__alreadyPinnedSites.add(site)
      })

  const sitesToAdd = pinnedSites.filter((site) =>
    !win.__alreadyPinnedSites.find((pinned) => pinned.equals(site)))

  sitesToAdd.forEach((site) => {
    win.__alreadyPinnedSites = win.__alreadyPinnedSites.add(site)
    appActions.createTabRequested({
      url: site.get('location'),
      partitionNumber: site.get('partitionNumber'),
      pinned: true,
      active: false,
      windowId
    })
  })

  const sitesToClose = win.__alreadyPinnedSites.filter((pinned) =>
    !pinnedSites.find((site) => pinned.equals(site)))

  sitesToClose
    .forEach((site) => {
      const tab = pinnedTabs.find((tab) =>
        tab.get('url') === site.get('location') &&
        (tab.get('partitionNumber') || 0) === (site.get('partitionNumber') || 0))
      if (tab) {
        appActions.tabCloseRequested(tab.get('tabId'), true)
      }
      win.__alreadyPinnedSites = win.__alreadyPinnedSites.remove(site)
    })
}

const api = {
  init: (state, action) => {
    app.on('browser-window-created', function (event, win) {
      let windowId = -1
      const updateWindowMove = debounce(updateWindow, 100)
      const updateWindowDebounce = debounce(updateWindow, 5)

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
              appActions.hideMessageBox(message)
              ipcMain.removeListener(messages.NOTIFICATION_RESPONSE, notificationResponseCallback)
            }
          })

          appActions.showNotification({
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

        appActions.windowCreated(windowValue)
      })
      win.once('closed', () => {
        cleanupWindow(windowId)
      })
      win.on('blur', () => {
        appActions.windowBlurred(windowId)
        updateWindowDebounce(windowId)
      })
      win.on('focus', () => {
        appActions.windowFocused(windowId)
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
        const size = win.getSize()
        const position = win.getPosition()
        // NOTE: the default window size is whatever the last window resize was
        appActions.defaultWindowParamsChanged(size, position)
      })
      win.on('move', () => {
        updateWindowMove(windowId)
        const size = win.getSize()
        const position = win.getPosition()
        // NOTE: the default window position is whatever the last window move was
        appActions.defaultWindowParamsChanged(size, position)
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
      for (let windowId in currentWindows) {
        if (currentWindows[windowId].__ready) {
          updatePinnedTabs(currentWindows[windowId])
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
        win.__alreadyPinnedSites = new Immutable.Set()
        updatePinnedTabs(win)
        win.__ready = true
      }
    })
  },

  closeWindow: (state, windowId) => {
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
    return windowState.removeWindowByWindowId(state, windowId)
  },

  getWindow: (windowId) => {
    return currentWindows[windowId]
  },

  getActiveWindowId: () => {
    if (BrowserWindow.getFocusedWindow()) {
      return BrowserWindow.getFocusedWindow().id
    }

    return windowState.WINDOW_ID_NONE
  }
}

module.exports = api
