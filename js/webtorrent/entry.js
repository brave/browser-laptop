const ReactDOM = require('react-dom')
var WebTorrent = window.WebTorrent // require('webtorrent')

var state = {
  torrentId: window.location.hash.substring(1),
  progress: 0,
  files: [],
  errorMessage: ''
}

// Start downloading the torrent
var client = new WebTorrent()
window.client = client
state.torrent = client.add(state.torrentId)
client.on('error', onError)

// Show download progress
setInterval(update, 1000)

function update () {
  var torrent = state.torrent

  var status
  if (!torrent.infoHash) {
    status = 'Loading torrent information...'
  } else if (torrent.progress < 1) {
    status = 'Downloading ' + (torrent.name || '...')
  } else {
    status = 'Done!'
  }

  var elem = (
    <div>
      <h1>{status}</h1>
      <h3>Progress: {(torrent.progress * 100).toFixed(1)}%</h3>
      <h3>Files</h3>
      <ul>
        {torrent.files.map((file, i) => {
          var isSelected = i === state.selectedFileIndex
          return (
            <li data-ix={i} class={isSelected && 'selected'} onClick={onClickFile}>
              {file.name}
            </li>
          )
        })}
      </ul>
      <div id='fileContainer' />
      <div class='error'>{state.errorMessage}</div>
    </div>
  )
  ReactDOM.render(elem, document.querySelector('#appContainer'))
}

function onClickFile (e) {
  if (state.selectedFileIndex === e.target.dataset.ix) return
  state.selectedFileIndex = e.target.dataset.ix

  update()

  var fileContainer = document.querySelector('#fileContainer')
  fileContainer.innerHTML = ''
  var file = state.torrent.files[state.selectedFileIndex]
  file.appendTo(fileContainer)
}

function onError (err) {
  state.errorMessage = err.message
}
