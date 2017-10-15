/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const BrowserButton = require('../common/browserButton')
const DownloadItem = require('./downloadItem')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const webviewActions = require('../../../../js/actions/webviewActions')
const appActions = require('../../../../js/actions/appActions')

// Utils
const contextMenus = require('../../../../js/contextMenus')
const downloadUtil = require('../../../../js/state/downloadUtil')
const cx = require('../../../../js/lib/classSet')

const globalStyles = require('../styles/global')
const {theme} = require('../styles/theme')
const closeDownloadButton = require('../../../../img/toolbar/close_download_btn.svg')
const closeDownloadButtonHover = require('../../../../img/toolbar/close_download_btn_hover.svg')

class DownloadsBar extends React.Component {
  constructor (props) {
    super(props)
    this.onHideDownloadsToolbar = this.onHideDownloadsToolbar.bind(this)
    this.onShowDownloads = this.onShowDownloads.bind(this)
  }

  onHideDownloadsToolbar () {
    windowActions.setDownloadsToolbarVisible(false)
    webviewActions.setWebviewFocused()
  }

  onShowDownloads () {
    appActions.createTabRequested({
      url: 'about:downloads'
    })
    windowActions.setDownloadsToolbarVisible(false)
  }

  mergeProps (state, ownProps) {
    const props = {}
    // used in renderer
    props.downloads = downloadUtil.getDownloadItems(state) || Immutable.List()

    return props
  }

  render () {
    return <div className={cx({
      [css(styles.downloadsBar)]: true,

      // Required for isFullScreen on window.less
      // TODO: css(isFullScreen && styles.downloadsBar_isFullScreen)
      downloadsBar: true
    })}
      data-test-id='downloadsBar'
    >
      <div className={css(styles.downloadsBar__items)}>
        {
          this.props.downloads.map(downloadId =>
            <DownloadItem downloadId={downloadId} />
          )
        }
      </div>
      <div className={css(styles.downloadsBar__buttons)}>
        <BrowserButton secondaryColor
          custom={styles.downloadsBar__buttons__viewAll}
          l10nId='downloadViewAll'
          testId='downloadViewAll'
          onClick={this.onShowDownloads}
        />
        <BrowserButton
          iconOnly
          size='14px'
          custom={styles.downloadsBar__buttons__hide}
          testId='hideDownloadsToolbar'
          onClick={this.onHideDownloadsToolbar}
        />
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  downloadsBar: {
    boxSizing: 'border-box',
    cursor: 'default',
    backgroundColor: theme.downloadsBar.backgroundColor,
    borderWidth: '1px 0 0 0',
    borderStyle: 'solid',
    borderColor: theme.downloadsBar.borderTopColor,
    color: theme.downloadsBar.color,
    display: 'flex',
    height: globalStyles.downloadBar.spacing.height,
    padding: `5px ${globalStyles.downloadBar.spacing.padding}`,
    width: '100%',
    zIndex: globalStyles.zindex.zindexDownloadsBar,
    userSelect: 'none'
  },

  downloadsBar__items: {
    display: 'flex',
    flexGrow: 1,
    position: 'relative'
  },

  downloadsBar__buttons: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center'
  },

  downloadsBar__buttons__viewAll: {
    marginRight: '20px'
  },

  downloadsBar__buttons__hide: {
    background: `url(${closeDownloadButton}) center no-repeat !important`,

    ':hover': {
      background: `url(${closeDownloadButtonHover}) center no-repeat !important`
    }
  }
})

module.exports = ReduxComponent.connect(DownloadsBar)
