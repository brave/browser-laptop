const ReactDOM = require('react-dom')
const {getSourceAboutUrl, getBaseUrl} = require('../lib/appUrlUtil')
const {ABOUT_COMPONENT_INITIALIZED} = require('../constants/messages')
const ipc = window.chrome.ipcRenderer

let getElementOp

ipc.on('language', (e, detail) => {
  if (document.l10n) {
    document.l10n.requestLanguages([detail.langCode])
    document.getElementsByName('availableLanguages')[0].content = detail.languageCodes.join(', ')
  } else {
    console.error('Missing document.l10n object.')
  }
})
ipc.send('request-language')

switch (getBaseUrl(getSourceAboutUrl(window.location.href))) {
  case 'about:about':
    getElementOp = import('./about')
    break
  case 'about:adblock':
    getElementOp = import('./adblock')
    break
  case 'about:autofill':
    getElementOp = import('./autofill')
    break
  case 'about:brave':
    getElementOp = import('./brave')
    break
  case 'about:bookmarks':
    getElementOp = import('../../app/renderer/about/bookmarks/bookmarks')
    break
  case 'about:printkeys':
    getElementOp = import('../../app/renderer/about/ledger/printKeys')
    break
  case 'about:certerror':
    getElementOp = import('./certerror')
    break
  case 'about:downloads':
    getElementOp = import('./downloads')
    break
  case 'about:error':
    getElementOp = import('./errorPage')
    break
  case 'about:extensions':
    getElementOp = import('./extensions')
    break
  case 'about:history':
    getElementOp = import('./history')
    break
  case 'about:newtab':
    getElementOp = import('./newtab').then(module => module.AboutNewTab)
    break
  case 'about:passwords':
    getElementOp = import('./passwords')
    break
  case 'about:preferences':
    getElementOp = import('./preferences').then(module => module.AboutPreferences)
    break
  case 'about:safebrowsing':
    getElementOp = import('./safebrowsing')
    break
  case 'about:styles':
    getElementOp = import('./styles')
    break
  case 'about:contributions':
    getElementOp = import('./contributionStatement')
    break
  case 'about:welcome':
    getElementOp = import('../../app/renderer/about/welcome')
    break
}

if (getElementOp) {
  getElementOp.then(element => {
    const component = ReactDOM.render(element, document.querySelector('#appContainer'))
    ipc.on('state-updated', (e, detail) => {
      if (detail) {
        component.setState(detail)
      }
    })
    ipc.send(ABOUT_COMPONENT_INITIALIZED)
  })
}
