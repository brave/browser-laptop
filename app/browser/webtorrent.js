const electron = require('electron')
const ipc = electron.ipcMain
const appUrlUtil = require('../../js/lib/appUrlUtil')
const messages = require('../../js/constants/messages')
const Filtering = require('../filtering')

// Set to see communication between WebTorrent and torrent viewer tabs
const DEBUG_IPC = false
if (DEBUG_IPC) console.log('WebTorrent IPC debugging enabled')

// var VIEWER_URL = chrome.extension.getURL('../extensions/torrent/webtorrent.html')
var VIEWER_URL = appUrlUtil.getTorrentExtUrl('webtorrent.html')

function getViewerURL (torrentUrl) {
  return VIEWER_URL + '#' + encodeURIComponent(torrentUrl)
}

// Connects to the BitTorrent network
// Communicates with the WebTorrentRemoteClients via message passing
let server = null
let channels = {}

// Receive messages via the window process, ultimately from the UI in a <webview> process
function init (state, action) {
  if (DEBUG_IPC) console.log('WebTorrent IPC init')
  ipc.on(messages.TORRENT_MESSAGE, function (e, msg) {
    if (server === null) {
      const WebTorrentRemoteServer = require('webtorrent-remote/server')
      server = new WebTorrentRemoteServer(send, {trace: DEBUG_IPC})
    }
    if (DEBUG_IPC) console.log('Received IPC: ' + JSON.stringify(msg))
    channels[msg.clientKey] = e.sender
    server.receive(msg)
  })
  setupFiltering()
  return state
}

// Send messages from the browser process (here), thru the window process, to the <webview>
function send (msg) {
  if (DEBUG_IPC) console.log('Sending IPC: ' + JSON.stringify(msg))
  const channel = channels[msg.clientKey]
  if (!channel) {
    if (DEBUG_IPC) console.error('Ignoring unrecognized clientKey ' + msg.clientKey)
    return
  }
  if (channel.isDestroyed()) {
    if (DEBUG_IPC) console.log('Removing destroyed channel, clientKey ' + msg.clientKey)
    delete channels[msg.clientKey]
    return
  }
  channel.send(messages.TORRENT_MESSAGE, msg)
}

function setupFiltering () {
  Filtering.registerHeadersReceivedFilteringCB(function (details, isPrivate) {
    if (details.method !== 'GET') {
      return {}
    }
    if (!isTorrentFile(details)) {
      return {}
    }

    var viewerUrl = getViewerURL(details.url)

    return {
      responseHeaders: {
        'Location': [ viewerUrl ]
      },
      statusLine: 'HTTP/1.1 301 Moved Permanently',
      resourceName: 'webtorrent'
    }
  })
}

/**
 * Check if the request is a torrent file.
 * @param {Object} details First argument of the webRequest.onHeadersReceived
 *                         event. The properties "responseHeaders" and "url"
 *                         are read.
 * @return {boolean} True if the resource is a torrent file.
 */
function isTorrentFile (details) {
  var header = getHeader(details.responseHeaders, 'content-type')
  if (header) {
    var headerValue = header.toLowerCase().split(';', 1)[0].trim()
    if (headerValue === 'application/x-bittorrent') {
      return true
    }
    if (headerValue === 'application/octet-stream') {
      if (details.url.toLowerCase().indexOf('.torrent') > 0) {
        return true
      }
      var cdHeader =
        getHeader(details.responseHeaders, 'content-disposition')
      if (cdHeader && /\.torrent(["']|$)/i.test(cdHeader)) {
        return true
      }
    }
  }
  return false
}

function getHeader (headers, headerName) {
  var headerNames = Object.keys(headers)
  for (var i = 0; i < headerNames.length; ++i) {
    if (headerNames[i].toLowerCase() === headerName) {
      return headers[headerNames[i]][0]
    }
  }
}

module.exports = {
  init,
  resourceName: 'webtorrent'
}
