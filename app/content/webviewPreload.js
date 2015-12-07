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
