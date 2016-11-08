const ReactDOM = require('react-dom')
const {getSourceAboutUrl, getBaseUrl} = require('../lib/appUrlUtil')
const {ABOUT_COMPONENT_INITIALIZED} = require('../constants/messages')
const ipc = window.chrome.ipcRenderer

let element

switch (getBaseUrl(getSourceAboutUrl(window.location.href))) {
  case 'about:about':
    element = require('./about')
    break
  case 'about:adblock':
    element = require('./adblock')
    break
  case 'about:autofill':
    element = require('./autofill')
    break
  case 'about:brave':
    element = require('./brave')
    break
  case 'about:bookmarks':
    element = require('./bookmarks')
    break
  case 'about:certerror':
    element = require('./certerror')
    break
  case 'about:downloads':
    element = require('./downloads')
    break
  case 'about:error':
    element = require('./errorPage')
    break
  case 'about:extensions':
    element = require('./extensions')
    break
  case 'about:flash':
    element = require('./flashPlaceholder')
    break
  case 'about:history':
    element = require('./history')
    break
  case 'about:newtab':
    element = require('./newtab')
    break
  case 'about:passwords':
    element = require('./passwords')
    break
  case 'about:preferences':
    element = require('./preferences')
    break
  case 'about:safebrowsing':
    element = require('./safebrowsing')
    break
  case 'about:styles':
    element = require('./styles')
    break
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
