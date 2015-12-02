
// Stylesheets are included here for webpack live reloading
require('../less/browser.less')
require('../less/button.less')
require('../less/main.less')
require('../less/navigationBar.less')
require('../less/tabs.less')
require('../node_modules/font-awesome/css/font-awesome.css')

const React = require('react')
const ReactDOM = require('react-dom')
const App = require('./components/app')

ReactDOM.render(
  <App/>,
  document.getElementById('appContainer'))
