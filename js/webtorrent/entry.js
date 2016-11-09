const ReactDOM = require('react-dom')
const magnetURI = require('magnet-uri')
const Button = require('../components/button')
const messages = require('../constants/messages')
const uuid = require('uuid')

require('../../less/webtorrent.less')

// Set window.state for easier debugging
var state = window.state = {
  torrentID: window.location.hash.substring(1),
  torrent: null,
  dn: '',
  errorMessage: '',
  isFileLoaded: false
}

// Show download progress
setInterval(render, 1000)
render()

// Talk to the webtorrent process
var CHANNEL_ID = uuid.v4()
var ipc = window.chrome.ipc
ipc.on(messages.TORRENT_MESSAGE, function (e, msg) {
  switch (msg.type) {
    case 'info':
      return handleInfo(msg)
    case 'progress':
      return handleProgress(msg)
    case 'error':
      return handleError(msg)
  }
})

function handleInfo (msg) {
  state.torrent = msg.torrent
}

function handleProgress (msg) {
  if (state.torrent) state.torrent.progress = msg.progress
}

function handleError (msg) {
  state.errorMessage = msg.errorMessage
}

function start () {
  ipc.sendToHost(messages.TORRENT_MESSAGE, {
    channelID: CHANNEL_ID,
    type: 'add',
    torrentID: state.torrentID
  })
}

function render () {
  var torrent = state.torrent
  var id = state.torrentID

  // TODO: right now, we only support magnet links as the torrentID
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
    // TODO: load over HTTP, either into an <iframe>
    // ... or pick <video> / <audio> / <img> etc based on filetype
    // var ix = Number(state.magnetInfo.ix)
    content = (
      <div className='content'>
        <div id='fileContainer' />
      </div>
    )
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
