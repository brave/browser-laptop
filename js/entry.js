/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Stylesheets are included here for webpack live reloading
require('../less/window.less')
require('../less/button.less')
require('../less/contextMenu.less')
require('../less/popupWindow.less')
require('../less/main.less')
require('../less/navigationBar.less')
require('../less/forms.less')
require('../less/switchControls.less')
require('../less/tabs.less')
require('../less/findbar.less')
require('../less/dialogs.less')
require('../less/downloadBar.less')
require('../less/bookmarksToolbar.less')
require('../less/notificationBar.less')
require('../less/addEditBookmark.less')
require('../node_modules/font-awesome/css/font-awesome.css')

const React = require('react')
const ReactDOM = require('react-dom')
const Window = require('./components/window')
const electron = require('electron')
const ipc = electron.ipcRenderer
const webFrame = electron.webFrame
const windowStore = require('./stores/windowStore')
const appStoreRenderer = require('./stores/appStoreRenderer')
const windowActions = require('./actions/windowActions')
const messages = require('./constants/messages')
const Immutable = require('immutable')
const patch = require('immutablepatch')
const l10n = require('./l10n')

// don't allow scaling or zooming of the ui
webFrame.setPageScaleLimits(1, 1)
webFrame.setZoomLevelLimits(0, 0)

l10n.init()

ipc.on(messages.REQUEST_WINDOW_STATE, () => {
  ipc.send(messages.RESPONSE_WINDOW_STATE, windowStore.getState().toJS())
})

if (process.env.NODE_ENV === 'test') {
  electron.testData = {
    appStoreRenderer,
    windowActions,
    windowStore
  }
}

ipc.on(messages.APP_STATE_CHANGE, (e, action) => {
  appStoreRenderer.state = action.stateDiff
    ? appStoreRenderer.state = patch(appStoreRenderer.state, Immutable.fromJS(action.stateDiff))
    : appStoreRenderer.state = Immutable.fromJS(action.state)
})

ipc.on(messages.CLEAR_CLOSED_FRAMES, () => {
  windowActions.clearClosedFrames()
})

window.addEventListener('beforeunload', function (e) {
  ipc.send(messages.LAST_WINDOW_STATE, windowStore.getState().toJS())
})

ipc.on(messages.INITIALIZE_WINDOW, (e, disposition, appState, frames, initWindowState) => {
  appStoreRenderer.state = Immutable.fromJS(appState)
  ReactDOM.render(
    <Window includePinnedSites={disposition !== 'new-popup'} frames={frames} initWindowState={initWindowState} />,
    document.getElementById('appContainer'))
})
