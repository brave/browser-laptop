/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Whether a src is a .swf file.
 * If so, returns the origin of the file. Otherwise returns false.
 * @param {string} src
 * @return {boolean|string}
 */
function isSWF (src) {
  if (!src) {
    return false
  }
  let a = document.createElement('a')
  a.href = src
  if (a.pathname && a.pathname.toLowerCase().endsWith('.swf')) {
    return a.origin
  } else {
    return false
  }
}

/**
 * Whether an element is invisible or very small.
 * @param {Element} elem
 * @return {boolean}
 */
function isHiddenElement (el) {
  if (!el) {
    return false
  }
  const minSize = 20
  if (el.offsetWidth < minSize || el.offsetHeight < minSize) {
    return true
  }
  if (!el.getClientRects().length) {
    return true
  }
  return false
}

/**
 * Whether there is a small/hidden flash object on the page
 * Reference:
 * https://helpx.adobe.com/flash/kb/flash-object-embed-tag-attributes.html
 * @param {Element} elem - HTML element to search
 * @return {Array.<string>}
 */
function hasHiddenFlashElement (elem) {
  let foundElement = Array.from(elem.getElementsByTagName('embed')).some((el) => {
    return isSWF(el.getAttribute('src')) && isHiddenElement(el)
  })

  if (foundElement) {
    return true
  }

  return Array.from(elem.getElementsByTagName('object')).some((el) => {
    if (!isHiddenElement(el)) {
      return false
    }
    let origin = isSWF(el.getAttribute('data'))
    return origin
      ? true
      : Array.from(el.getElementsByTagName('param')).some((param) => {
        let name = param.getAttribute('name')
        let origin = isSWF(param.getAttribute('value'))
        return name && ['movie', 'src'].includes(name.toLowerCase()) && origin
      })
  })
}

// If Flash is enabled but not runnable, show a permission notification for small
// Flash elements
if (chrome.contentSettings.flashEnabled == 'allow' && chrome.contentSettings.flashAllowed != 'allow' && !isTorTab()) {
  const maxFlashAttempts = 3
  let flashAttempts = 0
  const intervalId = window.setInterval(() => {
    if (flashAttempts >= maxFlashAttempts) {
      window.clearInterval(intervalId)
      return
    }
    flashAttempts = flashAttempts + 1
    if (hasHiddenFlashElement(document.documentElement)) {
      chrome.ipcRenderer.send('dispatch-action', JSON.stringify([{
        actionType: 'app-flash-permission-requested',
        location: window.location.href
      }]))
      window.clearInterval(intervalId)
    }
  }, 1000)
}
