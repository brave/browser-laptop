/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const Button = require('../common/button')
const {BrowserButton} = require('../common/browserButton')
const DownloadItem = require('./downloadItem')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const webviewActions = require('../../../../js/actions/webviewActions')
const appActions = require('../../../../js/actions/appActions')

// Utils
const contextMenus = require('../../../../js/contextMenus')
const downloadUtil = require('../../../../js/state/downloadUtil')
const cx = require('../../../../js/lib/classSet')

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
    return <div className='downloadsBar'
      onContextMenu={contextMenus.onDownloadsToolbarContextMenu.bind(null, undefined, undefined)}>
      <div className='downloadItems'>
        {
          this.props.downloads.map(downloadId =>
            <DownloadItem downloadId={downloadId} />
          )
        }
      </div>
      <div className={cx({
        downloadBarButtons: true,
        [css(styles.downloadsBar__downloadBarButtons)]: true
      })}>
        <BrowserButton
          secondaryColor
          l10nId='downloadViewAll'
          testId='downloadViewAll'
          custom={styles.downloadsBar__downloadBarButtons__viewAllButton}
          onClick={this.onShowDownloads}
        />
        <Button
          className='downloadButton hideDownloadsToolbar'
          testId='hideDownloadsToolbar'
          onClick={this.onHideDownloadsToolbar}
        />
      </div>
    </div>
  }
}

module.exports = ReduxComponent.connect(DownloadsBar)

const styles = StyleSheet.create({
  downloadsBar__downloadBarButtons: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center'
  },

  downloadsBar__downloadBarButtons__viewAllButton: {
    marginRight: '20px'
  }
})
