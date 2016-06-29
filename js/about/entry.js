const ReactDOM = require('react-dom')
const { getSourceAboutUrl, getBaseUrl } = require('../lib/appUrlUtil')

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
}

if (element) {
  let component = ReactDOM.render(element, document.querySelector('#appContainer'))
  window.aboutDetails && component.setState(window.aboutDetails)
  delete window.aboutDetails
  window.addEventListener('state-updated', function (e) {
    component.setState(e.detail)
  })
}
