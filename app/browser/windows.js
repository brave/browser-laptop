/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const Immutable = require('immutable')
const { EventEmitter } = require('events')
const appActions = require('../../js/actions/appActions')
const appStore = require('../../js/stores/appStore')
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
const appConfig = require('../../js/constants/appConfig')
const config = require('../../js/constants/config')
const appDispatcher = require('../../js/dispatcher/appDispatcher')
const platformUtil = require('../common/lib/platformUtil')
const browserWindowUtil = require('../common/lib/browserWindowUtil')
const windowState = require('../common/state/windowState')
const pinnedSitesState = require('../common/state/pinnedSitesState')
const {zoomLevel} = require('../common/constants/toolbarUserInterfaceScale')
const { shouldDebugWindowEvents, shouldDebugTabEvents, shouldDebugStoreActions, disableBufferWindow, disableDeferredWindowLoad } = require('../cmdLine')
const activeTabHistory = require('./activeTabHistory')
const webContentsCache = require('./webContentsCache')

const isDarwin = platformUtil.isDarwin()
const isWindows = platformUtil.isWindows()

const {app, BrowserWindow, ipcMain} = electron

// TODO(bridiver) - set window uuid
let currentWindows = {}
const windowPinnedTabStateMemoize = new WeakMap()
const publicEvents = new EventEmitter()
let lastCreatedWindowIsRendererWindow = false
const renderedWindows = new WeakSet()
let bufferWindowId

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
    if (shouldDebugWindowEvents) {
      console.log(`not running updatePinnedTabs for win ${win.id} since nothing changed since last time`)
    }
    return
  }
  if (shouldDebugWindowEvents) {
    console.log(`performing updatePinnedTabs for win ${win.id} since state did change since last time`)
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
  // pinned sites should always be at the front of the window tab indexes, starting with 0
  let pinnedSiteIndex = -1
  for (const site of statePinnedSitesOrdered.values()) {
    pinnedSiteIndex++
    const existingPinnedTabIdx = pinnedWindowTabs.findIndex(tab => siteMatchesTab(site, tab))
    if (existingPinnedTabIdx !== -1) {
      // if it's already pinned we don't need to consider the tab in further searches
      pinnedWindowTabs = pinnedWindowTabs.remove(existingPinnedTabIdx)
    } else {
      // if it's not already pinned, create new pinned tab
      appActions.createTabRequested({
        url: site.get('location'),
        partitionNumber: site.get('partitionNumber'),
        index: pinnedSiteIndex,
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

function refocusFocusedWindow (win) {
  if (win && !win.isDestroyed()) {
    if (shouldDebugWindowEvents) {
      console.log('focusing on window', win.id)
    }
    win.focus()
  }
}

function showDeferredShowWindow (win) {
  // were we asked to make the window active / foreground?
  // note: do not call win.showInactive if there is no other active window, otherwise this window will
  // never get an entry in taskbar on Windows
  const currentlyFocused = BrowserWindow.getFocusedWindow()
  const shouldShowInactive = win.webContents.browserWindowOptions.inactive && currentlyFocused
  if (shouldShowInactive) {
    // we were asked NOT to show the window active.
    // we should maintain focus on the window which already has it
    if (shouldDebugWindowEvents) {
      console.log('showing deferred window inactive', win.id)
    }
    win.show()
    // Whilst the window will not have focus, it will potentially be
    // on top of the window which already had focus,
    // so re-focus the focused window.
    setImmediate(refocusFocusedWindow.bind(null, currentlyFocused))
  } else {
    // we were asked to show the window active
    if (shouldDebugWindowEvents) {
      console.log('showing deferred window active', win.id)
    }
    win.show()
  }
  if (win.__shouldFullscreen) {
    // this timeout helps with an issue that
    // when a user is loading from state, and
    // has many full screen windows and non fullscreen windows
    // the non fullscreen windows can get opened on top of the fullscreen
    // spaces because macOS has switched away from the desktop space
    setTimeout(() => {
      win.setFullScreen(true)
      if (shouldShowInactive) {
        setImmediate(refocusFocusedWindow.bind(null, currentlyFocused))
      }
    }, 100)
  } else if (win.__shouldMaximize) {
    win.maximize()
  }
  // reset temporary properties on win object
  win.__showWhenRendered = undefined
  win.__shouldFullscreen = undefined
  win.__shouldMaximize = undefined
}

function openFramesInWindow (win, frames, activeFrameKey) {
  if (frames && frames.length) {
    let frameIndex = -1
    for (const frame of frames) {
      frameIndex++
      const tab = webContentsCache.getWebContents(frame.tabId)
      if (frame.tabId != null && frame.guestInstanceId != null) {
        if (shouldDebugTabEvents) {
          console.log('notifyWindowWebContentsAdded: on window create with existing tab', win.id)
        }
        api.notifyWindowWebContentsAdded(win.id, frame)
        if (tab && !tab.isDestroyed()) {
          tab.moveTo(frameIndex, win.id)
        }
      } else {
        appActions.createTabRequested({
          windowId: win.id,
          url: frame.location || frame.src || frame.provisionalLocation || frame.url,
          partitionNumber: frame.partitionNumber,
          isPrivate: frame.isPrivate,
          isTor: frame.isTor || (tab && tab.session && tab.session.partition === appConfig.tor.partition),
          active: activeFrameKey ? frame.key === activeFrameKey : true,
          discarded: frame.unloaded,
          title: frame.title,
          faviconUrl: frame.icon,
          index: frameIndex
        }, false, true)
      }
    }
  }
}

function markWindowCreationTime (windowId) {
  console.time(`windowRender:${windowId}`)
}

function markWindowRenderTime (windowId) {
  console.timeEnd(`windowRender:${windowId}`)
}

const api = {
  init: (state, action) => {
    app.on('browser-window-created', function (event, win) {
      // handle non-renderer windows
      if (!lastCreatedWindowIsRendererWindow) {
        // nothing to do as yet
        return
      }
      lastCreatedWindowIsRendererWindow = false
      let windowId = -1
      if (shouldDebugWindowEvents) {
        console.log(`Window created`)
        // output console log for each event the tab receives
        const oldEmit = win.emit
        win.emit = function () {
          const eventWindowId = win && !win.isDestroyed() ? win.id : `probably ${windowId}`
          console.log(`Window [${eventWindowId}] event '${arguments[0]}'`)
          oldEmit.apply(win, arguments)
        }
      }
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
        win.webContents.on('tab-inserted-at', (e, contents, index, active) => {
          const tabId = contents.getId()
          appActions.tabInsertedToTabStrip(win.id, tabId, index)
          if (shouldDebugWindowEvents) {
            console.log(`window ${win.id} had ${!active ? 'in' : ''}active tab ${tabId} inserted at index ${index}`)
          }
        })
        win.webContents.on('tab-detached-at', (e, index, windowId) => {
          appActions.tabDetachedFromTabStrip(windowId, index)
          if (shouldDebugWindowEvents) {
            console.log(`window ${win.id} had tab at removed at index ${index}`)
          }
        })
        win.webContents.on('tab-strip-empty', () => {
          // must wait for pending tabs to be attached to new window before closing
          // TODO(petemill): race condition if multiple different tabs are moved at the same time
          // ...tab-strip-empty may fire before all of those tabs are inserted to new window
          win.webContents.once('detached-tab-new-window', () => {
            if (shouldDebugWindowEvents) {
              console.log('departing tab made it to new window')
            }
            api.closeWindow(win.id)
          })
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
        // if we have a bufferWindow, the 'window-all-closed'
        // event will not fire once the last window is closed,
        // so close the buffer window if this is the last closed window
        // apart from the buffer window.
        // This would mean that the last window to close is the buffer window, but
        // that will not get saved to state as the last-closed window which should be restored
        // since we won't save state if there are no frames.
        if (!platformUtil.isDarwin() && api.getBufferWindow()) {
          const remainingWindows = api.getAllRendererWindows()
          if (!remainingWindows.length) {
            api.closeBufferWindow()
          }
        }
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
    // create a buffer window
    api.getOrCreateBufferWindow()
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
        if (currentWindows[windowId].__ready && currentWindows[windowId] !== api.getBufferWindow()) {
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

  focus: (windowId) => {
    setImmediate(() => {
      const win = currentWindows[windowId]
      if (win && !win.isDestroyed()) {
        if (win.isMinimized()) {
          win.restore()
        }
        win.focus()
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
        if (win !== api.getBufferWindow()) {
          const state = appStore.getState()
          updatePinnedTabs(win, state)
        }
        win.__ready = true
        win.emit(messages.WINDOW_RENDERER_READY)
      }
    })
  },

  windowRendered: (windowIdOrWin) => {
    const win = windowIdOrWin instanceof electron.BrowserWindow
        ? windowIdOrWin
        : currentWindows[windowIdOrWin]
    if (shouldDebugWindowEvents) {
      markWindowRenderTime(win.id)
      console.log(`Window [${win.id}] rendered`)
    }
    renderedWindows.add(win)
    setImmediate(() => {
      if (win && win.__showWhenRendered && !win.isDestroyed() && !win.isVisible()) {
        if (shouldDebugWindowEvents) {
          console.log('rendered window so showing window')
        }
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
          // do not allow the Buffer Window to be automatically closed
          // e.g. when it has no tabs open
          // In order to fully close the Buffer Window, first it will
          // have to be detached from being the Buffer Window
          if (win.id !== bufferWindowId) {
            win.close()
          }
        }
      })
    } catch (e) {
      // ignore
    }
  },

  /** Specialist function for providing an existing window for
  * Buffer Window. Normally this should not be used as one
  * will automatically be created with `getOrCreateBufferWindow`
  */
  setWindowIsBufferWindow: (dragBufferWindowId) => {
    // close existing buffer window if it exists
    const existingBufferWindow = api.getBufferWindow()
    if (existingBufferWindow) {
      api.closeBufferWindow()
    }
    bufferWindowId = dragBufferWindowId
  },

  clearBufferWindow: (createPinnedTabs = true) => {
    const bufferWindow = api.getBufferWindow()
    bufferWindowId = null
    // Pinned tabs are not created for buffer windows.
    // Now that this window is no longer a buffer window,
    // create the pinned tabs unless explicitly told not to.
    if (createPinnedTabs) {
      const state = appStore.getState()
      updatePinnedTabs(bufferWindow, state)
    }
  },

  closeBufferWindow: () => {
    const win = api.getBufferWindow()
    if (win) {
      if (shouldDebugWindowEvents) {
        console.log(`Buffer Window [${win.id}] requested to be closed`)
      }
      win.close()
      cleanupWindow(bufferWindowId)
      bufferWindowId = null
    } else {
      if (shouldDebugWindowEvents) {
        console.log('closeBufferWindow: nothing to close')
      }
    }
  },

  getBufferWindow: () => {
    const win = currentWindows[bufferWindowId]
    if (win && !win.isDestroyed()) {
      return win
    } else {
      bufferWindowId = null
    }
  },

  getOrCreateBufferWindow: function (options = { }) {
    if (disableBufferWindow) {
      if (shouldDebugWindowEvents) {
        console.log(`getOrCreateBufferWindow: buffer window disabled, not creating one.`)
      }
      return
    }
    // only if we don't have one already
    let win = api.getBufferWindow()
    if (!win) {
      options = Object.assign({ fullscreen: false, show: false }, options)
      win = api.createWindow(options, null, false, null)
      bufferWindowId = win.id
      if (shouldDebugWindowEvents) {
        console.log(`getOrCreateBufferWindow: created buffer window: ${win.id}`)
      }
    } else {
      if (shouldDebugWindowEvents) {
        console.log(`getOrCreateBufferWindow: already had buffer window ${win.id}`)
      }
    }
    return win
  },

  createWindow: function (windowOptionsIn, parentWindow, maximized, frames, immutableState = Immutable.Map(), hideUntilRendered = true, cb = null) {
    if (disableDeferredWindowLoad) {
      hideUntilRendered = false
    }
    const defaultOptions = {
      // hide the window until the window reports that it is rendered
      show: true,
      fullscreenable: true,
      // Neither a frame nor a titlebar
      // frame: false,
      // A frame but no title bar and windows buttons in titlebar 10.10 OSX and up only?
      titleBarStyle: 'hidden-inset',
      autoHideMenuBar: isDarwin || getSetting(settings.AUTO_HIDE_MENU),
      title: appConfig.name,
      frame: !isWindows,
      minWidth: 480,
      minHeight: 300,
      webPreferences: {
        // XXX: Do not edit without security review
        sharedWorker: true,
        partition: 'default'
      }
    }
    const windowOptions = Object.assign(
      defaultOptions,
      windowOptionsIn
    )
    // validate activeFrameKey if provided
    let activeFrameKey = immutableState.get('activeFrameKey')
    if (frames && frames.length && activeFrameKey) {
      const keyIsValid = frames.some(frame => frame.key === activeFrameKey)
      if (!keyIsValid) {
        // make first frame active if invalid key provided
        activeFrameKey = frames[0].key
      }
      immutableState = immutableState.set('activeFrameKey', activeFrameKey)
    }
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
    // use a buffer window if scenario is compatible
    // determining when to use a buffer window and when to create a brand new window
    const bufferWindow = api.getBufferWindow()
    // can't use buffer window if one does not exist yet
    let canUseBufferWindow = !!bufferWindow
    // can't use buffer window if one does not exist
    if (!canUseBufferWindow && shouldDebugWindowEvents) {
      console.log('createWindow: not using buffer window because one did not exist')
    }
    // can't use buffer window if it has not finished rendering
    if (canUseBufferWindow && !renderedWindows.has(bufferWindow)) {
      canUseBufferWindow = false
      if (shouldDebugWindowEvents) {
        console.log('createWindow: not using buffer window because it has not completed render yet')
      }
    }
    // can't use buffer window if we find incompatible options that we do not know how to set for buffer windows
    // (those options would be fine for new windows passed in to BrowserWindow ctor)
    if (canUseBufferWindow && !browserWindowUtil.canSetAllPropertiesOnExistingWindow(windowOptionsIn)) {
      canUseBufferWindow = false
      if (shouldDebugWindowEvents) {
        console.log('createWindow: not using buffer window due to unsupported window creation options', windowOptionsIn)
      }
    }
    // handle using a buffer window as the 'new' window
    if (canUseBufferWindow) {
      bufferWindow.webContents.browserWindowOptions.disposition = windowOptionsIn.disposition
      if (shouldDebugWindowEvents) {
        console.log('createWindow: using buffer window for new window, and setting properties', windowOptionsIn)
      }
      // detach buffer window (pinned tabs will be created)
      api.clearBufferWindow()
      // make a new buffer window to replace this one
      setImmediate(() => {
        if (shouldDebugWindowEvents) {
          console.log('creating replacement buffer window...')
        }
        api.getOrCreateBufferWindow()
      })
      // set desired properties
      browserWindowUtil.setPropertiesOnExistingWindow(bufferWindow, windowOptionsIn)
      // create frames for 'new' window
      openFramesInWindow(bufferWindow, frames, immutableState.get('activeFrameKey'))
      // make fullscreen if applicable, as above
      if (windowOptions.fullscreen) {
        bufferWindow.setFullScreen(true)
      }
      if (maximized) {
        bufferWindow.maximize()
      }
      return
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
    // new-window action handler is sync, so won't be added to any 'renderer collection' we create here
    // by the time the action handler runs.
    // Instead, add a flag to indicate the next-created window is an actual
    // tabbed renderer window
    lastCreatedWindowIsRendererWindow = true
    const win = new electron.BrowserWindow(windowOptions)

    win.loadURL(appUrlUtil.getBraveExtIndexHTML())

    if (shouldDebugWindowEvents) {
      markWindowCreationTime(win.id)
      console.log(`createWindow: new BrowserWindow with ID ${win.id} created with options`, windowOptions)
    }
    // TODO: pass UUID
    publicEvents.emit('new-window-state', win.id, immutableState)
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
          if (shouldDebugWindowEvents) {
            console.log('deferred-show window passed timeout, so showing deferred')
          }
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

      const windowState = (immutableState && immutableState.toJS()) || { }
      windowState.debugTabEvents = shouldDebugTabEvents
      windowState.debugStoreActions = shouldDebugStoreActions

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
        windowState
      })
      e.sender.sendShared(messages.INITIALIZE_WINDOW, mem)
      openFramesInWindow(win, frames, windowState && windowState.activeFrameKey)
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

  getActiveWindow: () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const allOpenWindows = api.getAllRendererWindows()
    if (allOpenWindows.includes(focusedWindow)) {
      return focusedWindow
    }
    // handle no active window, but do have open windows
    if (allOpenWindows && allOpenWindows.length) {
      // use first window
      return allOpenWindows[0]
    }
    // no open windows
    return null
  },

  getActiveWindowId: () => {
    const activeWindow = api.getActiveWindow()
    return activeWindow ? activeWindow.id : windowState.WINDOW_ID_NONE
  },

  /**
   * Provides an array of all Browser Windows which are actual
   * main windows (not background workers), and are not destroyed
   */
  getAllRendererWindows: (includingBufferWindow = false) => {
    return Object.keys(currentWindows)
      .map(key => currentWindows[key])
      .filter(win =>
        win &&
        !win.isDestroyed() &&
        (includingBufferWindow || win !== api.getBufferWindow())
      )
  },

  notifyWindowWebContentsAdded (windowId, frame, tabValue) {
    const win = api.getWindow(windowId)
    if (!win || win.isDestroyed()) {
      console.error(`notifyWindowWebContentsAdded, no window for id ${windowId}`)
      return
    }
    if (!win.webContents || win.webContents.isDestroyed()) {
      console.error(`notifyWindowWebContentsAdded, no window webContents for id ${windowId}`)
      return
    }
    win.webContents.send('new-web-contents-added', frame, tabValue)
  },

  on: (...args) => publicEvents.on(...args),
  off: (...args) => publicEvents.off(...args),
  once: (...args) => publicEvents.once(...args),

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
