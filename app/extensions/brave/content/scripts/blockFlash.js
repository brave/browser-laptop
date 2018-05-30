/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const adobeRegex =
  new RegExp('//(get\\.adobe\\.com/([a-z_-]+/)*flashplayer|www\\.macromedia\\.com/go/getflash|www\\.adobe\\.com/go/getflash|helpx\\.adobe\\.com/flash-player/([a-z_-]+/)*flash-player)', 'i')
const exemptHostRegex =
  new RegExp('(\\.adobe\\.com|www\\.google(\\.\\w+){1,2}|^duckduckgo\\.com|^search\\.yahoo\\.com)$')

function shouldIntercept(location) {
  if (!location) {
    return true
  }

  const { protocol, hostname, pathname } = location
  return ['http:', 'https:'].includes(protocol) &&
          !exemptHostRegex.test(hostname) &&
          !['/search', '/search/'].includes(pathname)
}

function blockFlashDetection () {
  const handler = {
    length: 0,
    item: () => { return null },
    namedItem: () => { return null },
    refresh: () => {}
  }
  window.Navigator.prototype.__defineGetter__('plugins', () => { return handler })
  window.Navigator.prototype.__defineGetter__('mimeTypes', () => { return handler })
}

function getBlockFlashPageScript () {
  return '(' + Function.prototype.toString.call(blockFlashDetection) + '());'
}

if (adobeRegex.test(window.location.href)) {
  let userAgent = navigator.userAgent

  // adobe detects Brave through navigator.userAgent
  if (!userAgent.includes('Brave')) {
    userAgent = [userAgent.split('Chrome')[0], 'Brave Chrome', userAgent.split('Chrome')[1]].join('')
    executeScript('window.Navigator.prototype.__defineGetter__("userAgent", () => { return "' + userAgent + '" })')
  }
}

if (chrome.contentSettings.flashEnabled == 'allow' && !isTorTab()) {
  document.addEventListener('click', (e) => {
    let node = e.target
    while (!node.href && node.parentNode)
      node = node.parentNode
    const href = node.href
    if (href && href.match(adobeRegex) && shouldIntercept(window.location)) {
      e.preventDefault()
      chrome.ipcRenderer.send('dispatch-action', JSON.stringify([{
        actionType: 'app-flash-permission-requested',
        location: window.location.href
      }]))
    }
  })
}

if (chrome.contentSettings.plugins != 'allow' || isTorTab()) {
  executeScript(getBlockFlashPageScript())
}
