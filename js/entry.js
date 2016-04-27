/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Stylesheets are included here for webpack live reloading
require('../less/window.less')
require('../less/button.less')
require('../less/contextMenu.less')
require('../less/main.less')
require('../less/navigationBar.less')
require('../less/forms.less')
require('../less/tabs.less')
require('../less/findbar.less')
require('../less/dialogs.less')
require('../less/updateBar.less')
require('../less/downloadBar.less')
require('../less/bookmarksToolbar.less')
require('../less/notificationBar.less')
require('../node_modules/font-awesome/css/font-awesome.css')

const React = require('react')
const ReactDOM = require('react-dom')
const Window = require('./components/window')
const electron = global.require('electron')
const ipc = electron.ipcRenderer
const webFrame = electron.webFrame
const windowStore = require('./stores/windowStore')
const appStoreRenderer = require('./stores/appStoreRenderer')
const messages = require('./constants/messages')
const Immutable = require('immutable')
const patch = require('immutablepatch')

webFrame.setZoomLevelLimits(1, 1)

// get appStore from url
ipc.on(messages.INITIALIZE_WINDOW, (e, disposition, appState, frames, initWindowState) => {
  appStoreRenderer.state = Immutable.fromJS(appState)
  ReactDOM.render(
    <Window includePinnedSites={disposition !== 'new-popup'} frames={frames} initWindowState={initWindowState}/>,
    document.getElementById('windowContainer'))
})

ipc.on(messages.REQUEST_WINDOW_STATE, () => {
  ipc.send(messages.RESPONSE_WINDOW_STATE, windowStore.getState().toJS())
})

ipc.on(messages.APP_STATE_CHANGE, (e, action) => {
  appStoreRenderer.state = action.stateDiff
    ? appStoreRenderer.state = patch(appStoreRenderer.state, Immutable.fromJS(action.stateDiff))
    : appStoreRenderer.state = Immutable.fromJS(action.state)
})

window.addEventListener('beforeunload', function () {
  ipc.send(messages.LAST_WINDOW_STATE, windowStore.getState().toJS())
})
