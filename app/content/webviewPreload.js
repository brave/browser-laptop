/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var webFrame = require('electron').webFrame
var ipc = require('electron').ipcRenderer

var browserZoomLevel = 0
var browserMaxZoom = 9
var browserMinZoom = -8

ipc.on('zoom-in', function () {
  if (browserMaxZoom > browserZoomLevel) {
    browserZoomLevel += 1
  }
  webFrame.setZoomLevel(browserZoomLevel)
})

ipc.on('zoom-out', function () {
  if (browserMinZoom < browserZoomLevel) {
    browserZoomLevel -= 1
  }
  webFrame.setZoomLevel(browserZoomLevel)
})

ipc.on('zoom-reset', function () {
  browserZoomLevel = 0
  webFrame.setZoomLevel(browserZoomLevel)
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
 * @param placeholderUrl The vault URL with encoded user ID and session ID to use
 */
function processAdNode (node, iframeData, placeholderUrl) {
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
  var srcUrl = placeholderUrl + '&width=' + encodeURIComponent(adSize[0]) + '&height=' + encodeURIComponent(adSize[1])
  if (node.tagName === 'IFRAME') {
    node.src = srcUrl
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
    iframe.src = srcUrl
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
    '[id^="ad-slot-banner-"]'
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
