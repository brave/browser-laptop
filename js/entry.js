/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Stylesheets are included here for webpack live reloading
require('../css/window.less')
require('../css/button.less')
require('../css/main.less')
require('../css/navigationBar.less')
require('../css/tabs.less')
require('../css/findbar.less')
require('../css/dialogs.less')
require('../css/updateBar.less')
require('../css/bookmarksToolbar.less')
require('../less/contextMenu.less')
require('../node_modules/font-awesome/css/font-awesome.css')

const React = require('react')
const ReactDOM = require('react-dom')
const Window = require('./components/window')
const ipc = global.require('electron').ipcRenderer
const windowStore = require('./stores/windowStore')
const appStoreRenderer = require('./stores/appStoreRenderer')
const messages = require('./constants/messages')
const Immutable = require('immutable')
const patch = require('immutablepatch')

// get appStore from url
ipc.on(messages.INITIALIZE_WINDOW, (e, appState, frames, initWindowState) => {
  appStoreRenderer.state = Immutable.fromJS(appState)
  ReactDOM.render(
    <Window frames={frames} initWindowState={initWindowState}/>,
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
