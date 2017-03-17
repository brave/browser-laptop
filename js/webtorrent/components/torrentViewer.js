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
    const {
      name,
      torrentId,
      torrent,
      serverUrl,
      errorMessage,
      torrentIdProtocol,
      dispatch
    } = this.props

    let titleElem, mainButtonId

    if (torrent) {
      if (name) {
        // No localization, just use the torrent name
        titleElem = <div className='sectionTitle'>{name}</div>
      } else {
        // 'Loading torrent information...'
        titleElem = <div className='sectionTitle' data-l10n-id='torrentLoadingInfo' />
      }
      mainButtonId = torrent.progress < 1 ? 'downloading' : 'seeding'
    } else {
      const l10nStart = name ? 'startPrompt' : 'startPromptUntitled'
      const l10nArgs = {name}
      titleElem = (
        <div
          data-l10n-id={l10nStart}
          data-l10n-args={JSON.stringify(l10nArgs)}
          className='sectionTitle' />
      )
      mainButtonId = 'startDownload'
    }

    if (torrentIdProtocol === 'magnet:') {
      saveButton = (
        <Button
          l10nId='copyMagnetLink'
          className='whiteButton copyMagnetLink'
          onClick={() => dispatch('copyMagnetLink')}
        />
      )
    } else {
      saveButton = (
        <Button
          l10nId='saveTorrentFile'
          className='whiteButton saveTorrentFile'
          onClick={() => dispatch('saveTorrentFile')}
        />
      )
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
              l10nId={mainButtonId}
              className='primaryButton mainButton'
              disabled={!!torrent}
              onClick={() => dispatch('start')}
            />
            {saveButton}
          </div>
        </div>

        <div className='siteDetailsPageContent'>
          <TorrentStatus torrent={torrent} errorMessage={errorMessage} />
          <TorrentFileList
            torrentId={torrentId}
            torrent={torrent}
            serverUrl={serverUrl}
            stateOwner={this}
          />
          {legalNotice}
        </div>
      </div>
    )
  }
}

module.exports = TorrentViewer
