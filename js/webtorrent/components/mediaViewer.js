const React = require('react')

const SUPPORTED_VIDEO_EXTENSIONS = [
  'm4v',
  'mkv',
  'mov',
  'mp4',
  'ogv',
  'webm'
]

const SUPPORTED_AUDIO_EXTENSIONS = [
  'aac',
  'mp3',
  'ogg',
  'wav',
  'm4a'
]

module.exports = class MediaViewer extends React.Component {
  render () {
    const { torrent, serverUrl, ix } = this.props

    const file = torrent.files[ix]
    const fileURL = serverUrl && (serverUrl + '/' + ix)

    const fileExt = file && getExtension(file.name)
    const isVideo = SUPPORTED_VIDEO_EXTENSIONS.includes(fileExt)
    const isAudio = SUPPORTED_AUDIO_EXTENSIONS.includes(fileExt)

    let content
    if (!file || !serverUrl) {
      content = <div data-l10n-id='torrentLoadingMedia' />
    } else if (isVideo) {
      content = <video src={fileURL} autoPlay controls />
    } else if (isAudio) {
      content = <audio src={fileURL} autoPlay controls />
    } else {
      // For security, sandbox and disallow scripts.
      // We need allow-same-origin so that the iframe can load from
      // http://localhost:...
      content = <iframe src={fileURL} sandbox='allow-same-origin' />
    }

    return (
      <div className='mediaViewer'>
        {content}
      </div>
    )
  }
}

// Given 'foo.txt', returns 'txt'
// Given eg. null, undefined, '', or 'README', returns null
function getExtension (filename) {
  if (!filename) return null
  const ix = filename.lastIndexOf('.')
  if (ix < 0) return null
  return filename.substring(ix + 1)
}
