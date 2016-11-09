const prettierBytes = require('prettier-bytes')

const ImmutableComponent = require('../../components/immutableComponent')

class TorrentStats extends ImmutableComponent {
  render () {
    const torrent = this.props.torrent
    const errorMessage = this.props.errorMessage

    if (!torrent) {
      return null
    }

    if (errorMessage) {
      return <div className='error'>{errorMessage}</div>
    }

    return (
      <div className='torrentStats'>
        <span>{torrent.progress < 1 ? 'Downloading' : 'Seeding'}</span>
        <span>{(torrent.progress * 100).toFixed(1)}%</span>
        {renderTotalProgress()}
        {renderPeers()}
        {renderSpeeds()}
        {renderEta()}
      </div>
    )

    function renderTotalProgress () {
      const downloaded = prettierBytes(torrent.downloaded)
      const total = prettierBytes(torrent.length || 0)
      if (downloaded === total) {
        return (<span>{downloaded}</span>)
      } else {
        return (<span>{downloaded} / {total}</span>)
      }
    }

    function renderPeers () {
      if (torrent.numPeers === 0) return
      const count = torrent.numPeers === 1 ? 'peer' : 'peers'
      return (<span key='peers'>{torrent.numPeers} {count}</span>)
    }

    function renderSpeeds () {
      let str = ''
      if (torrent.downloadSpeed > 0) str += ' ↓ ' + prettierBytes(torrent.downloadSpeed) + '/s'
      if (torrent.uploadSpeed > 0) str += ' ↑ ' + prettierBytes(torrent.uploadSpeed) + '/s'
      if (str === '') return
      return (<span key='download'>{str}</span>)
    }

    function renderEta () {
      const rawEta = torrent.timeRemaining / 1000
      const hours = Math.floor(rawEta / 3600) % 24
      const minutes = Math.floor(rawEta / 60) % 60
      const seconds = Math.floor(rawEta % 60)

      // Only display hours and minutes if they are greater than 0 but always
      // display minutes if hours is being displayed
      const hoursStr = hours ? hours + 'h' : ''
      const minutesStr = (hours || minutes) ? minutes + 'm' : ''
      const secondsStr = seconds + 's'

      return (<span>{hoursStr} {minutesStr} {secondsStr} remaining</span>)
    }
  }
}

module.exports = TorrentStats
