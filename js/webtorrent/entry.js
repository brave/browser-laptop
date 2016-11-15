/* global Blob, URL */

const ipc = window.chrome.ipc
const messages = require('../constants/messages')
const parseTorrent = require('parse-torrent')
const React = require('react')
const ReactDOM = require('react-dom')
const WebTorrentRemoteClient = require('webtorrent-remote/client')

// React Components
const Button = require('../components/button')
const TorrentFileList = require('./components/torrentFileList')
const TorrentStats = require('./components/torrentStats')

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
state.client = new WebTorrentRemoteClient(send)
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
  let name = state.parsedTorrent && state.parsedTorrent.name
  if (!name) {
    name = state.torrent
      ? 'Loading torrent information...'
      : 'Untitled torrent'
  }
  document.title = name

  const elem = <TorrentViewer name={name} />
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

class TorrentViewer extends React.Component {
  constructor () {
    super()
    this.state = {} // Needed for SortableTable.stateOwner
  }

  render () {
    const ix = state.parsedTorrent && state.parsedTorrent.ix // Selected file index

    let fileContent
    if (state.torrent && ix != null) {
      fileContent = state.torrent.serverURL != null
        ? <iframe src={state.torrent.serverURL + '/' + ix} sandbox='allow-same-origin' />
        : <div>Loading...</div>
    }

    let titleElem, mainButtonId
    if (state.torrent) {
      titleElem = <div className='sectionTitle'>{this.props.name}</div>
      mainButtonId = state.torrent.progress < 1 ? 'downloading' : 'seeding'
    } else {
      const l10nArgs = {
        name: this.props.name
      }
      titleElem = (
        <div
          data-l10n-id='startPrompt'
          data-l10n-args={JSON.stringify(l10nArgs)}
          className='sectionTitle' />
      )
      mainButtonId = 'startDownload'
    }

    const legalNotice = state.torrent == null
      ? <div className='legalNotice' data-l10n-id='legalNotice' />
      : <a className='legalNotice' data-l10n-id='poweredByWebTorrent' href='https://webtorrent.io' target='_blank' />

    return (
      <div className='siteDetailsPage'>
        <div className='siteDetailsPageHeader'>
          {titleElem}
          <div className='headerActions'>
            <Button
              l10nId='saveTorrentFile'
              className='whiteButton saveTorrentFile'
              onClick={saveTorrentFile} />
            <Button
              l10nId={mainButtonId}
              className='whiteButton mainButton'
              disabled={!!state.torrent}
              onClick={start} />
          </div>
        </div>

        <div className='siteDetailsPageContent'>
          <TorrentStats torrent={state.torrent} errorMessage={state.errorMessage} />
          <div className='fileContent'>
            {fileContent}
          </div>
          <TorrentFileList
            files={state.torrent && state.torrent.files}
            stateOwner={this}
            torrentID={state.torrentID} />
          {legalNotice}
        </div>
      </div>
    )
  }
}
