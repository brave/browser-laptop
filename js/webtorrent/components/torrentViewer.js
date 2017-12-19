const React = require('react')
const cx = require('../../lib/classSet')

const {StyleSheet, css} = require('aphrodite/no-important')
const commonStyles = require('../../../app/renderer/components/styles/commonStyles')

// Components
const BrowserButton = require('../../../app/renderer/components/common/browserButton')
const TorrentFileList = require('./torrentFileList')
const TorrentStatus = require('./torrentStatus')

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
        <BrowserButton primaryColor
          l10nId='stopDownload'
          testId='stopDownload'
          onClick={() => dispatch('stop')}
        />
      )
      legalNotice = (
        <a className={cx({
          legalNotice: true,
          [css(commonStyles.userSelectNone)]: true
        })}
          data-l10n-id='poweredByWebTorrent'
          href='https://webtorrent.io'
          rel='noopener' target='_blank'
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
        <BrowserButton groupedItem primaryColor
          l10nId='startDownload'
          testId='startDownload'
          onClick={() => dispatch('start')}
        />
      )
      legalNotice = <div className={cx({
        legalNotice: true,
        [css(commonStyles.userSelectNone)]: true
      })} data-l10n-id='legalNotice' />
    }

    if (torrentIdProtocol === 'magnet:') {
      saveButton = (
        <BrowserButton groupedItem secondaryColor
          l10nId='copyMagnetLink'
          testId='copyMagnetLink'
          onClick={() => dispatch('copyMagnetLink')}
        />
      )
    } else {
      saveButton = (
        <BrowserButton groupedItem secondaryColor
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

          {legalNotice}
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

    // See: .siteDetailsPageHeader
    padding: '0 24px'
  },

  siteDetailsPage__header__actions: {
    display: 'flex',
    alignItems: 'center',

    // See: .siteDetailsPageHeader
    marginLeft: '24px'
  }
})

module.exports = TorrentViewer
