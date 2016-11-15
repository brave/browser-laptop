/* global Blob, URL */

const ipc = window.chrome.ipc
const messages = require('../constants/messages')
const parseTorrent = require('parse-torrent')
const React = require('react')
const ReactDOM = require('react-dom')
const WebTorrentRemoteClient = require('webtorrent-remote/client')

// React Components
const MediaViewer = require('./components/mediaViewer')
const TorrentViewer = require('./components/torrentViewer')

// Stylesheets
require('../../less/webtorrent.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

// UI state object. Pure function from `state` -> React element.
const state = {
  torrentID: window.location.hash.substring(1),
  parsedTorrent: null,
  client: null,
  torrent: null,
  errorMessage: null
}
window.state = state /* for easier debugging */

state.parsedTorrent = parseTorrent(state.torrentID)

// Create the client, set up IPC to the WebTorrentRemoteServer
state.client = new WebTorrentRemoteClient(send, {heartbeat: 5e3})
state.client.on('warning', onWarning)
state.client.on('error', onError)

ipc.on(messages.TORRENT_MESSAGE, function (e, msg) {
  state.client.receive(msg)
})

function send (msg) {
  ipc.sendToHost(messages.TORRENT_MESSAGE, msg)
}

// Check whether we're already part of this swarm. If not, show a Start button.
console.log('GETTING ' + state.torrentID)
state.client.get(state.torrentID, function (err, torrent) {
  console.log('GOT ' + state.torrentID, err, torrent)
  if (!err) {
    state.torrent = torrent
    addTorrentEvents(torrent)
  }
  render()
})

// Page starts blank, once you call render() it shows a continuously updating torrent UI
function render () {
  update()
  setInterval(update, 1000)
}

function update () {
  const elem = <App />
  ReactDOM.render(elem, document.querySelector('#appContainer'))
}

function addTorrentEvents (torrent) {
  torrent.on('warning', onWarning)
  torrent.on('error', onError)
}

function onWarning (err) {
  console.warn(err.message)
}

function onError (err) {
  state.errorMessage = err.message
}

function start () {
  state.torrent = state.client.add(state.torrentID)
  addTorrentEvents(state.torrent)
  state.torrent.createServer()
  update()
}

function saveTorrentFile () {
  console.log('saveTorrentFile')
  let parsedTorrent = parseTorrent(state.torrentID)
  let torrentFile = parseTorrent.toTorrentFile(parsedTorrent)

  let torrentFileName = state.parsedTorrent.name + '.torrent'
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

class App extends React.Component {
  constructor () {
    super()
    this.dispatch = this.dispatch.bind(this)
  }

  dispatch (action) {
    switch (action) {
      case 'start':
        return start()
      case 'saveTorrentFile':
        return saveTorrentFile()
      default:
        console.error('Ignoring unknown dispatch type: ' + JSON.stringify(action))
    }
  }

  render () {
    const {torrent, torrentID, errorMessage, parsedTorrent} = state
    const ix = parsedTorrent && parsedTorrent.ix // Selected file index
    let name = parsedTorrent && parsedTorrent.name
    if (!name) {
      name = state.torrent
        ? 'Loading torrent information...'
        : 'Untitled torrent'
    }
    document.title = name // Set page title

    if (state.torrent && ix != null) {
      return <MediaViewer torrent={torrent} ix={ix} />
    } else {
      return (
        <TorrentViewer
          name={name}
          torrent={torrent}
          torrentID={torrentID}
          errorMessage={errorMessage}
          dispatch={this.dispatch} />
      )
    }
  }
}
