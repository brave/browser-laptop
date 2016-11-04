const ReactDOM = require('react-dom')
const magnetURI = require('magnet-uri')
const Button = require('../components/button')

/**
 * TODO: Once WebTorrent is running in it's own process, replace the window
 * globals with require() calls. Delete ext/webtorrent.min.js.
 */
const WebTorrent = window.WebTorrent // require('webtorrent')

/**
 * TODO: Replace hard-coded list of community trackers with latest list from
 * create-torrent package, similar to how WebTorrent Desktop does it here:
 * https://github.com/feross/webtorrent-desktop/blob/4bb2056bc9c1a421815b97d03ffed512575dfde0/src/renderer/webtorrent.js#L29-L31
 */
window.WEBTORRENT_ANNOUNCE = [
  'wss://tracker.btorrent.xyz',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.fastcast.nz'
]

var state = {
  torrentId: window.location.hash.substring(1),
  torrent: null,
  progress: 0,
  files: [],
  dn: '',
  errorMessage: '',
  isFileLoaded: false
}

require('../../less/webtorrent.less')

// Start downloading the torrent
var client = window.client = new WebTorrent()
client.on('error', onError)

// Show download progress
setInterval(render, 1000)
render()

function start () {
  state.torrent = client.add(state.torrentId)
}

function render () {
  var torrent = state.torrent
  var id = state.torrentId

  // TODO: right now, we only support magnet links as the torrentId
  // Eventually, we need to support .torrent files as well, prob using parse-torrent
  if (!state.magnetInfo && id.startsWith('magnet:?')) {
    state.magnetInfo = magnetURI(id)
  }
  var magnetName = state.magnetInfo && state.magnetInfo.dn

  var title
  if (!torrent) {
    title = magnetName || 'New torrent'
  } else if (!torrent.name) {
    title = magnetName || 'Loading torrent information...'
  } else {
    title = torrent.name
  }
  document.title = title

  var status
  if (!state.torrent) {
    status = (
      <Button l10nId='startTorrent' className='primaryButton' onClick={start}>Start</Button>
    )
  } else if (torrent.progress < 1) {
    status = (
      <span>Downloading: {(torrent.progress * 100).toFixed(1)}%</span>
    )
  } else {
    status = (
      <span>Complete: 100%</span>
    )
  }
  status = (
    <span className='status'>
      {status}
    </span>
  )

  var content
  if (!state.torrent) {
    content = (
      <div className='content'>
        <strong>Warning: </strong>
        please ensure that you have legal rights to download and share this content before
        clicking Start.
      </div>
    )
  } else if (state.magnetInfo && state.magnetInfo.ix != null) {
    content = (
      <div className='content'>
        <div id='fileContainer' />
      </div>
    )

    var ix = Number(state.magnetInfo.ix)
    if (torrent && torrent.files && torrent.files[ix] && !state.isFileLoaded) {
      var file = state.torrent.files[ix]
      file.appendTo(document.querySelector('#fileContainer'))
      state.isFileLoaded = true
    }
  } else {
    var fileElems = torrent.files.map((file, i) => {
      return (
        <li>
          <a href={id + '&ix=' + i}>{file.name}</a>
        </li>
      )
    })

    var fileList
    if (fileElems.length === 0) {
      fileList = (<div>Loading...</div>)
    } else {
      fileList = (
        <ul className='files'>
          {fileElems}
        </ul>
      )
    }

    content = (
      <div className='content'>
        <h3>Files</h3>
        {fileList}
      </div>
    )
  }

  var elem = (
    <div>
      <h1>{title}</h1>
      <div className='status-bar'>
        {status}
        <span className='button'>
          <span className='fa fa-magnet' />
          <span>Copy magnet link</span>
        </span>
        <span className='button'>
          <span className='fa fa-file-o' />
          <span>Save torrent file</span>
        </span>
      </div>
      {content}
      <div className='error'>{state.errorMessage}</div>
    </div>
  )
  ReactDOM.render(elem, document.querySelector('#appContainer'))
}

function onError (err) {
  state.errorMessage = err.message
}
