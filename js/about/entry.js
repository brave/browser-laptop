const ReactDOM = require('react-dom')
import { getSourceAboutUrl } from '../lib/appUrlUtil.js'

let rootComponent
switch (getSourceAboutUrl(window.location.href)) {
  case 'about:newtab':
    rootComponent = require('./newtab')
    break
  case 'about:about':
    rootComponent = require('./about')
    break
}

if (rootComponent) {
  ReactDOM.render(rootComponent, document.querySelector('#appContainer'))
}
