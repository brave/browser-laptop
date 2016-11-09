const electron = require('electron')
const ipc = electron.ipcMain
const messages = require('../../js/constants/messages')
const WebTorrent = require('webtorrent')

var DEBUG_IPC = false // Set to see communication between WebTorrent and torrent viewer tabs
var ANNOUNCE = [
  'wss://tracker.btorrent.xyz',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.fastcast.nz'
]

var client = null
var channels = {}

ipc.on(messages.TORRENT_MESSAGE, function (e, msg) {
  if (DEBUG_IPC) console.log('Received IPC: ' + JSON.stringify(msg))
  channels[msg.channelID] = e.sender
  handleMessage(msg)
})

function handleMessage (msg) {
  switch (msg.type) {
    case 'add':
      return handleAdd(msg)
    default:
      // Sanity check. Is there a better way to do error logging in the browser process?
      console.error('Ignoring unknown action ' + msg.type + ', channel ' + msg.channelID)
  }
}

function handleAdd (msg) {
  var torrent = lazyClient().add(msg.torrentID, {
    announce: ANNOUNCE
  })
  if (torrent.channelID) throw new Error('torrent already has a channelID')
  // TODO: handle the case where two different tabs (two different channels)
  // both open the same infohash
  torrent.channelID = msg.channelID
  addTorrentEvents(torrent)
}

function addClientEvents () {
  client.on('error', function (err) {
    sendToAllChannels({errorMessage: err.message})
  })
}

function addTorrentEvents (torrent) {
  torrent.on('infohash', () => sendInfo(torrent))
  torrent.on('metadata', () => sendInfo(torrent))
  torrent.on('progress', () => sendProgress(torrent))
  torrent.on('done', () => sendProgress(torrent))
}

function sendProgress (torrent) {
  send({
    type: 'progress',
    channelID: torrent.channelID,
    progress: torrent.progress
  })
}

function sendInfo (torrent) {
  var msg = {
    type: 'info',
    channelID: torrent.channelID,
    torrent: {
      name: torrent.name,
      infohash: torrent.infohash,
      progress: torrent.progress,
      files: []
    }
  }
  if (torrent.files) {
    msg.torrent.files = torrent.files.map(function (file) {
      return {
        name: file.name
      }
    })
  }
  send(msg)
}

function send (msg) {
  if (DEBUG_IPC) console.log('Sending IPC: ' + JSON.stringify(msg))
  channels[msg.channelID].send(messages.TORRENT_MESSAGE, msg)
}

function sendToAllChannels (msg) {
  for (var channelID in channels) {
    var channelMsg = Object.assign({}, msg, {channelID})
    send(channelMsg)
  }
}

function lazyClient () {
  if (client) return client
  client = new WebTorrent()
  addClientEvents()
  return client
}
