const React = require('react')
const cx = require('../../lib/classSet')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../../app/renderer/components/styles/global')
const commonStyles = require('../../../app/renderer/components/styles/commonStyles')

// Components
const Button = require('../../../app/renderer/components/common/button')
const TorrentFileList = require('./torrentFileList')
const TorrentStatus = require('./torrentStatus')
const BraveLink = require('../../../app/renderer/components/common/braveLink')

const {AboutPageSectionTitle} = require('../../../app/renderer/components/common/sectionTitle')

class TorrentViewer extends React.Component {
  constructor (props) {
    super(props)
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

    let titleElem, mainButton, saveButton, legalNotice

    if (torrent) {
      if (name) {
        // No localization, just use the torrent name
        titleElem = <AboutPageSectionTitle>{name}</AboutPageSectionTitle>
      } else {
        // 'Loading torrent information...'
        titleElem = (
          <AboutPageSectionTitle data-l10n-id='torrentLoadingInfo' />
        )
      }
      mainButton = (
        <Button className='primaryButton mainButton'
          l10nId='stopDownload'
          testId='stopDownload'
          onClick={() => dispatch('stop')}
        />
      )
      legalNotice = (
        <BraveLink
          smaller mediumGray
          href='https://webtorrent.io'
          l10nId='poweredByWebTorrent'
        />
      )
    } else {
      const l10nStart = name ? 'startPrompt' : 'startPromptUntitled'
      const l10nArgs = {name}
      titleElem = (
        <AboutPageSectionTitle
          data-l10n-id={l10nStart}
          data-l10n-args={JSON.stringify(l10nArgs)}
        />
      )
      mainButton = (
        <Button className='primaryButton mainButton'
          l10nId='startDownload'
          testId='startDownload'
          onClick={() => dispatch('start')}
        />
      )
      legalNotice = <div className={css(styles.legalNotice)} data-l10n-id='legalNotice' />
    }

    if (torrentIdProtocol === 'magnet:') {
      saveButton = (
        <Button className='whiteButton copyMagnetLink'
          l10nId='copyMagnetLink'
          testId='copyMagnetLink'
          onClick={() => dispatch('copyMagnetLink')}
        />
      )
    } else {
      saveButton = (
        <Button className='whiteButton saveTorrentFile'
          l10nId='saveTorrentFile'
          testId='saveTorrentFile'
          onClick={() => dispatch('saveTorrentFile')}
        />
      )
    }

    return (
      <div className='siteDetailsPage'>
        <div className={css(styles.siteDetailsPage__header)}>
          {titleElem}

          <div className={css(styles.siteDetailsPage__header__actions)}>
            {mainButton}
            {saveButton}
          </div>
        </div>

        <div className={cx({
          siteDetailsPageContent: true,
          [css(commonStyles.siteDetailsPageContent)]: true
        })}>
          <TorrentStatus torrent={torrent} errorMessage={errorMessage} />
          <TorrentFileList
            torrentId={torrentId}
            torrent={torrent}
            serverUrl={serverUrl}
            stateOwner={this}
          />

          <div className={css(styles.siteDetailsPage__siteDetailsPageContent__legalNotice)}>{legalNotice}</div>
        </div>
      </div>
    )
  }
}

const styles = StyleSheet.create({
  siteDetailsPage__header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px' // See: .siteDetailsPageHeader
  },

  siteDetailsPage__header__actions: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: '24px' // See: .siteDetailsPageHeader
  },

  siteDetailsPage__siteDetailsPageContent__legalNotice: {
    marginTop: '15px',
    userSelect: 'none'
  },

  legalNotice: {
    color: globalStyles.color.mediumGray,
    fontSize: 'smaller'
  }
})

module.exports = TorrentViewer
