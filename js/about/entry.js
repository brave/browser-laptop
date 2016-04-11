const ReactDOM = require('react-dom')
const { getSourceAboutUrl } = require('../lib/appUrlUtil')

let rootComponent
switch (getSourceAboutUrl(window.location.href)) {
  case 'about:newtab':
    rootComponent = require('./newtab')
    break
  case 'about:about':
    rootComponent = require('./about')
    break
  case 'about:preferences':
    rootComponent = require('./preferences')
    break
  case 'about:bookmarks':
    rootComponent = require('./bookmarks')
    break
  case 'about:downloads':
    rootComponent = require('./downloads')
    break
  case 'about:certerror':
    rootComponent = require('./certerror')
    break
  case 'about:passwords':
    rootComponent = require('./passwords')
    break
  case 'about:safebrowsing':
    rootComponent = require('./safebrowsing')
    break
}

if (rootComponent) {
  ReactDOM.render(rootComponent, document.querySelector('#appContainer'))
}
