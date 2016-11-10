const electron = require('electron')
const ipc = electron.ipcMain
const messages = require('../../js/constants/messages')
const WebTorrentRemoteServer = require('webtorrent-remote/server')

var DEBUG_IPC = false // Set to see communication between WebTorrent and torrent viewer tabs
var ANNOUNCE = [
  'wss://tracker.btorrent.xyz',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.fastcast.nz'
]

// Connects to the BitTorrent network
// Communicates with the WebTorrentRemoteClients via message passing
var server = new WebTorrentRemoteServer(send, {
  announce: ANNOUNCE
})
var channels = {}

// Receive messages via the window process, ultimately from the UI in a <webview> process
ipc.on(messages.TORRENT_MESSAGE, function (e, msg) {
  if (DEBUG_IPC) console.log('Received IPC: ' + JSON.stringify(msg))
  channels[msg.clientKey] = e.sender
  server.receive(msg)
})

// Send messages from the browser process (here), thru the window process, to the <webview>
function send (msg) {
  if (DEBUG_IPC) console.log('Sending IPC: ' + JSON.stringify(msg))
  var channel = channels[msg.clientKey]
  if (!channel) throw new Error('Unrecognized clientKey ' + msg.clientKey)
  channel.send(messages.TORRENT_MESSAGE, msg)
}
