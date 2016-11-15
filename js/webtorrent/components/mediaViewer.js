const React = require('react')

class MediaViewer extends React.Component {
  render () {
    const torrent = this.props.torrent
    const ix = this.props.ix

    let content
    if (torrent.serverURL != null) {
      content = <iframe src={torrent.serverURL + '/' + ix} sandbox='allow-same-origin' />
    } else {
      content = <div>Loading...</div>
    }

    return (
      <div className='mediaViewer'>
        {content}
      </div>
    )
  }
}

module.exports = MediaViewer
