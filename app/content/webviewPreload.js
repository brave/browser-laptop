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
