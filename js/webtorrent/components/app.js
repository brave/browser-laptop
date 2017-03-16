const React = require('react')

const MediaViewer = require('./mediaViewer')
const TorrentViewer = require('./torrentViewer')

class App extends React.Component {
  render () {
    const {
      torrent,
      torrentId,
      errorMessage,
      parsedTorrent,
      dispatch
    } = this.props.store

    const ix = parsedTorrent && parsedTorrent.ix // Selected file index
    const name = parsedTorrent && parsedTorrent.name

    if (torrent && ix != null) {
      return <MediaViewer torrent={torrent} ix={ix} />
    } else {
      return (
        <TorrentViewer
          name={name}
          torrent={torrent}
          torrentId={torrentId}
          errorMessage={errorMessage}
          dispatch={dispatch} />
      )
    }
  }
}

module.exports = App
