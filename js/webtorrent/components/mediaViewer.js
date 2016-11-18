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
    const torrent = this.props.torrent
    const ix = this.props.ix
    const file = torrent.files[ix]
    const fileExt = file && getExtension(file.name)
    const isVideo = SUPPORTED_VIDEO_EXTENSIONS.includes(fileExt)
    const isAudio = SUPPORTED_AUDIO_EXTENSIONS.includes(fileExt)

    let content
    if (torrent.serverURL == null) {
      content = <div data-l10n-id='torrentLoadingMedia' />
    } else if (isVideo) {
      content = (
        <video
          src={torrent.serverURL + '/' + ix}
          autoplay='true'
          controls='true' />
      )
    } else if (isAudio) {
      content = (
        <audio
          src={torrent.serverURL + '/' + ix}
          autoplay='true'
          controls='true' />
      )
    } else {
      content = (
        <iframe
          src={torrent.serverURL + '/' + ix}
          sandbox='allow-same-origin' />
      )
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
