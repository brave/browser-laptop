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
const pinnedSitesState = require('../common/state/pinnedSitesState')
const windowActions = require('../../js/actions/windowActions')

// TODO(bridiver) - set window uuid
let currentWindows = {}

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
    appActions.windowUpdated(windowValue, updateDefault)
    windowActions.onWindowUpdate(windowId, windowValue)
  }
}

const siteMatchesTab = (site, tab) => {
  const matchesLocation = getLocationIfPDF(tab.get('url')) === site.get('location')
  const matchesPartition = tab.get('partitionNumber', 0) === site.get('partitionNumber', 0)
  return matchesLocation && matchesPartition
}

const updatePinnedTabs = (win) => {
  if (win.webContents.browserWindowOptions.disposition === 'new-popup') {
    return
  }
  const appStore = require('../../js/stores/appStore')
  const state = appStore.getState()
  const windowId = win.id
  const pinnedSites = pinnedSitesState.getSites(state)
  let pinnedWindowTabs = getPinnedTabsByWindowId(state, windowId)
  // sites are instructions of what should be pinned
  // tabs are sites our window already has pinned
  // for each site which should be pinned, find if it's already pinned
  for (const site of pinnedSites.values()) {
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
        windowActions.onWindowUpdate(windowId, windowValue)
      })
      win.once('closed', () => {
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
        updateWindowDebounce(windowId, true)
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
        updatePinnedTabs(win)
        win.__ready = true
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
