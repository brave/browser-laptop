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

// UI state object. Pure function from state -> React element.
const store = {
  torrentId: window.decodeURIComponent(window.location.hash.substring(1)),
  parsedTorrent: null,
  client: null,
  torrent: null,
  errorMessage: null
}
window.store = store /* for easier debugging */

store.parsedTorrent = parseTorrent(store.torrentId)

// Create the client, set up IPC to the WebTorrentRemoteServer
store.client = new WebTorrentRemoteClient(send)
store.client.on('warning', onWarning)
store.client.on('error', onError)

ipc.on(messages.TORRENT_MESSAGE, function (e, msg) {
  store.client.receive(msg)
})

function send (msg) {
  ipc.send(messages.TORRENT_MESSAGE, msg)
}

// Clean up the client before the window exits
window.addEventListener('beforeunload', function () {
  store.client.destroy({delay: 1000})
})

// Check whether we're already part of this swarm. If not, show a Start button.
store.client.get(store.torrentId, function (err, torrent) {
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
  if (store.parsedTorrent && store.parsedTorrent.name) {
    document.title = store.parsedTorrent.name
  }
}

function addTorrentEvents (torrent) {
  torrent.on('warning', onWarning)
  torrent.on('error', onError)
}

function onWarning (err) {
  console.warn(err.message)
}

function onError (err) {
  store.errorMessage = err.message
}

function start () {
  store.client.add(store.torrentId, onAdded, {server: {}})
}

function onAdded (err, torrent) {
  if (err) {
    store.errorMessage = err.message
    return console.error(err)
  }
  store.torrent = torrent
  addTorrentEvents(torrent)
  update()
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
