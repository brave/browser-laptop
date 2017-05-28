/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Button = require('../../../js/components/button')
const contextMenus = require('../../../js/contextMenus')
const windowActions = require('../../../js/actions/windowActions')
const webviewActions = require('../../../js/actions/webviewActions')
const DownloadItem = require('./downloadItem')
const appActions = require('../../../js/actions/appActions')
const Immutable = require('immutable')
const CommonMenu = require('../../common/commonMenu')
const messages = require('../../../js/constants/messages')

class DownloadsBar extends ImmutableComponent {
  constructor () {
    super()
    this.onHideDownloadsToolbar = this.onHideDownloadsToolbar.bind(this)
  }
  onHideDownloadsToolbar () {
    windowActions.setDownloadsToolbarVisible(false)
    webviewActions.setWebviewFocused()
  }
  showAllDownloadsPage() {
    CommonMenu.sendToFocusedWindow(require('../currentWindow'), [messages.HIDE_DOWNLOADS_TOOLBAR])
    appActions.maybeCreateTabRequested({
      url: 'about:downloads',
      windowId: CommonMenu.getCurrentWindowId()
    })
  }
  render () {
    const getComputedStyle = require('../getComputedStyle')
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

      <div className='downloadBarButtons'>
        <Button className='whiteButton' label="Show All" onClick={this.showAllDownloadsPage}/>
        <Button className='downloadButton hideDownloadsToolbar'
          onClick={this.onHideDownloadsToolbar} />
      </div>
    </div>
  }
}

module.exports = DownloadsBar
