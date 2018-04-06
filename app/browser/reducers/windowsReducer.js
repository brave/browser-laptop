/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const path = require('path')
const assert = require('assert')
const Immutable = require('immutable')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const windowConstants = require('../../../js/constants/windowConstants')

// State
const windowState = require('../../common/state/windowState')

// Utils
const windows = require('../windows')
const sessionStoreShutdown = require('../../sessionStoreShutdown')
const {makeImmutable, isImmutable} = require('../../common/state/immutableUtil')
const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const firstDefinedValue = require('../../../js/lib/functional').firstDefinedValue
const settings = require('../../../js/constants/settings')
const getSetting = require('../../../js/settings').getSetting

// TODO cleanup all this createWindow crap
function isModal (browserOpts) {
  // this needs some better checks
  return browserOpts.scrollbars === false
}

const navbarHeight = () => {
  // TODO there has to be a better way to get this or at least add a test
  // TODO try creating a window and measuring the difference between window and content area
  // and updating this number with that value once the first window is created
  return 75
}

function clearFramesFromWindowState (windowState) {
  return windowState
    .set('frames', Immutable.List())
    .set('tabs', Immutable.List())
}

/**
 * Determine the frame(s) to be loaded in a new window
 * based on user preferences
 */
function getFramesForNewWindow () {
  const startupSetting = getSetting(settings.STARTUP_MODE)
  const homepageSetting = getSetting(settings.HOMEPAGE)
  if (startupSetting === 'homePage' && homepageSetting) {
    return homepageSetting
      .split('|')
      .map((homepage) => ({
        location: homepage
      }))
  }
  return [ { } ]
}

/**
 * Determine window dimensions (width / height)
 */
const setWindowDimensions = (browserOpts, defaults, immutableWindowState) => {
  assert(isImmutable(immutableWindowState))
  const windowInfoState = immutableWindowState.get('windowInfo')
  if (windowInfoState) {
    browserOpts.width = firstDefinedValue(browserOpts.width, windowInfoState.get('width'))
    browserOpts.height = firstDefinedValue(browserOpts.height, windowInfoState.get('height'))
  } else {
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
    // ensure only valid BrowserWindow opts remain in browserOpts
    delete browserOpts.positionByMouseCursor
  } else if (immutableWindowState.getIn(['windowInfo'])) {
    // Position comes from window state
    browserOpts.x = firstDefinedValue(browserOpts.x, immutableWindowState.getIn(['windowInfo', 'left']))
    browserOpts.y = firstDefinedValue(browserOpts.y, immutableWindowState.getIn(['windowInfo', 'top']))
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

const setMaximized = (state, browserOpts, immutableWindowState) => {
  if (Object.keys(browserOpts).length > 0 && !browserOpts.checkMaximized) {
    return false
  }
  delete browserOpts.checkMaximized
  if (immutableWindowState.getIn(['windowInfo'])) {
    return immutableWindowState.getIn(['windowInfo', 'state']) === 'maximized'
  }

  return state.getIn(['defaultWindowParams', 'maximized']) || false
}

function windowDefaults (state) {
  return {
    width: state.getIn(['defaultWindowParams', 'width']) || state.get('defaultWindowWidth'),
    height: state.getIn(['defaultWindowParams', 'height']) || state.get('defaultWindowHeight'),
    x: state.getIn(['defaultWindowParams', 'x']) || undefined,
    y: state.getIn(['defaultWindowParams', 'y']) || undefined,
    minWidth: 480,
    minHeight: 300,
    minModalHeight: 100,
    minModalWidth: 100,
    windowOffset: 20
  }
}

/**
 * set the default width and height if they
 * haven't been initialized yet
 */
function setDefaultWindowSize (state) {
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

const handleCreateWindowAction = (state, action) => {
  const frameOpts = (action.get('frameOpts') || Immutable.Map()).toJS()
  let browserOpts = (action.get('browserOpts') || Immutable.Map()).toJS()
  let immutableWindowState = action.get('restoredState') || Immutable.Map()
  state = setDefaultWindowSize(state)
  const defaults = windowDefaults(state)
  const isMaximized = setMaximized(state, browserOpts, immutableWindowState)

  browserOpts = setWindowDimensions(browserOpts, defaults, immutableWindowState)
  browserOpts = setWindowPosition(browserOpts, defaults, immutableWindowState)

  delete browserOpts.left
  delete browserOpts.top

  // decide which bounds to restrict new window to
  const screen = electron.screen
  // use primary display by default
  let primaryDisplay = screen.getPrimaryDisplay()
  // can override with provided x, y coords
  if (browserOpts.x != null && browserOpts.y != null && browserOpts.width != null && browserOpts.height != null) {
    const matchingDisplay = screen.getDisplayMatching({
      x: browserOpts.x,
      y: browserOpts.y,
      width: browserOpts.width,
      height: browserOpts.height
    })
    if (matchingDisplay != null) {
      primaryDisplay = matchingDisplay
    }
  }
  // always override with parent window if present
  const parentWindowKey = browserOpts.parentWindowKey
  const parentWindow = parentWindowKey
    ? BrowserWindow.fromId(parentWindowKey)
    : BrowserWindow.getFocusedWindow()
  const bounds = parentWindow ? parentWindow.getBounds() : primaryDisplay.bounds

  // decide which screen to position on
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

  const windowProps = {
    // smaller min size for "modal" windows
    minWidth,
    minHeight,
    disposition: frameOpts.disposition
  }

  if (process.platform === 'linux') {
    windowProps.icon = path.join(__dirname, '..', '..', '..', 'res', 'app.png')
  }

  if (immutableWindowState.getIn(['windowInfo', 'state']) === 'fullscreen') {
    windowProps.fullscreen = true
  }
  // continue with window creation process outside of store action handler
  setImmediate(() => {
    // decide which frames to load in the window
    let frames
    // handle frames from restored state
    const immutableFrames = immutableWindowState.get('frames')
    if (Immutable.List.isList(immutableFrames) && immutableFrames.count()) {
      frames = immutableFrames.toJS()
    } else {
      // handle frames from action
      // can be single object or multiple in array
      if (frameOpts && Object.keys(frameOpts).length) {
        if (Array.isArray(frameOpts)) {
          frames = frameOpts
        } else {
          frames = [ frameOpts ]
        }
      } else {
        // handle nothing provided, so follow 'new tab' preferences
        frames = getFramesForNewWindow()
      }
    }
    // window does not need to receive frames as part of initial state
    immutableWindowState = clearFramesFromWindowState(immutableWindowState)
    // allow override of defaults with incoming action argument
    const windowOptions = Object.assign(windowProps, browserOpts)
    // instruct muon to create window
    windows.createWindow(windowOptions, parentWindow, isMaximized, frames, immutableWindowState, true, action.cb)
  })
  return state
}

const windowsReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE:
      state = windows.init(state, action)
      break
    case appConstants.APP_NEW_WINDOW:
      state = handleCreateWindowAction(state, action)
      break
    case appConstants.APP_WINDOW_READY:
      windows.windowReady(action.get('windowId'))
      break
    case appConstants.APP_WINDOW_RENDERED:
      windows.windowRendered(action.get('windowId'))
      break
    case appConstants.APP_TAB_UPDATED:
      if (immutableAction.getIn(['changeInfo', 'pinned']) != null) {
        setImmediate(() => {
          windows.pinnedTabsChanged()
        })
      }
      break
    case appConstants.APP_CLOSE_WINDOW:
      windows.closeWindow(action.get('windowId'))
      break
    case appConstants.APP_WINDOW_CLOSED:
      state = windowState.removeWindow(state, action)
      const windowId = action.get('windowId')
      sessionStoreShutdown.removeWindowFromCache(windowId)
      break
    case appConstants.APP_WINDOW_CREATED:
    case appConstants.APP_WINDOW_RESIZED:
      {
        state = windowState.maybeCreateWindow(state, action)
        break
      }
    case appConstants.APP_TAB_STRIP_EMPTY:
      windows.closeWindow(action.get('windowId'))
      break
    case appConstants.APP_WINDOW_UPDATED:
      state = windowState.maybeCreateWindow(state, action)
      if (action.get('updateDefault')) {
        state = state
          .setIn(['defaultWindowParams', 'width'], action.getIn(['windowValue', 'width']))
          .setIn(['defaultWindowParams', 'height'], action.getIn(['windowValue', 'height']))
          .setIn(['defaultWindowParams', 'x'], action.getIn(['windowValue', 'x']))
          .setIn(['defaultWindowParams', 'y'], action.getIn(['windowValue', 'y']))
          .setIn(['defaultWindowParams', 'maximized'], action.getIn(['windowValue', 'state']) === 'maximized')
      }
      break
    case windowConstants.WINDOW_SHOULD_SET_TITLE:
      windows.setTitle(action.get('windowId'), action.get('title'))
      break
    case windowConstants.WINDOW_SHOULD_MINIMIZE:
      windows.minimize(action.get('windowId'))
      break
    case windowConstants.WINDOW_SHOULD_MAXIMIZE:
      windows.maximize(action.get('windowId'))
      break
    case windowConstants.WINDOW_SHOULD_UNMAXIMIZE:
      windows.unmaximize(action.get('windowId'))
      break
    case windowConstants.WINDOW_SHOULD_EXIT_FULL_SCREEN:
      windows.setFullScreen(action.get('windowId'), false)
      break
    case windowConstants.WINDOW_SHOULD_OPEN_DEV_TOOLS:
      windows.openDevTools(action.get('windowId'))
      break
  }
  return state
}

module.exports = windowsReducer
