var electron = require('electron')
var ipc = electron.ipcRenderer
var webFrame = electron.webFrame

var browserZoomLevel = 0
var browserMaxZoom = 9
var browserMinZoom = -8

ipc.on('zoomIn', function () {
  if (browserMaxZoom > browserZoomLevel) {
    browserZoomLevel += 1
  }
  webFrame.setZoomLevel(browserZoomLevel)
})

ipc.on('zoomOut', function () {
  if (browserMinZoom < browserZoomLevel) {
    browserZoomLevel -= 1
  }
  webFrame.setZoomLevel(browserZoomLevel)
})

ipc.on('zoomReset', function () {
  browserZoomLevel = 0
  webFrame.setZoomLevel(browserZoomLevel)
})
