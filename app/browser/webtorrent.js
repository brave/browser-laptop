const electron = require('electron')
const ipc = electron.ipcMain
const messages = require('../../js/constants/messages')

// Set to see communication between WebTorrent and torrent viewer tabs
const DEBUG_IPC = false
if (DEBUG_IPC) console.log('WebTorrent IPC debugging enabled')

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

module.exports = {
  init,
  resourceName: 'webtorrent'
}
