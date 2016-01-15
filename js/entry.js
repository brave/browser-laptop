/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Stylesheets are included here for webpack live reloading
require('../less/window.less')
require('../less/button.less')
require('../less/main.less')
require('../less/navigationBar.less')
require('../less/tabs.less')
require('../less/findbar.less')
require('../less/dialogs.less')
require('../less/updateBar.less')
require('../node_modules/font-awesome/css/font-awesome.css')

const URL = require('url')
const React = require('react')
const ReactDOM = require('react-dom')
const Window = require('./components/window')
const ipc = global.require('electron').ipcRenderer
const WindowStore = require('./stores/windowStore')
const messages = require('./constants/messages')

// get appStore from url
var queryString = URL.parse(window.location.href, true).query
var appState = JSON.parse(queryString.appState)
var frames = JSON.parse(queryString.frames)

ipc.on(messages.REQUEST_WINDOW_STATE, () => {
  ipc.send(messages.RESPONSE_WINDOW_STATE, WindowStore.getState().toJS())
})

ReactDOM.render(
  <Window appState={appState} frames={frames}/>,
  document.getElementById('windowContainer'))
