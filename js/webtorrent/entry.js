/* global Blob, URL */

const ipc = window.chrome.ipcRenderer
const messages = require('../constants/messages')
const parseTorrent = require('parse-torrent')
const React = require('react')
const ReactDOM = require('react-dom')
const WebTorrentRemoteClient = require('webtorrent-remote/client')

// React Component
const App = require('./components/app')

// Stylesheets
require('../../less/webtorrent.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

const torrentId = window.decodeURIComponent(window.location.hash.substring(1))
const parsedTorrent = parseTorrent(torrentId)

// Pure function from state -> React elements.
const store = {
  ix: parsedTorrent && parsedTorrent.ix, // Selected file index
  name: parsedTorrent && parsedTorrent.name,
  torrentId: torrentId,
  torrent: null,
  serverUrl: null,
  errorMessage: null
}

// Create the client, set up IPC to the WebTorrentRemoteServer
const client = new WebTorrentRemoteClient(send)
client.on('warning', onWarning)
client.on('error', onError)

ipc.on(messages.TORRENT_MESSAGE, function (e, msg) {
  client.receive(msg)
})

function send (msg) {
  ipc.send(messages.TORRENT_MESSAGE, msg)
}

// Clean up the client before the window exits
window.addEventListener('beforeunload', function () {
  client.destroy()
})

// Check whether we're already part of this swarm. If not, show a Start button.
client.get(store.torrentId, function (err, torrent) {
  if (!err) {
    store.torrent = torrent
    addTorrentEvents(torrent)
  }

  // Page starts blank. This shows a continuously updating torrent UI
  update()
  setInterval(update, 1000)
})

function update () {
  const elem = <App store={store} dispatch={dispatch} />
  ReactDOM.render(elem, document.querySelector('#appContainer'))

  // Update page title
  if (store.name) {
    document.title = store.name
  }
}

function onAdded (err, torrent) {
  if (err) return onError(err)

  // Once torrent's canonical name is available, use it
  if (torrent.name) store.name = torrent.name

  store.torrent = torrent
  addTorrentEvents(torrent)

  const server = torrent.createServer()
  server.listen(function () {
    console.log('ON LISTENING')
    store.serverUrl = 'http://localhost:' + server.address().port
    update()
  })

  update()
}

function addTorrentEvents (torrent) {
  torrent.on('warning', onWarning)
  torrent.on('error', onError)
}

function dispatch (action) {
  switch (action) {
    case 'start':
      return start()
    case 'saveTorrentFile':
      return saveTorrentFile()
    default:
      console.error('Ignoring unknown dispatch type: ' + JSON.stringify(action))
  }
}

function start () {
  client.add(store.torrentId, onAdded)
}

function saveTorrentFile () {
  let parsedTorrent = parseTorrent(store.torrentId)
  let torrentFile = parseTorrent.toTorrentFile(parsedTorrent)

  let torrentFileName = parsedTorrent.name + '.torrent'
  let torrentFileBlobURL = URL.createObjectURL(
    new Blob([torrentFile],
    { type: 'application/x-bittorrent' }
  ))

  let a = document.createElement('a')
  a.target = '_blank'
  a.download = torrentFileName
  a.href = torrentFileBlobURL
  a.click()
}

function onWarning (err) {
  console.warn(err.message)
}

function onError (err) {
  store.errorMessage = err.message
  console.error(err.message)
}

/* for easier debugging */
window.store = store
window.client = client
