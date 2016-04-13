// @flow
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
// inject missing DOM Level 3 KeyEvent
// https://www.w3.org/TR/2001/WD-DOM-Level-3-Events-20010410/DOM3-Events.html#events-Events-KeyEvent
if (typeof KeyEvent === 'undefined') {
  KeyEvent = {
    DOM_VK_CANCEL: 3,
    DOM_VK_HELP: 6,
    DOM_VK_BACK_SPACE: 8,
    DOM_VK_TAB: 9,
    DOM_VK_CLEAR: 12,
    DOM_VK_RETURN: 13,
    DOM_VK_ENTER: 14,
    DOM_VK_SHIFT: 16,
    DOM_VK_CONTROL: 17,
    DOM_VK_ALT: 18,
    DOM_VK_PAUSE: 19,
    DOM_VK_CAPS_LOCK: 20,
    DOM_VK_ESCAPE: 27,
    DOM_VK_SPACE: 32,
    DOM_VK_PAGE_UP: 33,
    DOM_VK_PAGE_DOWN: 34,
    DOM_VK_END: 35,
    DOM_VK_HOME: 36,
    DOM_VK_LEFT: 37,
    DOM_VK_UP: 38,
    DOM_VK_RIGHT: 39,
    DOM_VK_DOWN: 40,
    DOM_VK_PRINTSCREEN: 44,
    DOM_VK_INSERT: 45,
    DOM_VK_DELETE: 46,
    DOM_VK_0: 48,
    DOM_VK_1: 49,
    DOM_VK_2: 50,
    DOM_VK_3: 51,
    DOM_VK_4: 52,
    DOM_VK_5: 53,
    DOM_VK_6: 54,
    DOM_VK_7: 55,
    DOM_VK_8: 56,
    DOM_VK_9: 57,
    DOM_VK_SEMICOLON: 59,
    DOM_VK_EQUALS: 61,
    DOM_VK_A: 65,
    DOM_VK_B: 66,
    DOM_VK_C: 67,
    DOM_VK_D: 68,
    DOM_VK_E: 69,
    DOM_VK_F: 70,
    DOM_VK_G: 71,
    DOM_VK_H: 72,
    DOM_VK_I: 73,
    DOM_VK_J: 74,
    DOM_VK_K: 75,
    DOM_VK_L: 76,
    DOM_VK_M: 77,
    DOM_VK_N: 78,
    DOM_VK_O: 79,
    DOM_VK_P: 80,
    DOM_VK_Q: 81,
    DOM_VK_R: 82,
    DOM_VK_S: 83,
    DOM_VK_T: 84,
    DOM_VK_U: 85,
    DOM_VK_V: 86,
    DOM_VK_W: 87,
    DOM_VK_X: 88,
    DOM_VK_Y: 89,
    DOM_VK_Z: 90,
    DOM_VK_CONTEXT_MENU: 93,
    DOM_VK_NUMPAD0: 96,
    DOM_VK_NUMPAD1: 97,
    DOM_VK_NUMPAD2: 98,
    DOM_VK_NUMPAD3: 99,
    DOM_VK_NUMPAD4: 100,
    DOM_VK_NUMPAD5: 101,
    DOM_VK_NUMPAD6: 102,
    DOM_VK_NUMPAD7: 103,
    DOM_VK_NUMPAD8: 104,
    DOM_VK_NUMPAD9: 105,
    DOM_VK_MULTIPLY: 106,
    DOM_VK_ADD: 107,
    DOM_VK_SEPARATOR: 108,
    DOM_VK_SUBTRACT: 109,
    DOM_VK_DECIMAL: 110,
    DOM_VK_DIVIDE: 111,
    DOM_VK_F1: 112,
    DOM_VK_F2: 113,
    DOM_VK_F3: 114,
    DOM_VK_F4: 115,
    DOM_VK_F5: 116,
    DOM_VK_F6: 117,
    DOM_VK_F7: 118,
    DOM_VK_F8: 119,
    DOM_VK_F9: 120,
    DOM_VK_F10: 121,
    DOM_VK_F11: 122,
    DOM_VK_F12: 123,
    DOM_VK_F13: 124,
    DOM_VK_F14: 125,
    DOM_VK_F15: 126,
    DOM_VK_F16: 127,
    DOM_VK_F17: 128,
    DOM_VK_F18: 129,
    DOM_VK_F19: 130,
    DOM_VK_F20: 131,
    DOM_VK_F21: 132,
    DOM_VK_F22: 133,
    DOM_VK_F23: 134,
    DOM_VK_F24: 135,
    DOM_VK_NUM_LOCK: 144,
    DOM_VK_SCROLL_LOCK: 145,
    DOM_VK_COMMA: 188,
    DOM_VK_PERIOD: 190,
    DOM_VK_SLASH: 191,
    DOM_VK_BACK_QUOTE: 192,
    DOM_VK_OPEN_BRACKET: 219,
    DOM_VK_BACK_SLASH: 220,
    DOM_VK_CLOSE_BRACKET: 221,
    DOM_VK_QUOTE: 222,
    DOM_VK_META: 224
  };
}

// TODO(bridiver) - can we enable KeyEvent with webkit prefs?
// KeyboardEventCode status=experimental
// KeyboardEventKey status=test
(function () {
  'use strict'
  var ipcRenderer = chrome.ipc;

  /**
   * Ensures a node replacement div is visible and has a proper zIndex
   */
  function ensureNodeVisible (node/*: Element*/)/* : void */ {
    if (document.defaultView.getComputedStyle(node).display === 'none') {
      node.setAttribute('style', 'display: ""')
    }
    if (document.defaultView.getComputedStyle(node).zIndex === '-1') {
      node.setAttribute('style', 'zIndex: ""')
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

    return []
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
    if (!adSize.length) {
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
        var sandbox = 'allow-popups allow-popups-to-escape-sandbox'
        if (node.tagName === 'IFRAME') {
          node.setAttribute('srcdoc', src)
          node.setAttribute('sandbox', sandbox)
        } else {
          while (node.firstChild) {
            node.removeChild(node.firstChild)
          }
          var iframe = document.createElement('iframe')
          iframe.setAttribute('sandbox', sandbox)
          iframe.setAttribute('srcdoc', src)
          iframe.setAttribute('style',
                              'padding: 0; border: 0; margin: 0; width: ' + adSize[0] + 'px; ' + 'height: ' + adSize[1] + 'px;')
          node.appendChild(iframe)
          ensureNodeVisible(node)
          if (node.parentElement) {
            ensureNodeVisible(node.parentElement)
            if (node.parentNode.parentElement) {
              ensureNodeVisible(node.parentNode.parentElement)
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
    commonSelectors.forEach((commonSelector) => {
      var nodes = document.querySelectorAll(commonSelector)
      if (!nodes) {
        return
      }
      Array.from(nodes).forEach((node) => {
        processAdNode(node, fallbackNodeDataForCommon[node.id], placeholderUrl)
      })
    })
  })

  let submittedForms = []
  function onFormSubmit (form, formOrigin) {
    if (submittedForms.includes(form)) {
      return
    }
    var fields = getFormFields(form, true)
    var passwordElem = fields[1]
    if (!passwordElem || !passwordElem.value) {
      return
    }
    // Re-get action in case it has changed
    var action = form.action || document.location.href
    var usernameElem = fields[0] || {}
    ipcRenderer.send('save-password', usernameElem.value, passwordElem.value,
                     formOrigin, normalizeURL(action))
    submittedForms.push(form)
  }

  /**
   * Try to autofill a form with credentials, using roughly the heuristic from
   * http://mxr.mozilla.org/firefox/source/toolkit/components/passwordmgr/src/nsLoginManager.js
   * @param {Object.<string, Array.<Element>>} credentials - map of form action
   *   to password/username elements with that action
   * @param {string} formOrigin - origin of the form
   * @param {Element} form - the form node
   */
  function tryAutofillForm (credentials, formOrigin, form) {
    var fields = getFormFields(form, false)
    var action = form.action || document.location.href
    action = normalizeURL(action)
    var usernameElem = fields[0]
    var passwordElem = fields[1]

    if (!passwordElem) {
      return
    }

    if (credentials[action]) {
      credentials[action].push([passwordElem, usernameElem])
    } else {
      credentials[action] = [[passwordElem, usernameElem]]
    }

    // Fill the password immediately if there's only one or if the username
    // is already autofilled
    ipcRenderer.send('get-passwords', formOrigin, action)

    if (usernameElem) {
      usernameElem.addEventListener('keyup', (e) => {
        if (!usernameElem) {
          return
        }
        let rect = usernameElem.getBoundingClientRect()
        ipcRenderer.send('show-username-list', formOrigin, action, {
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width
        }, usernameElem.value || '')
      })
    }

    // Whenever a form is submitted, offer to save it in the password manager
    // if the credentials have changed.
    form.addEventListener('submit', (e) => {
      onFormSubmit(form, formOrigin)
    })
    Array.from(form.querySelectorAll('button')).forEach((button) => {
      button.addEventListener('click', (e) => {
        onFormSubmit(form, formOrigin)
      })
    })
  }

  /**
   * Gets protocol + host + path from a URL.
   * @return {string}
   */
  function normalizeURL (url) {
    if (typeof url !== 'string') {
      return ''
    }
    var a = document.createElement('a')
    a.href = url
    return [a.protocol, a.host].join('//') + a.pathname
  }

  /**
   * @return {boolean}
   */
  function autofillPasswordListener () {
    // Don't autofill on non-HTTP(S) sites for now
    if (document.location.protocol !== 'http:' && document.location.protocol !== 'https:') {
      return false
    }

    if (document.querySelectorAll('input[type=password]:not([autocomplete=off i])').length === 0) {
      // No password fields; abort
      return false
    }

    // Map of action origin to [[password element, username element]]
    var credentials = {}

    var formOrigin = [document.location.protocol, document.location.host].join('//')
    var formNodes = document.querySelectorAll('form:not([autocomplete=off i])')

    Array.from(formNodes).forEach((form) => {
      tryAutofillForm(credentials, formOrigin, form)
    })

    ipcRenderer.on('got-password', (e, username, password, origin, action, isUnique) => {
      console.log('got password', username, isUnique)
      var elems = credentials[action]
      if (formOrigin === origin && elems) {
        elems.forEach((elem) => {
          if (isUnique) {
            // Autofill password if there is only one available
            elem[0].value = password
            if (username && elem[1]) {
              // Autofill the username if needed
              elem[1].value = username
            }
          } else if (elem[1] && username && username === elem[1].value) {
            // If the username is already autofilled by something else, fill
            // in the corresponding password
            elem[0].value = password
          }
        })
      }
    })
    return true
  }

  // Fires when the page is loaded and the default pw manager is enabled
  ipcRenderer.on('autofill-password', autofillPasswordListener)

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

    // look for any form field that has username-ish attributes
    var username = form.querySelector(['input[type=email i]']) ||
        form.querySelector(['input[autocomplete=email i]']) ||
        form.querySelector(['input[autocomplete=username i]']) ||
        form.querySelector(['input[name=email i]']) ||
        form.querySelector(['input[name=username i]']) ||
        form.querySelector(['input[name=user i]']) ||
        form.querySelector(['input[name="session[username_or_email]"]'])

    if (!username) {
      // Search backwards from first password field to find the username field
      let previousSibling = passwords[0].previousSibling
      while (previousSibling) {
        if (previousSibling.type === 'text' && previousSibling.autocomplete !== 'off') {
          username = previousSibling
          break
        }
        previousSibling = previousSibling.previousSibling
      }
    }

    // If not a submission, autofill the first password field and ignore the rest
    if (!isSubmission || passwords.length === 1) {
      return [username, passwords[0], null]
    }

    // Otherwise, this is probably a password change form and we need to figure out
    // what username/password combo to save.
    var oldPassword = null
    var newPassword = null
    var value1 = passwords[0] ? passwords[0].value : ''
    var value2 = passwords[1] ? passwords[1].value : ''
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
    var currentPassword = form.querySelector('input[autocomplete=current-password i]')
    var newPassword = form.querySelector('input[autocomplete=new-password i]')
    if (currentPassword) {
      if (!newPassword) {
        // This probably isn't a password change form; ex: twitter login
        return [currentPassword]
      } else {
        return [currentPassword, newPassword]
      }
    }
    var passwordNodes = Array.from(form.querySelectorAll('input[type=password]:not([autocomplete=off i])'))
    if (isSubmission) {
      // Skip empty fields
      passwordNodes = passwordNodes.filter((e) => { return e.value })
    }
    return passwordNodes
  }

  function hasSelection (node) {
    // Combining these two if clauses causes Flow to throw "recursion limit
    // exceeded" :(
    if (node instanceof HTMLTextAreaElement) {
      if (node.selectionEnd !== node.selectionStart) {
        return true
      }
    } else if (node instanceof HTMLInputElement) {
      if (node.selectionEnd !== node.selectionStart) {
        return true
      }
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

  document.addEventListener('contextmenu', (e/*: Event*/) => {
    window.setTimeout(() => {
      if (!(e instanceof MouseEvent)) {
        return
      }
      // there is another event being fired on contextmenu, don't show this one
      if (e.defaultPrevented) {
        return
      }
      if (!(e.target instanceof HTMLElement)) {
        return
      }

      var name = e.target.nodeName.toUpperCase()
      var href
      var maybeLink = e.target
      // flow requires this check to happen again
      if (!(maybeLink instanceof HTMLElement)) {
        return
      }

      while (maybeLink.parentNode) {
        // Override for about: pages
        if (maybeLink.getAttribute('data-context-menu-disable')) {
          return
        }
        if (maybeLink.nodeName.toUpperCase() === 'A') {
          href = maybeLink.getAttribute('href')
          break
        }
        maybeLink = maybeLink.parentNode
        if (!(maybeLink instanceof HTMLElement)) {
          return
        }
      }

      if (!(e.target instanceof HTMLElement)) {
        return
      }
      var nodeProps = {
        name: name,
        href: href,
        isContentEditable: e.target.isContentEditable,
        src: e.target.getAttribute('src'),
        hasSelection: hasSelection(e.target),
        offsetX: e.pageX,
        offsetY: e.pageY
      }
      ipcRenderer.sendToHost('context-menu-opened', nodeProps)
      e.preventDefault()
    }, 0)
  }, false)

  document.addEventListener('keydown', (e /*: Event*/) => {
    if (!(e instanceof KeyboardEvent)) {
      return
    }
    switch (e.keyCode) {
      case KeyEvent.DOM_VK_ESCAPE:
        e.preventDefault()
        ipcRenderer.sendToHost('stop-load')
        break
      case KeyEvent.DOM_VK_BACK_SPACE:
        if (!isEditable(document.activeElement)) {
          e.shiftKey ? window.history.forward() : window.history.back()
        }
        break
      case KeyEvent.DOM_VK_LEFT:
        if (e.metaKey && !isEditable(document.activeElement) && isPlatformOSX()) {
          window.history.back()
        }
        break
      case KeyEvent.DOM_VK_RIGHT:
        if (e.metaKey && !isEditable(document.activeElement) && isPlatformOSX()) {
          window.history.forward()
        }
        break
    }
  })

  // shamelessly taken from https://developer.mozilla.org/en-US/docs/Web/Events/mouseenter
  function delegate (event, selector) {
    var target = event.target
    var related = event.relatedTarget

    if (!(target instanceof Element && related instanceof Element)) {
      return
    }

    var match

    // search for a parent node matching the delegation selector
    while (target && target !== document && target.matches && !(match = target.matches(selector))) {
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

  document.addEventListener('mouseover', (event/*: Event*/) => {
    if (!(event instanceof MouseEvent)) {
      return
    }
    var target = delegate(event, 'a')
    if (target) {
      const pos = {
        x: event.clientX,
        y: event.clientY
      }
      ipcRenderer.sendToHost('link-hovered', target.href, pos)
    }
  })

  document.addEventListener('mouseout', (event/*: Event*/) => {
    if (!(event instanceof MouseEvent)) {
      return
    }
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
