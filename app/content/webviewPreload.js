/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var webFrame = require('electron').webFrame
var ipc = require('electron').ipcRenderer
var messages = require('../../js/constants/messages')
var KeyCodes = require('../../js/constants/keyCodes')

var browserZoomLevel = 0
var browserMaxZoom = 9
var browserMinZoom = -8

ipc.on(messages.ZOOM_IN, function () {
  if (browserMaxZoom > browserZoomLevel) {
    browserZoomLevel += 1
  }
  webFrame.setZoomLevel(browserZoomLevel)
})

ipc.on(messages.ZOOM_OUT, function () {
  if (browserMinZoom < browserZoomLevel) {
    browserZoomLevel -= 1
  }
  webFrame.setZoomLevel(browserZoomLevel)
})

ipc.on(messages.ZOOM_RESET, function () {
  browserZoomLevel = 0
  webFrame.setZoomLevel(browserZoomLevel)
})

ipc.on(messages.PRINT_PAGE, function () {
  window.print()
})

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
    iframe.sandbox = 'allow-scripts'
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
ipc.on(messages.SET_AD_DIV_CANDIDATES, function (e, adDivCandidates, placeholderUrl) {
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

document.addEventListener('contextmenu', (e) => {
  var name = e.target.nodeName.toUpperCase()
  var nodeProps = {
    name: name,
    src: name === 'A' ? e.target.href : e.target.src
  }
  console.log('sending', nodeProps)
  ipc.send(messages.CONTEXT_MENU_OPENED, nodeProps)
  e.preventDefault()
}, false)

document.onkeydown = (e) => {
  switch (e.keyCode) {
    case KeyCodes.ESC:
      e.preventDefault()
      ipc.send(messages.STOP_LOAD)
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
