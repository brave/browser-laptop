const React = require('react')

// Components
const Button = require('../../components/button')
const TorrentFileList = require('./torrentFileList')
const TorrentStatus = require('./torrentStatus')

class TorrentViewer extends React.Component {
  constructor () {
    super()
    this.state = {} // Needed for SortableTable.stateOwner
  }

  render () {
    const {torrent, torrentID, errorMessage, dispatch} = this.props

    let titleElem, mainButtonId
    if (torrent) {
      titleElem = <div className='sectionTitle'>{this.props.name}</div>
      mainButtonId = torrent.progress < 1 ? 'downloading' : 'seeding'
    } else {
      const l10nArgs = {
        name: this.props.name
      }
      titleElem = (
        <div
          data-l10n-id='startPrompt'
          data-l10n-args={JSON.stringify(l10nArgs)}
          className='sectionTitle' />
      )
      mainButtonId = 'startDownload'
    }

    const legalNotice = torrent != null
      ? <a className='legalNotice' data-l10n-id='poweredByWebTorrent' href='https://webtorrent.io' target='_blank' />
      : <div className='legalNotice' data-l10n-id='legalNotice' />

    return (
      <div className='siteDetailsPage'>
        <div className='siteDetailsPageHeader'>
          {titleElem}
          <div className='headerActions'>
            <Button
              l10nId='saveTorrentFile'
              className='whiteButton saveTorrentFile'
              onClick={() => dispatch('saveTorrentFile')} />
            <Button
              l10nId={mainButtonId}
              className='whiteButton mainButton'
              disabled={!!torrent}
              onClick={() => dispatch('start')} />
          </div>
        </div>

        <div className='siteDetailsPageContent'>
          <TorrentStatus torrent={torrent} errorMessage={errorMessage} />
          <TorrentFileList
            files={torrent && torrent.files}
            stateOwner={this}
            torrentID={torrentID} />
          {legalNotice}
        </div>
      </div>
    )
  }
}

module.exports = TorrentViewer
