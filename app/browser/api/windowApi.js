/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const path = require('path')
const assert = require('assert')
const Immutable = require('immutable')
const BrowserWindow = electron.BrowserWindow

// Constants
const appConfig = require('../../../js/constants/appConfig')
const messages = require('../../../js/constants/messages')
const settings = require('../../../js/constants/settings')

// Utils
const platformUtil = require('../../common/lib/platformUtil')
const {isImmutable} = require('../../common/state/immutableUtil')
const appUrlUtil = require('../../../js/lib/appUrlUtil')
const {firstDefinedValue} = require('../../../js/lib/functional')
const {getSetting} = require('../../../js/settings')
const {initWindowCacheState} = require('../../sessionStoreShutdown')
const {zoomLevel} = require('../../common/constants/toolbarUserInterfaceScale')

const isDarwin = platformUtil.isDarwin()
const isWindows = platformUtil.isWindows()

/**
 * set the default width and height if they
 * haven't been initialized yet
 */
const setDefaultWindowSize = (state) => {
  if (!state) {
    return
  }

  const screen = electron.screen
  const primaryDisplay = screen.getPrimaryDisplay()
  if (!state.getIn(['defaultWindowParams', 'width']) && !state.get('defaultWindowWidth') &&
    !state.getIn(['defaultWindowParams', 'height']) && !state.get('defaultWindowHeight')) {
    state = state.setIn(['defaultWindowParams', 'width'], primaryDisplay.workAreaSize.width)
    state = state.setIn(['defaultWindowParams', 'height'], primaryDisplay.workAreaSize.height)
  }

  return state
}

const windowDefaults = (state) => {
  return {
    show: false,
    width: state.getIn(['defaultWindowParams', 'width']) || state.get('defaultWindowWidth'),
    height: state.getIn(['defaultWindowParams', 'height']) || state.get('defaultWindowHeight'),
    x: state.getIn(['defaultWindowParams', 'x']) || undefined,
    y: state.getIn(['defaultWindowParams', 'y']) || undefined,
    minWidth: 480,
    minHeight: 300,
    minModalHeight: 100,
    minModalWidth: 100,
    windowOffset: 20,
    webPreferences: {
      sharedWorker: true,
      nodeIntegration: false,
      partition: 'default',
      webSecurity: false,
      allowFileAccessFromFileUrls: true,
      allowUniversalAccessFromFileUrls: true
    }
  }
}

function isModal (browserOpts) {
  // this needs some better checks
  return browserOpts.scrollbars === false
}

const navbarHeight = () => {
  // TODO there has to be a better way to get this or at least add a test
  return 75
}

/**
 * Determine window dimensions (width / height)
 */
const setWindowDimensions = (browserOpts, defaults, immutableWindowState) => {
  assert(isImmutable(immutableWindowState))
  if (immutableWindowState.getIn(['ui', 'size'])) {
    browserOpts.width = firstDefinedValue(browserOpts.width, immutableWindowState.getIn(['ui', 'size', 0]))
    browserOpts.height = firstDefinedValue(browserOpts.height, immutableWindowState.getIn(['ui', 'size', 1]))
  }
  browserOpts.width = firstDefinedValue(browserOpts.width, browserOpts.innerWidth, defaults.width)
  // height and innerHeight are the frame webview size
  browserOpts.height = firstDefinedValue(browserOpts.height, browserOpts.innerHeight)
  if (typeof browserOpts.height === 'number') {
    // add navbar height to get total height for BrowserWindow
    browserOpts.height = browserOpts.height + navbarHeight()
  } else {
    // no inner height so check outer height or use default
    browserOpts.height = firstDefinedValue(browserOpts.outerHeight, defaults.height)
  }
  return browserOpts
}

/**
 * Determine window position (x / y)
 */
const setWindowPosition = (browserOpts, defaults, immutableWindowState) => {
  if (browserOpts.positionByMouseCursor) {
    const screenPos = electron.screen.getCursorScreenPoint()
    browserOpts.x = screenPos.x
    browserOpts.y = screenPos.y
  } else if (immutableWindowState.getIn(['ui', 'position'])) {
    // Position comes from window state
    browserOpts.x = firstDefinedValue(browserOpts.x, immutableWindowState.getIn(['ui', 'position', 0]))
    browserOpts.y = firstDefinedValue(browserOpts.y, immutableWindowState.getIn(['ui', 'position', 1]))
  } else if (typeof defaults.x === 'number' && typeof defaults.y === 'number') {
    // Position comes from the default position
    browserOpts.x = firstDefinedValue(browserOpts.x, defaults.x)
    browserOpts.y = firstDefinedValue(browserOpts.y, defaults.y)
  } else {
    // Default the position
    browserOpts.x = firstDefinedValue(browserOpts.x, browserOpts.left, browserOpts.screenX)
    browserOpts.y = firstDefinedValue(browserOpts.y, browserOpts.top, browserOpts.screenY)
  }
  return browserOpts
}

const createWindow = (action, state) => {
  const frameOpts = (action.frameOpts && action.frameOpts.toJS()) || {}
  let browserOpts = (action.browserOpts && action.browserOpts.toJS()) || {}
  const immutableWindowState = action.restoredState || Immutable.Map()
  state = setDefaultWindowSize(state)
  const defaults = windowDefaults(state)

  browserOpts = setWindowDimensions(browserOpts, defaults, immutableWindowState)
  browserOpts = setWindowPosition(browserOpts, defaults, immutableWindowState)

  delete browserOpts.left
  delete browserOpts.top

  const screen = electron.screen
  const primaryDisplay = screen.getPrimaryDisplay()
  const parentWindowKey = browserOpts.parentWindowKey
  const parentWindow = parentWindowKey ? BrowserWindow.fromId(parentWindowKey) : BrowserWindow.getFocusedWindow()
  const bounds = parentWindow ? parentWindow.getBounds() : primaryDisplay.bounds

  // position on screen should be relative to focused window
  // or the primary display if there is no focused window
  const display = screen.getDisplayNearestPoint(bounds)

  // if no parentWindow, x, y or center is defined then go ahead
  // and center it if it's smaller than the display width
  // typeof and isNaN are used because 0 is falsey
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

  const autoHideMenuBarSetting = isDarwin || getSetting(settings.AUTO_HIDE_MENU)

  const windowProps = {
    // smaller min size for "modal" windows
    minWidth,
    minHeight,
    // Neither a frame nor a titlebar
    // frame: false,
    // A frame but no title bar and windows buttons in titlebar 10.10 OSX and up only?
    titleBarStyle: 'hidden-inset',
    autoHideMenuBar: autoHideMenuBarSetting,
    title: appConfig.name,
    webPreferences: defaults.webPreferences,
    frame: !isWindows
  }

  if (process.platform === 'linux') {
    windowProps.icon = path.join(__dirname, '..', '..', 'res', 'app.png')
  }

  const homepageSetting = getSetting(settings.HOMEPAGE)
  const startupSetting = getSetting(settings.STARTUP_MODE)
  const toolbarUserInterfaceScale = getSetting(settings.TOOLBAR_UI_SCALE)

  setImmediate(() => {
    let mainWindow = new BrowserWindow(Object.assign(windowProps, browserOpts, {disposition: frameOpts.disposition}))
    let restoredImmutableWindowState = action.restoredState
    initWindowCacheState(mainWindow.id, restoredImmutableWindowState)

    // initialize frames state
    let frames = Immutable.List()
    if (restoredImmutableWindowState) {
      frames = restoredImmutableWindowState.get('frames')
      restoredImmutableWindowState = restoredImmutableWindowState.set('frames', Immutable.List())
      restoredImmutableWindowState = restoredImmutableWindowState.set('tabs', Immutable.List())
    } else {
      if (frameOpts && Object.keys(frameOpts).length > 0) {
        if (frameOpts.forEach) {
          frames = Immutable.fromJS(frameOpts)
        } else {
          frames = frames.push(Immutable.fromJS(frameOpts))
        }
      } else if (startupSetting === 'homePage' && homepageSetting) {
        frames = Immutable.fromJS(homepageSetting.split('|').map((homepage) => {
          return {
            location: homepage
          }
        }))
      }
    }

    if (frames.size === 0) {
      frames = Immutable.fromJS([{}])
    }

    if (immutableWindowState.getIn(['ui', 'isMaximized'])) {
      mainWindow.maximize()
    }

    if (immutableWindowState.getIn(['ui', 'isFullScreen'])) {
      mainWindow.setFullScreen(true)
    }

    mainWindow.webContents.on('did-finish-load', (e) => {
      const appStore = require('../../../js/stores/appStore')
      mainWindow.webContents.setZoomLevel(zoomLevel[toolbarUserInterfaceScale] || 0.0)

      const mem = muon.shared_memory.create({
        windowValue: {
          disposition: frameOpts.disposition,
          id: mainWindow.id
        },
        appState: appStore.getLastEmmitedState().toJS(),
        frames: frames.toJS(),
        windowState: (restoredImmutableWindowState && restoredImmutableWindowState.toJS()) || undefined})

      e.sender.sendShared(messages.INITIALIZE_WINDOW, mem)
      if (action.cb) {
        action.cb()
      }
    })

    mainWindow.on('ready-to-show', () => {
      mainWindow.show()
    })

    mainWindow.loadURL(appUrlUtil.getBraveExtIndexHTML())
  })

  return state
}

module.exports = {
  createWindow
}
