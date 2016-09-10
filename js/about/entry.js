const ReactDOM = require('react-dom')
const { getSourceAboutUrl, getBaseUrl } = require('../lib/appUrlUtil')
const { ABOUT_COMPONENT_INITIALIZED } = require('../constants/messages')
const ipc = window.chrome.ipc

let element

switch (getBaseUrl(getSourceAboutUrl(window.location.href))) {
  case 'about:newtab':
    element = require('./newtab')
    break
  case 'about:about':
    element = require('./about')
    break
  case 'about:preferences':
    element = require('./preferences')
    break
  case 'about:bookmarks':
    element = require('./bookmarks')
    break
  case 'about:downloads':
    element = require('./downloads')
    break
  case 'about:certerror':
    element = require('./certerror')
    break
  case 'about:passwords':
    element = require('./passwords')
    break
  case 'about:safebrowsing':
    element = require('./safebrowsing')
    break
  case 'about:error':
    element = require('./errorPage')
    break
  case 'about:flash':
    element = require('./flashPlaceholder')
    break
  case 'about:history':
    element = require('./history')
    break
  case 'about:autofill':
    element = require('./autofill')
}

if (element) {
  const component = ReactDOM.render(element, document.querySelector('#appContainer'))
  ipc.on('state-updated', (e, detail) => {
    if (detail) {
      component.setState(detail)
    }
  })
  ipc.sendToHost(ABOUT_COMPONENT_INITIALIZED)
}
