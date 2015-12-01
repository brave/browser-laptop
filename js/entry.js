// Stylesheets are included here for webpack live reloading
require('../less/browser.less')
require('../less/main.less')
require('../less/navigationBar.less')
require('../less/tabs.less')

const React = require('react')
const ReactDOM = require('react-dom')

const Menu = require('./menu.js')
import App from './components/app'

Menu.init()
ReactDOM.render(
  <App/>,
  document.getElementById('appContainer'))
