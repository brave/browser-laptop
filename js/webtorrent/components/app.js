const React = require('react')

const MediaViewer = require('./mediaViewer')
const TorrentViewer = require('./torrentViewer')

class App extends React.Component {
  render () {
    const {
      ix,
      name,
      torrentId,
      torrentIdProtocol,
      torrent,
      serverUrl,
      errorMessage
    } = this.props.store

    if (torrent && ix != null) {
      return <MediaViewer torrent={torrent} serverUrl={serverUrl} ix={ix} />
    } else {
      return (
        <TorrentViewer
          name={name}
          torrentId={torrentId}
          torrentIdProtocol={torrentIdProtocol}
          torrent={torrent}
          serverUrl={serverUrl}
          errorMessage={errorMessage}
          dispatch={this.props.dispatch} />
      )
    }
  }
}

module.exports = App
