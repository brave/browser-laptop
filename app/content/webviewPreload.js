/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// inject missing DOM Level 3 KeyEvent
// https://www.w3.org/TR/2001/WD-DOM-Level-3-Events-20010410/DOM3-Events.html#events-Events-KeyEvent
if (typeof KeyEvent === 'undefined') {
  var KeyEvent = {
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
  }
}

// hide this from the rest of the page
(function () {
  var ipc = {
    events: {},
    embedder: null,
    processMessage: function (event) {
      if (event.origin === 'file://') {
        this.embedder = event.source
        var cb = this.events[event.data[0]]
        cb && cb.apply(null, event.data)
      }
    },
    on: function (name, cb) {
      this.events[name] = cb
    },
    send: function () {
      var args = Array.prototype.slice.call(arguments)
      this.embedder && this.embedder.postMessage(args, 'file://')
    }
  }
  window.addEventListener('message', ipc.processMessage.bind(ipc))

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
    var srcUrl = replacementUrl + '?width=' + adSize[0] + '&height=' + adSize[1] + '&seg=' + segment + ':' + time_in_segment + ':' + segment_expiration_time
    var src = '<html><body style="width: ' + adSize[0] + 'px; height: ' + adSize[1] + '; padding: 0; margin: 0; overflow: hidden;"><script src="' + srcUrl + '"></script></body></html>'

    if (node.tagName === 'IFRAME') {
      node.srcdoc = src
      node.sandbox = 'allow-scripts'
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
      iframe.sandbox = 'allow-scripts allow-popups'
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

  // Fires when the browser has ad replacement information to give
  ipc.on('set-ad-div-candidates', function (e, adDivCandidates, placeholderUrl) {
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

  function hasSelection (node) {
    if (node && node.selectionStart !== undefined &&
        node.selectionEnd !== undefined &&
        node.selectionStart !== node.selectionEnd) {
      return true
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
    var name = e.target.nodeName.toUpperCase()
    var nodeProps = {
      name: name,
      src: name === 'A' ? e.target.href : e.target.src,
      isContentEditable: e.target.isContentEditable,
      hasSelection: hasSelection(e.target)
    }
    ipc.send('context-menu-opened', nodeProps)
    e.preventDefault()
  }, false)

  document.onkeydown = (e) => {
    switch (e.keyCode) {
      case KeyEvent.DOM_VK_ESCAPE:
        e.preventDefault()
        ipc.send('stop-load')
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
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Hide broken images
    Array.from(document.querySelectorAll('img')).forEach(function (img) {
      img.addEventListener('error', function () {
        this.style.visibility = 'hidden'
      })
    })
  })
})()
