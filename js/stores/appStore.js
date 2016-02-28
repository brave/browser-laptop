/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const AppConstants = require('../constants/appConstants')
const AppConfig = require('../constants/appConfig')
const settings = require('../constants/settings')
const SiteUtil = require('../state/siteUtil')
const electron = require('electron')
const app = electron.app
const ipcMain = electron.ipcMain
const messages = require('../constants/messages')
const UpdateStatus = require('../constants/updateStatus')
const BrowserWindow = electron.BrowserWindow
const LocalShortcuts = require('../../app/localShortcuts')
const AppActions = require('../actions/appActions')
const firstDefinedValue = require('../lib/functional').firstDefinedValue
const Serializer = require('../dispatcher/serializer')
const dates = require('../../app/dates')
const path = require('path')
const getSetting = require('../settings').getSetting
const debounce = require('../lib/debounce.js')
const EventEmitter = require('events').EventEmitter
const Immutable = require('immutable')
const diff = require('immutablediff')

// Only used internally
const CHANGE_EVENT = 'app-state-change'

let appState
let lastEmittedState

// TODO cleanup all this createWindow crap
function isModal (browserOpts) {
  // this needs some better checks
  return browserOpts.scrollbars === false
}

function navbarHeight () {
  // TODO there has to be a better way to get this or at least add a test
  return 75
}

const createWindow = (browserOpts, defaults) => {
  const parentWindowKey = browserOpts.parentWindowKey

  browserOpts.width = firstDefinedValue(browserOpts.width, browserOpts.innerWidth, defaults.width)
  // height and innerHeight are the frame webview size
  browserOpts.height = firstDefinedValue(browserOpts.height, browserOpts.innerHeight)
  if (isNaN(browserOpts.height)) {
    // no inner height so check outer height or use default
    browserOpts.height = firstDefinedValue(browserOpts.outerHeight, defaults.height)
  } else {
    // BrowserWindow height is window height so add navbar height
    browserOpts.height = browserOpts.height + navbarHeight()
  }

  browserOpts.x = firstDefinedValue(browserOpts.x, browserOpts.left, browserOpts.screenX)
  browserOpts.y = firstDefinedValue(browserOpts.y, browserOpts.top, browserOpts.screenY)
  delete browserOpts.left
  delete browserOpts.top

  const screen = electron.screen
  const primaryDisplay = screen.getPrimaryDisplay()
  const parentWindow = parentWindowKey ? BrowserWindow.fromId(parentWindowKey) : BrowserWindow.getFocusedWindow()
  const bounds = parentWindow ? parentWindow.getBounds() : primaryDisplay.bounds

  // position on screen should be relative to focused window
  // or the primary display if there is no focused window
  const display = screen.getDisplayNearestPoint(bounds)

  // if no parentWindow, x, y or center is defined then go ahead
  // and center it if it's smaller than the display width
  // typeof and isNaN are used because 0 is falsy
  if (!(parentWindow ||
      browserOpts.center === false ||
      browserOpts.x > 0 ||
      browserOpts.y > 0) &&
      browserOpts.width < display.bounds.width) {
    browserOpts.center = true
  } else {
    browserOpts.center = false
    // don't offset if focused window is at least as big as the screen it's on
    if (bounds.width >= display.bounds.width && bounds.height >= display.bounds.height) {
      browserOpts.x = firstDefinedValue(browserOpts.x, display.bounds.x)
      browserOpts.y = firstDefinedValue(browserOpts.y, display.bounds.y)
    } else {
      browserOpts.x = firstDefinedValue(browserOpts.x, bounds.x + defaults.windowOffset)
      browserOpts.y = firstDefinedValue(browserOpts.y, bounds.y + defaults.windowOffset)
    }

    // make sure the browser won't be outside the viewable area of any display
    // negative numbers aren't allowed so we don't need to worry about that
    const displays = screen.getAllDisplays()
    const maxX = Math.max(...displays.map((display) => { return display.bounds.x + display.bounds.width }))
    const maxY = Math.max(...displays.map((display) => { return display.bounds.y + display.bounds.height }))

    browserOpts.x = Math.min(browserOpts.x, maxX - defaults.windowOffset)
    browserOpts.y = Math.min(browserOpts.y, maxY - defaults.windowOffset)
  }

  const minWidth = isModal(browserOpts) ? defaults.minModalWidth : defaults.minWidth
  const minHeight = isModal(browserOpts) ? defaults.minModalHeight : defaults.minHeight

  // min width and height don't seem to work when the window is first created
  browserOpts.width = browserOpts.width < minWidth ? minWidth : browserOpts.width
  browserOpts.height = browserOpts.height < minHeight ? minHeight : browserOpts.height

  let mainWindow = new BrowserWindow(Object.assign({
    // smaller min size for "modal" windows
    minWidth,
    minHeight,
    // Neither a frame nor a titlebar
    // frame: false,
    // A frame but no title bar and windows buttons in titlebar 10.10 OSX and up only?
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    title: AppConfig.name,
    webPreferences: defaults.webPreferences
  }, browserOpts))

  mainWindow.on('resize', function (evt) {
    // the default window size is whatever the last window resize was
    AppActions.setDefaultWindowSize(evt.sender.getSize())
  })

  mainWindow.on('close', function () {
    LocalShortcuts.unregister(mainWindow)
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  mainWindow.on('scroll-touch-begin', function (e) {
    mainWindow.webContents.send('scroll-touch-begin')
  })

  mainWindow.on('scroll-touch-end', function (e) {
    mainWindow.webContents.send('scroll-touch-end')
  })

  mainWindow.on('app-command', function(e, cmd) {
    switch (cmd) {
      case 'browser-backward':
        mainWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_BACK)
        return
      case 'browser-forward':
        mainWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_FORWARD)
        return
    }
  })

  LocalShortcuts.register(mainWindow)
  return mainWindow
}

const normalizeAppState = appState => appState.merge({
  defaultWindowWidth: undefined,
  defaultWindowHeight: undefined
})

class AppStore extends EventEmitter {
  getState () {
    return appState
  }

  emitFullWindowState (wnd) {
    wnd.webContents.send(messages.APP_STATE_CHANGE, { state: appState.toJS() })
    lastEmittedState = appState
  }

  emitChanges (emitFullState) {
    if (lastEmittedState) {
      const d = diff(normalizeAppState(lastEmittedState), normalizeAppState(appState))
      if (!d.isEmpty()) {
        BrowserWindow.getAllWindows().forEach(wnd =>
          wnd.webContents.send(messages.APP_STATE_CHANGE, { stateDiff: d.toJS() }))
        lastEmittedState = appState
      }
    }

    this.emit(CHANGE_EVENT)
  }

  addChangeListener (callback) {
    this.on(CHANGE_EVENT, callback)
  }

  removeChangeListener (callback) {
    this.removeListener(CHANGE_EVENT, callback)
  }
}

function windowDefaults () {
  setDefaultWindowSize()

  return {
    show: false,
    width: appState.get('defaultWindowWidth'),
    height: appState.get('defaultWindowHeight'),
    minWidth: 500,
    minHeight: 300,
    minModalHeight: 100,
    minModalWidth: 100,
    windowOffset: 20,
    webPreferences: {
      sharedWorker: true,
      partition: 'main-1'
    }
  }
}

/**
 * set the default width and height if they
 * haven't been initialized yet
 */
function setDefaultWindowSize () {
  const screen = electron.screen
  const primaryDisplay = screen.getPrimaryDisplay()
  if (!appState.get('defaultWindowWidth') && !appState.get('defaultWindowHeight')) {
    appState = appState.set('defaultWindowWidth', primaryDisplay.workAreaSize.width)
    appState = appState.set('defaultWindowHeight', primaryDisplay.workAreaSize.height)
  }
}

const appStore = new AppStore()
const emitChanges = debounce(appStore.emitChanges.bind(appStore), 5)

const handleAppAction = (action) => {
  switch (action.actionType) {
    case AppConstants.APP_SET_STATE:
      appState = action.appState
      break
    case AppConstants.APP_NEW_WINDOW:
      const frameOpts = action.frameOpts && action.frameOpts.toJS()
      const browserOpts = (action.browserOpts && action.browserOpts.toJS()) || {}

      const mainWindow = createWindow(browserOpts, windowDefaults())
      const homepageSetting = getSetting(settings.HOMEPAGE)

      // initialize frames state
      let frames = []
      if (frameOpts) {
        if (frameOpts.forEach) {
          frames = frameOpts
        } else {
          frames.push(frameOpts)
        }
      } else if (getSetting(settings.STARTUP_MODE) === 'homePage' && homepageSetting) {
        frames = homepageSetting.split('|').map(homepage => {
          return {
            location: homepage
          }
        })
      }

      const willNavigateHandler = (whitelistedUrl, e, url) => {
        if (url !== whitelistedUrl) {
          e.preventDefault()
        }
      }

      const whitelistedUrl = process.env.NODE_ENV === 'development'
        ? 'file://' + path.resolve(__dirname, '..', '..') + '/app/index-dev.html'
        : 'file://' + path.resolve(__dirname, '..', '..') + '/app/index.html'
      mainWindow.loadURL(whitelistedUrl)
      mainWindow.webContents.on('will-navigate', willNavigateHandler.bind(null, whitelistedUrl))
      mainWindow.webContents.on('did-frame-finish-load', (e, isMainFrame) => {
        if (isMainFrame) {
          lastEmittedState = appState
          mainWindow.webContents.send(messages.INITIALIZE_WINDOW, appState.toJS(), frames, action.restoredState)
          if (action.cb) {
            action.cb()
          }
        }
      })
      mainWindow.show()
      break
    case AppConstants.APP_CLOSE_WINDOW:
      const appWindow = BrowserWindow.fromId(action.appWindowId)
      appWindow.close()
      break
    case AppConstants.APP_ADD_SITE:
      if (action.siteDetail.constructor === Immutable.List) {
        action.siteDetail.forEach(s =>
          appState = appState.set('sites', SiteUtil.addSite(appState.get('sites'), s, action.tag)))
      } else {
        appState = appState.set('sites', SiteUtil.addSite(appState.get('sites'), action.siteDetail, action.tag, action.originalSiteDetail))
      }
      break
    case AppConstants.APP_REMOVE_SITE:
      appState = appState.set('sites', SiteUtil.removeSite(appState.get('sites'), action.siteDetail, action.tag))
      break
    case AppConstants.APP_MOVE_SITE:
      appState = appState.set('sites', SiteUtil.moveSite(appState.get('sites'), action.sourceDetail, action.destinationDetail, action.prepend))
      break
    case AppConstants.APP_SET_DEFAULT_WINDOW_SIZE:
      appState = appState.set('defaultWindowWidth', action.size[0])
      appState = appState.set('defaultWindowHeight', action.size[1])
      break
    case AppConstants.APP_SET_DATA_FILE_ETAG:
      appState = appState.setIn([action.resourceName, 'etag'], action.etag)
      break
    case AppConstants.APP_UPDATE_LAST_CHECK:
      appState = appState.setIn(['updates', 'lastCheckTimestamp'], (new Date()).getTime())
      appState = appState.setIn(['updates', 'lastCheckYMD'], dates.todayYMD())
      appState = appState.setIn(['updates', 'lastCheckWOY'], dates.todayWOY())
      appState = appState.setIn(['updates', 'lastCheckMonth'], dates.todayMonth())
      appState = appState.setIn(['updates', 'firstCheckMade'], true)
      break
    case AppConstants.APP_SET_UPDATE_STATUS:
      if (action.status !== undefined) {
        appState = appState.setIn(['updates', 'status'], action.status)
      }
      // Auto reset back to false because it'll be set to true on each new check
      if (action.verbose !== undefined) {
        appState = appState.setIn(['updates', 'verbose'], action.verbose)
      }
      if (action.metadata !== undefined) {
        appState = appState.setIn(['updates', 'metadata'], action.metadata)
      }
      if (action.status === UpdateStatus.UPDATE_APPLYING_RESTART) {
        app.quit()
      }
      break
    case AppConstants.APP_SET_RESOURCE_ENABLED:
      appState = appState.setIn([action.resourceName, 'enabled'], action.enabled)
      break
    case AppConstants.APP_SET_DATA_FILE_LAST_CHECK:
      appState = appState.mergeIn([action.resourceName], {
        lastCheckVersion: action.lastCheckVersion,
        lastCheckDate: action.lastCheckDate
      })
      break
    case AppConstants.APP_CHANGE_SETTING:
      appState = appState.setIn(['settings', action.key], action.value)
      break
    default:
  }

  emitChanges()
}

// Register callback to handle all updates
ipcMain.on(messages.APP_ACTION, (event, action) => {
  handleAppAction(Serializer.deserialize(action))
})

process.on(messages.APP_ACTION, handleAppAction)

module.exports = appStore
