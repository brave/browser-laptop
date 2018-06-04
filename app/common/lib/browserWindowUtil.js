/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/.
*/

const electron = require('electron')
const { isDarwin, isLinux } = require('./platformUtil.js')

const { app, remote, nativeImage, BrowserWindow } = electron
let screen
function initScreen () {
  // work with both in-process api and inter-process api
  screen = electron.screen
  if (!screen && remote) {
    screen = remote.screen
  }
}
if (app && !app.isReady()) {
  app.on('ready', initScreen)
} else {
  initScreen()
}

// assume Windows and macOS have 0px frame sizes
let _getWindowFrameSize = !isLinux() ? Promise.resolve({ left: 0, top: 0 }) : null

function calculateWindowFrameSize () {
  return new Promise(function (resolve, reject) {
    const testWindow = new BrowserWindow({
      width: 0,
      height: 0,
      minimumWidth: 0,
      minimumHeight: 0,
      x: 100,
      y: 100,
      show: false,
      frame: true
    })
    const initial = testWindow.getPosition()
    testWindow.once('show', () => {
      testWindow.once('move', () => {
        console.log('getFrameSize move', initial, testWindow.getPosition())
        const afterShown = testWindow.getPosition()
        testWindow.hide()
        testWindow.close()
        resolve({
          left: afterShown[0] - initial[0],
          top: afterShown[1] - initial[1]
        })
      })
    })
    testWindow.showInactive()
  })
}

function getWindowFrameSize () {
  // do not start calculating until something has asked for the data,
  // but cache the result (only perform the calculation once)
  _getWindowFrameSize = _getWindowFrameSize || calculateWindowFrameSize()
  return _getWindowFrameSize
}

/**
 * Determines the screen point for a window's client point
 */
function getScreenPointAtWindowClientPoint (browserWindow, clientPoint) {
  const contentPosition = browserWindow.getContentBounds()
  const x = Math.floor(contentPosition.x + clientPoint.x)
  const y = Math.floor(contentPosition.y + clientPoint.y)
  return { x, y }
}

function getWindowClientPointAtScreenPoint (browserWindow, screenPoint) {
  const contentPosition = browserWindow.getContentBounds()
  return {
    x: screenPoint.x - contentPosition.x,
    y: screenPoint.y - contentPosition.y
  }
}

function getWindowClientSize (browserWindow) {
  const [width, height] = browserWindow.getContentSize()
  return {
    width,
    height
  }
}

/**
 * Gets the window's client position of the mouse cursor
 */
function getWindowClientPointAtCursor (browserWindow) {
  return getWindowClientPointAtScreenPoint(browserWindow, screen.getCursorScreenPoint())
}

/**
 * Determines where a window should be positioned
 * given the requirement that a client position is
 * at a given screen position
 *
 * @param {*} screenPoint - the screen position
 * @param {*} clientPoint - the client position
 */
async function getWindowPositionForClientPointAtScreenPoint (screenPoint, clientPoint) {
  const frameSize = await getWindowFrameSize()
  const x = Math.floor(screenPoint.x - clientPoint.x - frameSize.left)
  const y = Math.floor(screenPoint.y - clientPoint.y - frameSize.top)
  return { x, y }
}

/**
 * Determines where a window should be positioned
 * given the requirement that a client position is
 * at the current cursor poisition
 *
 * @param {*} clientPoint - the client position
 */
function getWindowPositionForClientPointAtCursor (clientPoint) {
  return getWindowPositionForClientPointAtScreenPoint(screen.getCursorScreenPoint(), clientPoint)
}

function moveClientPositionToMouseCursor (browserWindow, clientPoint, {
  cursorScreenPoint = screen.getCursorScreenPoint(),
  animate = false
} = {}) {
  return moveClientPositionToScreenPoint(browserWindow, clientPoint, cursorScreenPoint, { animate })
}

async function moveClientPositionToScreenPoint (browserWindow, clientPoint, screenPoint, { animate = false } = {}) {
  const windowScreenPoint = await getWindowPositionForClientPointAtScreenPoint(screenPoint, clientPoint)
  browserWindow.setPosition(windowScreenPoint.x, windowScreenPoint.y, animate)
}

function animateWindowPosition (browserWindow, { fromPoint, getDestinationPoint }) {
  // electron widow position animation is darwin-only
  if (!isDarwin()) {
    moveWindowToDestination(browserWindow, getDestinationPoint)
  }
  browserWindow.setPosition(fromPoint.x, fromPoint.y)
  // just in case
  let attempts = 190
  const checkEveryMs = 16
  const moveWindow = () => {
    attempts--
    if (attempts === 0) {
      moveWindowToDestination(browserWindow, getDestinationPoint)
      return
    }
    if (browserWindow.isVisible()) {
      const [curX, curY] = browserWindow.getPosition()
      if (curX === fromPoint.x && curY === fromPoint.y) {
        moveWindowToDestination(browserWindow, getDestinationPoint, true)
      } else {
        setTimeout(moveWindow, checkEveryMs)
      }
    }
  }
  setTimeout(moveWindow, checkEveryMs)
}

function moveWindowToDestination (browserWindow, getDestinationPoint, animate = false) {
  const toPoint = getDestinationPoint()
  browserWindow.setPosition(toPoint.x, toPoint.y, animate)
}

function isClientPointWithinWindowBounds (browserWindow, windowClientPoint) {
  const [width, height] = browserWindow.getSize()
  return windowClientPoint.x >= 0 &&
    windowClientPoint.x < width &&
    windowClientPoint.y >= 0 &&
    windowClientPoint.y < height
}

function isMouseCursorOverWindowContent (browserWindow, cursorScreenPoint = screen.getCursorScreenPoint()) {
  const windowClientPoint = getWindowClientPointAtScreenPoint(browserWindow, cursorScreenPoint)
  return isClientPointWithinWindowBounds(browserWindow, windowClientPoint)
}

function mirrorWindowSizeAndPosition (browserWindow, otherWindow) {
  const [winX, winY] = otherWindow.getPosition()
  const [width, height] = otherWindow.getSize()
  browserWindow.setPosition(winX, winY)
  browserWindow.setSize(width, height)
}

// BrowserWindow ctor options which can be manually
// set after window creation
const optionsSetCompatible = new Set([
  'width',
  'height',
  'x',
  'y',
  'show',
  // `disposition` prop does not do anything except get read on later events
  // by our own code for checking whether a window should
  // receive pinned sites (e.g. not for popup windows)
  'disposition',
  'inactive',
  'fullscreen',
  'center',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'resizable',
  'movable',
  'alwaysOnTop',
  'focusable',
  'icon'
])

function canSetAllPropertiesOnExistingWindow (properties) {
  // cannot set properties we don't know about
  const anyPropertiesNotCompatible = Object.keys(properties)
    .some(optionKey =>
      !optionsSetCompatible.has(optionKey) && properties[optionKey] != null
    )
  return !anyPropertiesNotCompatible
}

function setPropertiesOnExistingWindow (browserWindow, properties, debug = false) {
  // set size and position
  if (properties.x != null && properties.y != null) {
    browserWindow.setPosition(properties.x, properties.y)
  }
  if (properties.width != null && properties.height != null) {
    browserWindow.setSize(properties.width, properties.height)
  }
  if (properties.maxWidth != null && properties.maxHeight != null) {
    browserWindow.setMaximumSize(properties.maxWidth, properties.maxHeight)
  }
  if (properties.minWidth != null && properties.minHeight != null) {
    browserWindow.setMinimumSize(properties.minWidth, properties.minHeight)
  }
  if (properties.resizable != null) {
    browserWindow.setResizable(properties.resizable)
  }
  if (properties.center === true) {
    browserWindow.center()
  }
  if (properties.movable != null) {
    browserWindow.setMovable(properties.movable)
  }
  if (properties.parent != null || properties.parent === null) {
    browserWindow.setParent(properties.parent)
  }
  if (properties.icon != null) {
    let windowIcon
    if (typeof properties.icon === 'string') {
      try {
        windowIcon = nativeImage.createFromPath(properties.icon)
      } catch (e) {
        console.error('Error creating nativeImage instance from window icon path: ' + e.message)
        console.error(e)
      }
    } else { // there is no electron.nativeImage fn for detecting instanceof, so assume
      windowIcon = properties.icon
    }
    if (windowIcon) {
      browserWindow.setIcon(windowIcon)
    }
  }
  if (properties.show !== false) {
    if (properties.inactive === true) {
      if (debug) {
        console.log('showing existing window inactive', browserWindow.id)
      }
      browserWindow.showInactive()
    } else {
      if (debug) {
        console.log('showing existing window', browserWindow.id)
      }
      browserWindow.show()
    }
  } else if (properties.inactive === false) {
    browserWindow.blur()
  }
  if (properties.fullscreen) {
    browserWindow.setFullScreen(true)
  }
  if (properties.alwaysOnTop) {
    browserWindow.setAlwaysOnTop(true)
  }
  if (properties.focusable != null) {
    browserWindow.setFocusable(properties.focusable)
  }
}

module.exports = {
  getWindowClientPointAtCursor,
  getWindowClientPointAtScreenPoint,
  moveClientPositionToMouseCursor,
  animateWindowPosition,
  getWindowPositionForClientPointAtCursor,
  getScreenPointAtWindowClientPoint,
  getWindowClientSize,
  isMouseCursorOverWindowContent,
  isClientPointWithinWindowBounds,
  mirrorWindowSizeAndPosition,
  canSetAllPropertiesOnExistingWindow,
  setPropertiesOnExistingWindow
}
