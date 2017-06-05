/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ImmutableComponent = require('../immutableComponent')
const Button = require('../common/button')
const BrowserButton = require('../common/browserButton')
const DownloadItem = require('./downloadItem')

const {StyleSheet, css} = require('aphrodite/no-important')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const webviewActions = require('../../../../js/actions/webviewActions')
const appActions = require('../../../../js/actions/appActions')

// Utils
const contextMenus = require('../../../../js/contextMenus')

const cx = require('../../../../js/lib/classSet')

class DownloadsBar extends ImmutableComponent {
  constructor () {
    super()
    this.onHideDownloadsToolbar = this.onHideDownloadsToolbar.bind(this)
    this.onShowDownloads = this.onShowDownloads.bind(this)
  }
  onHideDownloadsToolbar () {
    windowActions.setDownloadsToolbarVisible(false)
    webviewActions.setWebviewFocused()
  }
  onShowDownloads () {
    appActions.createTabRequested({
      activateIfOpen: true,
      url: 'about:downloads'
    })
    windowActions.setDownloadsToolbarVisible(false)
  }
  render () {
    const getComputedStyle = require('../../getComputedStyle')
    const downloadItemWidth = Number.parseInt(getComputedStyle('--download-item-width'), 10)
    const downloadItemMargin = Number.parseInt(getComputedStyle('--download-item-margin'), 10)
    const downloadBarPadding = Number.parseInt(getComputedStyle('--download-bar-padding'), 10)
    const downloadBarButtons = Number.parseInt(getComputedStyle('--download-bar-buttons'), 10)
    const numItems = Math.floor((this.props.windowWidth - (downloadBarPadding * 2) - downloadBarButtons) / (downloadItemWidth + downloadItemMargin))
    return <div className='downloadsBar'
      onContextMenu={contextMenus.onDownloadsToolbarContextMenu.bind(null, undefined, undefined)}>
      <div className='downloadItems'>
        {
          this.props.downloads
            .sort((x, y) => x.get('startTime') - y.get('startTime'))
            .skip(this.props.downloads.size - numItems)
            .reverse()
            .map((download, downloadId) =>
              <DownloadItem download={download}
                windowWidth={this.props.windowWidth}
                deleteConfirmationVisible={this.props.deleteConfirmationVisible}
                downloadId={downloadId}
                downloadsSize={this.props.downloads.size} />)
        }
      </div>
      <div className={cx({
        downloadBarButtons: true,
        [css(styles.downloadsBar__downloadBarButtons)]: true
      })}>
        <BrowserButton secondaryColor
          l10nId='downloadViewAll'
          testId='downloadViewAll'
          custom={styles.downloadsBar__downloadBarButtons__viewAllButton}
          onClick={this.onShowDownloads}
        />
        <Button className='downloadButton hideDownloadsToolbar'
          testId='hideDownloadsToolbar'
          onClick={this.onHideDownloadsToolbar}
        />
      </div>
    </div>
  }
}

module.exports = DownloadsBar

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
