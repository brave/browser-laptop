/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Stylesheets are included here for webpack live reloading
require('../less/window.less')
require('../less/button.less')
require('../less/main.less')
require('../less/navigationBar.less')
require('../less/tabs.less')
require('../node_modules/font-awesome/css/font-awesome.css')

const URL = require('url')
const Immutable = require('immutable')
const React = require('react')
const ReactDOM = require('react-dom')
const Window = require('./components/window')

// get appStore from url
var appState = Immutable.fromJS(JSON.parse(URL.parse(window.location.href, true).query.appState))

ReactDOM.render(
  <Window appState={appState}/>,
  document.getElementById('windowContainer'))
