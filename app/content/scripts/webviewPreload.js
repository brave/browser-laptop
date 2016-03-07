/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// hide this from the rest of the page
(function () {
  'use strict'

  var ipcRenderer = process.binding.v8_util.getHiddenValue(this, 'ipc')

  /**
   * Ensures a node replacement div is visible and has a proper zIndex
   */
  function ensureNodeVisible (node) {
    if (document.defaultView.getComputedStyle(node).display === 'none') {
      node.style.display = ''
    }
    if (document.defaultView.getComputedStyle(node).zIndex === '-1') {
      node.style.zIndex = ''
    }
  }

  /**
   * Determines the ad size which should be shown
   * It will first check the node's size and try to infer that way.
   * If that is not possible it will rely on the iframeData
   *
   * @param node The node that is being replaced
   * @param iframeData The known preprocessed iframeData for that node
   */
  function getAdSize (node, iframeData) {
    var acceptableAdSizes = [
      [970, 250],
      [970, 90],
      [728, 90],
      [300, 250],
      [300, 600],
      [160, 600],
      [120, 600],
      [320, 50]
    ]
    for (var i = 0; i < acceptableAdSizes.length; i++) {
      var adSize = acceptableAdSizes[i]
      if (node.offsetWidth === adSize[0] && node.offsetHeight >= adSize[1] ||
          node.offsetWidth >= adSize[0] && node.offsetHeight === adSize[1]) {
        return adSize
      }
    }

    if (iframeData) {
      return [iframeData.width || iframeData.w, iframeData.height || iframeData.h]
    }

    return null
  }

  /**
   * Processes a single node which is an ad
   *
   * @param node The node of the ad to process
   * @param iframeData The iframe data of the node to process from the slimerJS bot
   * @param replacementUrl The vault replacement url
   */
  function processAdNode (node, iframeData, replacementUrl) {
    if (!node) {
      return
    }

    var adSize = getAdSize(node, iframeData)
    // Could not determine the ad size, so just skip this replacement
    if (!adSize) {
      // we have a replace node node but no replacement, so just display none on it
      node.style.display = 'none'
      return
    }

    // generate a random segment
    // @todo - replace with renko targeting
    var segments = ['IAB2', 'IAB17', 'IAB14', 'IAB21', 'IAB20']
    var segment = segments[Math.floor(Math.random() * 4)]
    var time_in_segment = new Date().getSeconds()
    var segment_expiration_time = 0 // no expiration

    // ref param for referrer when possible
    var srcUrl = replacementUrl +
                  '?width=' + adSize[0] +
                  '&height=' + adSize[1] +
                  '&seg=' + segment + ':' + time_in_segment + ':' + segment_expiration_time

    var xhttp = new window.XMLHttpRequest()
    xhttp.onreadystatechange = function () {
      if (xhttp.readyState === 4 && xhttp.status === 200) {
        var src = '<html><body style="width: ' + adSize[0] + 'px; height: ' + adSize[1] +
                            '; padding: 0; margin: 0; overflow: hidden;">' + xhttp.responseText + '</body></html>'
        var sandbox = 'allow-scripts allow-popups allow-popups-to-escape-sandbox'
        if (node.tagName === 'IFRAME') {
          node.srcdoc = src
          node.sandbox = sandbox
        } else {
          while (node.firstChild) {
            node.removeChild(node.firstChild)
          }
          var iframe = document.createElement('iframe')
          iframe.style.padding = 0
          iframe.style.border = 0
          iframe.style.margin = 0
          iframe.style.width = adSize[0] + 'px'
          iframe.style.height = adSize[1] + 'px'
          iframe.srcdoc = src
          iframe.sandbox = sandbox
          node.appendChild(iframe)
          ensureNodeVisible(node)
          if (node.parentNode) {
            ensureNodeVisible(node.parentNode)
            if (node.parentNode) {
              ensureNodeVisible(node.parentNode.parentNode)
            }
          }
        }
      }
    }
    xhttp.open('GET', srcUrl, true)
    xhttp.send()
  }

  // Fires when the browser has ad replacement information to give
  ipcRenderer.on('set-ad-div-candidates', function (e, adDivCandidates, placeholderUrl) {
    // Keep a lookup for skipped common elements
    var fallbackNodeDataForCommon = {}

    // Process all of the specific ad information for this page
    adDivCandidates.forEach(function (iframeData) {
      var replaceId = iframeData.replapceId || iframeData.rid
      var selector = '[id="' + replaceId + '"]'
      var node = document.querySelector(selector)
      if (!node) {
        return
      }

      // Skip over known common elements
      if (replaceId.startsWith('google_ads_iframe_') ||
          replaceId.endsWith('__container__')) {
        fallbackNodeDataForCommon[node.id] = iframeData
        return
      }

      // Find the node and process it
      processAdNode(document.querySelector(selector), iframeData, placeholderUrl)
    })

    // Common selectors which could be on every page
    var commonSelectors = [
      '[id^="google_ads_iframe_"][id$="__container__"]',
      '[id^="ad-slot-banner-"]',
      '[data-ad-slot]'
    ]
    commonSelectors.forEach(commonSelector => {
      var nodes = document.querySelectorAll(commonSelector)
      if (!nodes) {
        return
      }
      Array.from(nodes).forEach(node => {
        processAdNode(node, fallbackNodeDataForCommon[node.id], placeholderUrl)
      })
    })
  })

  // Tries to detect username/password using roughly the heuristic from
  // http://mxr.mozilla.org/firefox/source/toolkit/components/passwordmgr/src/nsLoginManager.js
  document.addEventListener('DOMContentLoaded', (e) => {
    // Don't autofill on non-HTTP(S) sites for now
    if (document.location.protocol !== 'http:' && document.location.protocol !== 'https:') {
      return
    }

    if (document.querySelectorAll('input[type=password]:not([autocomplete=off])').length === 0) {
      // No password fields; abort
      return
    }

    var formNodes = document.querySelectorAll('form:not([autocomplete=off])')
    var formOrigin = [document.location.protocol, document.location.host].join('//')

    // Map of action origin to [[password element, username element]]
    var credentials = {}

    Array.from(formNodes).forEach(form => {
      var fields = getFormFields(form, false)
      var action = form.action || document.location.href
      var usernameElem = fields[0]
      var passwordElem = fields[1]
      if (passwordElem) {
        if (credentials[action]) {
          credentials[action].push([passwordElem, usernameElem])
        } else {
          credentials[action] = [[passwordElem, usernameElem]]
        }
        // Ask the main process for the credentials
        ipcRenderer.send('get-password', formOrigin, action)
        console.log('got password field', formOrigin, action, usernameElem, passwordElem)
      }
    })

    ipcRenderer.on('got-password', (e, username, password, origin, action) => {
      var elems = credentials[action]
      if (formOrigin === origin && elems) {
        elems.forEach((elem) => {
          // Autofill password
          elem[0].value = password
          if (username && elem[1]) {
            // Autofill the username if there is one
            elem[1].value = username
          }
        })
      }
    })
  })

  /**
   * Gets form fields.
   * @param {Element} form - The form to inspect
   * @param {boolean} isSubmission - Whether the form is being submitted
   * @return {Array.<Element>}
   */
  function getFormFields (form, isSubmission) {
    var passwords = getPasswordFields(form, isSubmission)

    // We have no idea what is going on with a form that has 0 or >3 password fields
    if (passwords.length === 0 || passwords.length > 3) {
      return [null, null, null]
    }

    // Search backwards from first password field to find the username field
    var previousSibling = passwords[0].previousSibling
    var username = null
    while (previousSibling) {
      if (previousSibling.type === 'text' && previousSibling.autocomplete !== 'off') {
        username = previousSibling
        break
      }
      previousSibling = previousSibling.previousSibling
    }

    // If not a submission, autofill the first password field and ignore the rest
    if (!isSubmission || passwords.length === 1) {
      return [username, passwords[0], null]
    }

    // Otherwise, this is probably a password change form and we need to figure out
    // what username/password combo to save.
    var oldPassword = null
    var newPassword = null
    var value1 = passwords[0].value
    var value2 = passwords[1].value
    var value3 = passwords[2] ? passwords[2].value : ''

    if (passwords.length === 2) {
      if (value1 === value2) {
        // Treat as if there were 1 pw field
        newPassword = passwords[0]
      } else {
        oldPassword = passwords[0]
        newPassword = passwords[1]
      }
    } else {
      // There is probably a "confirm your password" field for the new
      // password, so the new password is the one that is repeated.
      if (value1 === value2 && value2 === value3) {
        // Treat as if there were 1 pw field
        newPassword = passwords[0]
      } else if (value1 === value2) {
        newPassword = passwords[0]
        oldPassword = passwords[2]
      } else if (value2 === value3) {
        newPassword = passwords[2]
        oldPassword = passwords[0]
      } else if (value1 === value3) {
        // Weird
        newPassword = passwords[0]
        oldPassword = passwords[1]
      }
    }
    return [username, newPassword, oldPassword]
  }

  /**
   * Gets password fields in a form.
   * @param {Element} form - The form to inspect
   * @param {boolean} isSubmission - Whether the form is being submitted
   * @return {Array.<Element>|null}
   */
  function getPasswordFields (form, isSubmission) {
    var passwordNodes = Array.from(form.querySelectorAll('input[type=password]:not([autocomplete=off])'))
    if (isSubmission) {
      // Skip empty fields
      passwordNodes = passwordNodes.filter((e) => { return !e.value })
    }
    return passwordNodes
  }

  function hasSelection (node) {
    try {
      if (node && node.selectionStart !== undefined &&
          node.selectionEnd !== undefined &&
          node.selectionStart !== node.selectionEnd) {
        return true
      }
    } catch (e) {
      return false
    }

    var selection = window.getSelection()
    for (var i = 0; i < selection.rangeCount; i++) {
      var range = window.getSelection().getRangeAt(i)
      if (range.endOffset !== undefined &&
          range.startOffset !== undefined &&
          range.endOffset !== range.startOffset) {
        return true
      }
    }
    return false
  }

  /**
   * Whether an element is editable or can be typed into.
   * @param {Element} elem
   * @return {boolean}
   */
  function isEditable (elem) {
    // TODO: find other node types that are editable
    return ((elem.contentEditable && elem.contentEditable !== 'false' && elem.contentEditable !== 'inherit') ||
            elem.nodeName === 'INPUT' ||
            elem.nodeName === 'TEXTAREA')
  }

  /**
   * Whether we are on OS X
   * @return {boolean}
   */
  function isPlatformOSX () {
    // TODO: navigator.platform is getting deprecated
    return window.navigator.platform.includes('Mac')
  }

  document.addEventListener('contextmenu', (e) => {
    window.setTimeout(() => {
      // there is another event being fired on contextmenu, don't show this one
      if (e.defaultPrevented) {
        return
      }
      var name = e.target.nodeName.toUpperCase()
      var href
      var maybeLink = e.target
      while (maybeLink.parentNode) {
        // Override for about: pages
        if (maybeLink.getAttribute('data-context-menu-disable')) {
          return
        }
        if (maybeLink.nodeName.toUpperCase() === 'A') {
          href = maybeLink.href
          break
        }
        maybeLink = maybeLink.parentNode
      }
      var nodeProps = {
        name: name,
        href: href,
        src: e.target.src,
        isContentEditable: e.target.isContentEditable,
        hasSelection: hasSelection(e.target)
      }
      ipcRenderer.sendToHost('context-menu-opened', nodeProps)
      e.preventDefault()
    }, 0)
  }, false)

  document.onkeydown = (e) => {
    switch (e.keyCode) {
      case this.KeyEvent.DOM_VK_ESCAPE:
        e.preventDefault()
        ipcRenderer.sendToHost('stop-load')
        break
      case this.KeyEvent.DOM_VK_BACK_SPACE:
        if (!isEditable(document.activeElement)) {
          e.shiftKey ? window.history.forward() : window.history.back()
        }
        break
      case this.KeyEvent.DOM_VK_LEFT:
        if (e.metaKey && !isEditable(document.activeElement) && isPlatformOSX()) {
          window.history.back()
        }
        break
      case this.KeyEvent.DOM_VK_RIGHT:
        if (e.metaKey && !isEditable(document.activeElement) && isPlatformOSX()) {
          window.history.forward()
        }
        break
    }
  }

  // shamelessly taken from https://developer.mozilla.org/en-US/docs/Web/Events/mouseenter
  function delegate (event, selector) {
    var target = event.target
    var related = event.relatedTarget
    var match

    // search for a parent node matching the delegation selector
    while (target && target !== document && !(match = target.matches(selector))) {
      target = target.parentNode
    }

    // exit if no matching node has been found
    if (!match) {
      return
    }

    // loop through the parent of the related target to make sure that it's not a child of the target
    while (related && related !== target && related !== document) {
      related = related.parentNode
    }

    // exit if this is the case
    if (related === target) {
      return
    }

    return target
  }

  document.addEventListener('mouseover', (event) => {
    var target = delegate(event, 'a')
    if (target) {
      const pos = {
        x: event.clientX,
        y: event.clientY
      }
      ipcRenderer.sendToHost('link-hovered', target.href, pos)
    }
  })

  document.addEventListener('mouseout', (event) => {
    if (delegate(event, 'a')) {
      ipcRenderer.sendToHost('link-hovered', null)
    }
  })

  const rgbaFromStr = function (rgba) {
    if (!rgba) {
      return undefined
    }
    return rgba.split('(')[1].split(')')[0].split(',')
  }
  const distance = function (v1, v2) {
    let d = 0
    for (let i = 0; i < v2.length; i++) {
      d += (v1[i] - v2[i]) * (v1[i] - v2[i])
    }
    return Math.sqrt(d)
  }
  const getElementColor = function (el) {
    const currentColorRGBA = window.getComputedStyle(el).backgroundColor
    const currentColor = rgbaFromStr(currentColorRGBA)
    // Ensure that the selected color is not too similar to an inactive tab color
    const threshold = 50
    if (currentColor !== undefined &&
        Number(currentColor[3]) !== 0 &&
        distance(currentColor, [199, 199, 199]) > threshold) {
      return currentColorRGBA
    }
    return undefined
  }
  // Determines a good tab color
  const computeThemeColor = function () {
    // Use y = 3 to avoid hitting a border which are often gray
    const samplePoints = [[3, 3], [window.innerWidth / 2, 3], [window.innerWidth - 3, 3]]
    const els = []
    for (const point of samplePoints) {
      const el = document.elementFromPoint(point[0], point[1])
      if (el) {
        els.push(el)
        if (el.parentElement) {
          els.push(el.parentElement)
        }
      }
    }
    els.push(document.body)
    for (const el of els) {
      if (el !== document.documentElement && el instanceof window.Element) {
        const themeColor = getElementColor(el)
        if (themeColor) {
          return themeColor
        }
      }
    }
    return undefined
  }
  ipcRenderer.on('post-page-load-run', function () {
    ipcRenderer.sendToHost('theme-color-computed', computeThemeColor())
  })
}).apply(this)
