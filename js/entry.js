// Stylesheets are included here for webpack live reloading
require('../less/browser.less')
require('../less/main.less')
require('../less/navigationBar.less')

const React = require('react')
const ReactDOM = require('react-dom')

import App from './components/app'

ReactDOM.render(
  <App/>,
  document.getElementById('appContainer'))

