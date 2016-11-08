/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const placeholderUrl = chrome.extension.getURL('about-flash.html')
const adobeRegex = new RegExp('//(get\\.adobe\\.com/([a-z_-]+/)*flashplayer|www\\.macromedia\\.com/go/getflash|www\\.adobe\\.com/go/getflash)', 'i')

function isAdobeLink (href) {
  if (typeof href !== 'string') {
    return false
  }
  return adobeRegex.test(href)
}

function showFlashNotification (origin, e) {
  chrome.ipcRenderer.sendToHost('show-flash-notification', origin)
  e.preventDefault()
  e.stopPropagation()
}

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
 * Gets all Flash object descendants of an element.
 * Reference:
 * https://helpx.adobe.com/flash/kb/flash-object-embed-tag-attributes.html
 * @param {Element} elem - HTML element to search
 * @return {Array.<Element>}
 */
function getFlashObjects (elem) {
  let results = [] // Array.<{element: Element, origin: string}>
  Array.from(elem.getElementsByTagName('embed')).forEach((el) => {
    let origin = isSWF(el.getAttribute('src'))
    if (origin) {
      results.push({
        element: el,
        origin
      })
    }
  })

  Array.from(elem.getElementsByTagName('object')).forEach((el) => {
    // Skip objects that are contained in other flash objects
    /*
    for (let i = 0; i < results.length; i++) {
      if (results[i].element.contains(el)) {
        return
      }
    }
    */
    let origin = isSWF(el.getAttribute('data'))
    if (origin) {
      results.push({
        element: el,
        origin
      })
    } else {
      // See example at
      // https://helpx.adobe.com/animate/kb/object-tag-syntax.html
      Array.from(el.getElementsByTagName('param')).forEach((param) => {
        let name = param.getAttribute('name')
        let origin = isSWF(param.getAttribute('value'))
        if (name && ['movie', 'src'].includes(name.toLowerCase()) &&
            origin) {
          results.push({
            element: el,
            origin
          })
        }
      })
    }
  })

  // Some sites have custom Flash placeholders which we should replace with our
  // own.
  Array.from(elem.querySelectorAll('a > img')).forEach((el) => {
    let href = el.parentNode ? el.parentNode.href : null
    if (isAdobeLink(href)) {
      results.push({
        element: el
      })
    }
  })

  return results
}

/**
 * Inserts Flash placeholders.
 * @param {Element} elem - HTML element to search
 */
function insertFlashPlaceholders (elem = document.documentElement) {
  const minWidth = 200
  const minHeight = 100
  let flashObjects = getFlashObjects(elem)
  flashObjects.forEach((obj) => {
    let el = obj.element
    let height = el.offsetHeight || el.getAttribute('height')
    let width = el.offsetWidth || el.getAttribute('width')
    if (height > minHeight && width > minWidth) {
      let parent = el.parentNode
      if (!parent) {
        return
      }
      let iframe = document.createElement('iframe')
      let hash = window.location.origin
      if (chrome.contentSettings.flashEnabled == 'allow') {
        hash = hash + '#flashEnabled'
      }
      iframe.setAttribute('src', [placeholderUrl, hash].join('#'))
      iframe.setAttribute('style', `width: ${width}px; height: ${height}px`)
      parent.replaceChild(iframe, el)
    } else {
      // Note when elements are too small so we can improve the heuristic.
      // console.log('got too-small Flash element', obj, height, width)
    }
  })
}

if (chrome.contentSettings.flashActive != 'allow' ||
    chrome.contentSettings.flashEnabled != 'allow') {
  // Open flash links in the same tab so we can intercept them correctly
  (function () {
    function replaceAdobeLinks () {
      Array.from(document.querySelectorAll('a')).forEach((elem) => {
        const href = elem.getAttribute('href')
        if (isAdobeLink(href)) {
          elem.onclick = showFlashNotification.bind(null, window.location.origin)
        }
      })
    }
    replaceAdobeLinks()
    let interval = setInterval(replaceAdobeLinks, 3000)
    document.addEventListener('visibilitychange', () => {
      clearInterval(interval)
      if (document.visibilityState !== 'hidden') {
        interval = setInterval(replaceAdobeLinks, 3000)
      }
    })
  })()
  insertFlashPlaceholders()
  let interval = setInterval(insertFlashPlaceholders, 3000)
  document.addEventListener('visibilitychange', () => {
    clearInterval(interval)
    if (document.visibilityState !== 'hidden') {
      interval = setInterval(insertFlashPlaceholders, 3000)
    }
  })
}
