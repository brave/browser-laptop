/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Stylesheets are included here for webpack live reloading
require('../less/window.less')
require('../less/button.less')
require('../less/navigationBar.less')
require('../less/forms.less')
require('../less/downloadBar.less')
require('../less/notificationBar.less')
require('../node_modules/font-awesome/css/font-awesome.css')

const React = require('react')
const ReactDOM = require('react-dom')
const Immutable = require('immutable')
const patch = require('immutablepatch')
const electron = require('electron')
const ipc = electron.ipcRenderer
const webFrame = electron.webFrame

// Components
const Window = require('../app/renderer/components/window')

// Store
const windowStore = require('./stores/windowStore')
const appStoreRenderer = require('./stores/appStoreRenderer')

// Actions
const windowActions = require('./actions/windowActions')
const appActions = require('./actions/appActions')

// Constants
const messages = require('./constants/messages')

// Utils
const l10n = require('./l10n')
const currentWindow = require('../app/renderer/currentWindow')

webFrame.setPageScaleLimits(1, 1)

l10n.init()

ipc.on(messages.REQUEST_WINDOW_STATE, (evt, requestId) => {
  const mem = muon.shared_memory.create({
    windowState: windowStore.getState().toJS(),
    requestId
  })
  ipc.sendShared(messages.RESPONSE_WINDOW_STATE, mem)
})

if (process.env.NODE_ENV === 'test') {
  electron.testData = {
    appStoreRenderer,
    windowActions,
    windowStore
  }
  appActions.changeSetting('tabs.show-dashboard-images', false)
}

ipc.on(messages.APP_STATE_CHANGE, (e, action) => {
  appStoreRenderer.state = action.stateDiff
    ? appStoreRenderer.state = patch(appStoreRenderer.state, Immutable.fromJS(action.stateDiff))
    : appStoreRenderer.state = Immutable.fromJS(action.state)
})

ipc.on(messages.CLEAR_CLOSED_FRAMES, (e, location) => {
  windowActions.clearClosedFrames(location)
})

window.addEventListener('beforeunload', function () {
  ipc.send(messages.LAST_WINDOW_STATE, windowStore.getState().toJS())
})

ipc.on(messages.INITIALIZE_WINDOW, (e, mem) => {
  const message = mem.memory()
  const windowValue = message.windowValue

  currentWindow.setWindowId(windowValue.id)
  if (process.env.NODE_ENV === 'development') {
    console.debug(`This Window's ID is:`, windowValue.id)
  }
  const newState = Immutable.fromJS(message.windowState) || windowStore.getState()

  appStoreRenderer.state = Immutable.fromJS(message.appState)
  windowStore.state = newState
  appActions.windowReady(windowValue.id, windowValue)
  ReactDOM.render(<Window />, document.getElementById('appContainer'), fireOnReactRender.bind(null, windowValue))
})

const fireOnReactRender = (windowValue) => {
  appActions.windowRendered(windowValue.id)
}

// listen for tab events
const rendererTabEvents = require('../app/renderer/rendererTabEvents')

electron.remote.registerAllWindowTabEvents(e => {
  const eventName = e.type
  const tabId = e.eventTabId
  try {
    rendererTabEvents.handleTabEvent(tabId, eventName, e)
  } catch (e) {
    console.error(`Error handling event ${eventName} for tab ${tabId}`)
    console.error(e)
  }
})

ipc.on('new-web-contents-added', (e, frameOpts, newTabValue) => {
  windowActions.newFrame(frameOpts, newTabValue)
})

// listen for shortcuts
const rendererShortcutHandler = require('../app/renderer/rendererShortcutHandler')
const frameShortcuts = ['stop', 'reload', 'zoom-in', 'zoom-out', 'zoom-reset', 'toggle-dev-tools', 'clean-reload', 'view-source', 'mute', 'save', 'print', 'show-findbar', 'find-next', 'find-prev']
frameShortcuts.forEach((shortcut) => {
  // Listen for actions on the active frame
  ipc.on(`shortcut-active-frame-${shortcut}`, rendererShortcutHandler.handleActiveFrameShortcut.bind(null, shortcut))
  // Listen for actions on frame N
  if (['reload', 'mute'].includes(shortcut)) {
    ipc.on(`shortcut-frame-${shortcut}`, (e, frameKey, args) => {
      rendererShortcutHandler.handleFrameShortcut(frameKey, shortcut, e, args)
    })
  }
})

// emit frame changes back to browser
const renderFrameTracker = require('../app/renderer/rendererFrameTracker')
renderFrameTracker()
