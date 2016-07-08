/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

function isAdobeLink (href) {
  if (typeof href !== 'string') {
    return false
  }
  return href.toLowerCase().includes('//get.adobe.com/flashplayer') ||
    href.toLowerCase().includes('//www.adobe.com/go/getflash')
}

// Open flash links in the same tab so we can intercept them correctly
(function () {
  function replaceAdobeLinks () {
    Array.from(document.querySelectorAll('a[target="_blank"]')).forEach((elem) => {
      const href = elem.getAttribute('href')
      if (isAdobeLink(href)) {
        elem.setAttribute('target', '')
      }
    })
  }
  var observer = new window.MutationObserver(function (mutations) {
    replaceAdobeLinks()
  })
  replaceAdobeLinks()
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
})()

const placeholderUrl = 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/about-flash.html'

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
function insertFlashPlaceholders (elem) {
  const minWidth = 200
  const minHeight = 100
  let flashObjects = getFlashObjects(elem)
  flashObjects.forEach((obj) => {
    let el = obj.element
    let pluginRect = el.getBoundingClientRect()
    let height = el.getAttribute('height') || pluginRect.height
    let width = el.getAttribute('width') || pluginRect.width
    if (height > minHeight && width > minWidth) {
      let parent = el.parentNode
      if (!parent) {
        return
      }
      let iframe = document.createElement('iframe')
      iframe.setAttribute('sandbox', 'allow-scripts')
      let hash = window.location.origin
      if (chrome.contentSettings.flashEnabled == 'allow') {
        hash = hash + '#flashEnabled'
      }
      iframe.setAttribute('src', [placeholderUrl, hash].join('#'))
      iframe.setAttribute('style', `width: ${width}px; height: ${height}px`)
      parent.replaceChild(iframe, el)
    } else {
      // Note when elements are too small so we can improve the heuristic.
      console.log('got too-small Flash element', obj, height, width)
    }
  })
}

var observer = new window.MutationObserver(function (mutations) {
  insertFlashPlaceholders(document.documentElement)
})

if (chrome.contentSettings.flashActive != 'allow' ||
    chrome.contentSettings.flashEnabled != 'allow') {
  insertFlashPlaceholders(document.documentElement)
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}
