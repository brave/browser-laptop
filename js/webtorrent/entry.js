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

const torrentID = window.location.hash.substring(1)

// UI state object. Pure function from `state` -> React element.
const state = {
  torrentID: torrentID,
  parsedTorrent: parseTorrent(torrentID),
  torrent: null,
  errorMessage: null
}
window.state = state /* for easier debugging */

// TODO: REMOVE THIS HACK ONCE THIS IS ADDRESSED:
// https://github.com/webpack/node-libs-browser/issues/38#issuecomment-259586299
state.torrentID = state.torrentID.replace(/&ws=[^&]/g, '')
state.parsedTorrent = parseTorrent(state.torrentID)

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

class TorrentViewer extends React.Component {
  constructor () {
    super()
    this.state = {}

    this.start = this.start.bind(this)
    this.onError = this.onError.bind(this)
  }

  onWarning (err) {
    console.warn(err.message)
  }

  onError (err) {
    state.errorMessage = err.message
  }

  start () {
    const client = new WebTorrentRemoteClient(send)
    client.on('warning', this.onWarning)
    client.on('error', this.onError)

    ipc.on(messages.TORRENT_MESSAGE, function (e, msg) {
      client.receive(msg)
    })

    function send (msg) {
      ipc.sendToHost(messages.TORRENT_MESSAGE, msg)
    }

    state.torrent = client.add(state.torrentID)
    state.torrent.on('warning', this.onWarning)
    state.torrent.on('error', this.onError)

    if (state.parsedTorrent.ix) {
      state.torrent.createServer()
    }

    update()
  }

  saveTorrentFile () {
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

  render () {
    const ix = state.parsedTorrent && state.parsedTorrent.ix // Selected file index

    const legalNotice = state.torrent == null
      ? <div className='legalNotice' data-l10n-id='legalNotice' />
      : <div className='legalNotice' data-l10n-id='poweredByWebTorrent' />

    let fileContent
    if (state.torrent && ix) {
      fileContent = state.server != null
        ? <iframe src={state.server + '/' + ix} sandbox='allow-same-origin' />
        : <div>Loading...</div>
    }

    return (
      <div className='siteDetailsPage'>
        <div className='siteDetailsPageHeader'>
          <div data-l10n-id='webtorrentPage' className='sectionTitle' />
          <div className='sectionTitle'>: {this.props.name}</div>
          <div className='headerActions'>
            <TorrentStats torrent={state.torrent} errorMessage={state.errorMessage} />
            <Button
              l10nId='startDownload'
              className='whiteButton startDownload'
              disabled={!!state.torrent}
              onClick={this.start} />
            <Button
              l10nId='saveTorrentFile'
              className='whiteButton saveTorrentFile'
              onClick={this.saveTorrentFile} />
          </div>
        </div>

        <div className='siteDetailsPageContent'>
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

// Render immediately, then periodically to show download progress
update()
setInterval(update, 1000)
