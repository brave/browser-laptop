var getFavicon = function () {
  let favicon
  const nodeList = document.getElementsByTagName('link')
  for (var i = 0; i < nodeList.length; i++) {
    if ((nodeList[i].getAttribute('rel') === 'icon') || (nodeList[i].getAttribute('rel') === 'shortcut icon')) {
      favicon = nodeList[i].getAttribute('href')
    }
  }
  return favicon
}

// set favicon as a data url because chrome-extension urls don't work correctly
if (getFavicon()) {
  let img = new window.Image()
  img.onload = function () {
    let canvas = document.createElement('CANVAS')
    const ctx = canvas.getContext('2d')
    canvas.height = this.height
    canvas.width = this.width
    ctx.drawImage(this, 0, 0)
    const dataURL = canvas.toDataURL()
    const docHead = document.getElementsByTagName('head')[0]
    const newLink = document.createElement('link')
    newLink.rel = 'shortcut icon'
    newLink.href = dataURL
    docHead.appendChild(newLink)
    canvas = null
  }
  img.src = 'img/favicon.ico'
}

const ReactDOM = require('react-dom')
const {getSourceAboutUrl, getBaseUrl} = require('../lib/appUrlUtil')
const {ABOUT_COMPONENT_INITIALIZED} = require('../constants/messages')
const ipc = window.chrome.ipcRenderer

let element

ipc.on('language', (e, detail) => {
  document.l10n.requestLanguages([detail.langCode])
  document.getElementsByName('availableLanguages')[0].content = detail.languageCodes.join(', ')
})
ipc.send('request-language')

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
  case 'about:history':
    element = require('./history')
    break
  case 'about:newtab':
    element = require('./newtab').AboutNewTab
    break
  case 'about:passwords':
    element = require('./passwords')
    break
  case 'about:preferences':
    element = require('./preferences').AboutPreferences
    break
  case 'about:safebrowsing':
    element = require('./safebrowsing')
    break
  case 'about:styles':
    element = require('./styles')
    break
  case 'about:contributions':
    element = require('./contributionStatement')
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
