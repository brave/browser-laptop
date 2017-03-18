const ipc = window.chrome.ipcRenderer

const clipboardCopy = require('clipboard-copy')
const parseTorrent = require('parse-torrent')
const path = require('path')
const querystring = require('querystring')
const React = require('react')
const ReactDOM = require('react-dom')
const url = require('url')
const WebTorrentRemoteClient = require('webtorrent-remote/client')

const App = require('./components/app')
const messages = require('../constants/messages')

// Stylesheets
require('../../less/webtorrent.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

// Pure function from state -> React elements.
const store = {
  name: null, // Torrent name
  ix: null, // Selected file index
  torrentId: window.decodeURIComponent(window.location.hash.substring(1)),
  torrentIdProtocol: null,
  torrent: null,
  serverUrl: null,
  errorMessage: null
}

let client, server

init()

function init () {
  const parsedUrl = url.parse(store.torrentId)
  store.torrentIdProtocol = parsedUrl.protocol

  // `ix` param can be set by query param or hash, e.g. ?ix=1 or #ix=1
  if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
    store.name = path.basename(parsedUrl.pathname)
    store.ix = getIxQuery(parsedUrl)
    if (store.ix == null) store.ix = getIxHash(parsedUrl)
  } else if (parsedUrl.protocol === 'magnet:') {
    let parsedTorrent
    try {
      parsedTorrent = parseTorrent(store.torrentId)
    } catch (err) {
      return onError(new Error('Invalid torrent identifier'))
    }
    store.name = parsedTorrent.name
    store.ix = parsedTorrent.ix
    if (store.ix == null) store.ix = getIxHash(parsedUrl)
  } else {
    return onError(new Error('Invalid torrent identifier'))
  }

  document.title = store.name

  // Create the client, set up IPC to the WebTorrentRemoteServer
  client = new WebTorrentRemoteClient(send)
  client.on('warning', onWarning)
  client.on('error', onError)

  ipc.on(messages.TORRENT_MESSAGE, function (e, msg) {
    client.receive(msg)
  })

  // Check whether we're already part of this swarm. If not, show a Start button.
  client.get(store.torrentId, function (err, torrent) {
    if (!err) {
      store.torrent = torrent
      initTorrent(torrent)
    }
    update()
  })

  // Clean up the client. Note: Since this does IPC, it's not guaranteed to send
  // before the page is closed. But that's okay; webtorrent-remote expects regular
  // heartbeats and assumes clients are dead after 30s without one. So basically,
  // this is an optimization to destroy the client sooner.
  window.addEventListener('beforeunload', function () {
    client.destroy()
  })

  // Update the UI (to show download speed) every 1s.
  update()
  setInterval(update, 1000)
}

function getIxQuery (parsedUrl) {
  const ix = Number(querystring.parse(parsedUrl.query).ix)
  return Number.isNaN(ix) ? null : ix
}

function getIxHash (parsedUrl) {
  const ix = Number(querystring.parse((parsedUrl.hash || '').slice(1)).ix)
  return Number.isNaN(ix) ? null : ix
}

function send (msg) {
  ipc.send(messages.TORRENT_MESSAGE, msg)
}

function update () {
  const elem = <App store={store} dispatch={dispatch} />
  ReactDOM.render(elem, document.querySelector('#appContainer'))
}

function onAdded (err, torrent) {
  if (err) return onError(err)

  store.torrent = torrent
  initTorrent(torrent)

  update()
}

function onServerListening () {
  store.serverUrl = 'http://localhost:' + server.address().port
  update()
}

function initTorrent (torrent) {
  // Once torrent's canonical name is available, use it
  if (torrent.name) {
    store.name = torrent.name
    document.title = store.name
  }

  torrent.on('warning', onWarning)
  torrent.on('error', onError)

  server = torrent.createServer()
  server.listen(onServerListening)

  // These event listeners aren't strictly required, but it's better to update the
  // UI immediately when important events happen instead of waiting for the regular
  // update() call that happens on a 1 second interval.
  torrent.on('infohash', update)
  torrent.on('metadata', update)
  torrent.on('done', update)
}

function dispatch (action) {
  switch (action) {
    case 'start':
      return start()
    case 'saveTorrentFile':
      return saveTorrentFile()
    case 'copyMagnetLink':
      return copyMagnetLink()
    default:
      console.error('Ignoring unknown dispatch type: ' + JSON.stringify(action))
  }
}

function start () {
  client.add(store.torrentId, onAdded)
}

function saveTorrentFile () {
  let a = document.createElement('a')
  a.target = '_blank'
  a.download = true
  a.href = store.torrentId
  a.click()
}

function copyMagnetLink () {
  clipboardCopy(store.torrentId)
}

function onWarning (err) {
  console.warn(err.message)
}

function onError (err) {
  store.errorMessage = err.message
  console.error(err.message)
  update()
}

/* for easier debugging */
window.store = store
window.client = client
window.server = server
