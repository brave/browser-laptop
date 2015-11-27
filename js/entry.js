// Stylesheets are included here for webpack live reloading
require('../less/browser.less')
require('../less/main.less')
require('../less/navigationBar.less')

const React = require('react')
const ReactDOM = require('react-dom')

const ipc = require('ipc')
const remote = require('remote')
const Menu = remote.require('menu')

import App from './components/app'

ReactDOM.render(
  <App/>,
  document.getElementById('appContainer'))

const menu = Menu.buildFromTemplate([{
  label: 'Electron',
  submenu: [{
    label: 'Quit',
    click: ipc.send.bind(null, 'quit-application')
  }]
}])

Menu.setApplicationMenu(menu)
