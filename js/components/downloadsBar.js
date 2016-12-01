/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Button = require('./button')
const contextMenus = require('../contextMenus')
const downloadStates = require('../constants/downloadStates')
const {PAUSE, RESUME, CANCEL} = require('../../app/common/constants/electronDownloadItemActions')
const appActions = require('../actions/appActions')
const windowActions = require('../actions/windowActions')
const downloadUtil = require('../state/downloadUtil')
const cx = require('../lib/classSet')

class DownloadItem extends ImmutableComponent {
  constructor () {
    super()
    this.onRevealDownload = this.onRevealDownload.bind(this)
    this.onOpenDownload = this.onOpenDownload.bind(this)
    this.onPauseDownload = this.onDownloadActionPerformed.bind(this, PAUSE)
    this.onResumeDownload = this.onDownloadActionPerformed.bind(this, RESUME)
    this.onCancelDownload = this.onDownloadActionPerformed.bind(this, CANCEL)
    this.onClearDownload = this.onClearDownload.bind(this)
    this.onDeleteDownload = this.onDeleteDownload.bind(this)
    this.onRedownload = this.onRedownload.bind(this)
    this.onCopyLinkToClipboard = this.onCopyLinkToClipboard.bind(this)
  }
  onRevealDownload () {
    appActions.downloadRevealed(this.props.downloadId)
  }
  onOpenDownload () {
    appActions.downloadOpened(this.props.downloadId)
  }
  onClearDownload () {
    appActions.downloadCleared(this.props.downloadId)
  }
  onDeleteDownload () {
    appActions.downloadDeleted(this.props.downloadId)
  }
  onDownloadActionPerformed (downloadAction) {
    appActions.downloadActionPerformed(this.props.downloadId, downloadAction)
  }
  onCopyLinkToClipboard () {
    appActions.downloadCopiedToClipboard(this.props.downloadId)
  }
  onRedownload () {
    appActions.downloadRedownloaded(this.props.downloadId)
  }
  get isInterrupted () {
    return this.props.download.get('state') === downloadStates.INTERRUPTED
  }
  get isInProgress () {
    return this.props.download.get('state') === downloadStates.IN_PROGRESS
  }
  get isCompleted () {
    return this.props.download.get('state') === downloadStates.COMPLETED
  }
  get isCancelled () {
    return this.props.download.get('state') === downloadStates.CANCELLED
  }
  get isPaused () {
    return this.props.download.get('state') === downloadStates.PAUSED
  }
  render () {
    const progressStyle = {
      width: downloadUtil.getPercentageComplete(this.props.download)
    }
    const l10nStateArgs = {}
    if (this.isCancelled || this.isInterrupted) {
      progressStyle.display = 'none'
    } else if (downloadUtil.isPendingState(this.props.download)) {
      l10nStateArgs.downloadPercent = downloadUtil.getPercentageComplete(this.props.download)
    }
    return <span
      onContextMenu={contextMenus.onDownloadsToolbarContextMenu.bind(null, this.props.downloadId, this.props.download)}
      onDoubleClick={this.onOpenDownload}
      className={cx({
        downloadItem: true,
        [this.props.download.get('state')]: true
      })}>
      <div className='downloadActions'>
        {
          downloadUtil.shouldAllowPause(this.props.download)
          ? <Button l10nId='downloadPause' iconClass='fa-pause' onClick={this.onPauseDownload} />
          : null
        }
        {
          downloadUtil.shouldAllowResume(this.props.download)
          ? <Button l10nId='downloadResume' iconClass='fa-play' onClick={this.onResumeDownload} />
          : null
        }
        {
          downloadUtil.shouldAllowCancel(this.props.download)
          ? <Button l10nId='downloadCancel' iconClass='fa-times' onClick={this.onCancelDownload} />
          : null
        }
        {
          downloadUtil.shouldAllowRedownload(this.props.download)
          ? <Button l10nId='downloadRedownload' iconClass='fa-repeat' onClick={this.onRedownload} />
          : null
        }
        {
          downloadUtil.shouldAllowCopyLink(this.props.download)
          ? <Button l10nId='downloadCopyLinkLocation' iconClass='fa-link' onClick={this.onCopyLinkToClipboard} />
          : null
        }
        {
          downloadUtil.shouldAllowOpenDownloadLocation(this.props.download)
          ? <Button l10nId='downloadOpenPath' iconClass='fa-folder-open-o' onClick={this.onRevealDownload} />
          : null
        }
        {
          downloadUtil.shouldAllowDelete(this.props.download)
          ? <Button l10nId='downloadDelete' iconClass='fa-trash-o' onClick={this.onDeleteDownload} />
          : null
        }
        {
          downloadUtil.shouldAllowRemoveFromList(this.props.download)
          ? <Button l10nId='downloadRemoveFromList' iconClass='fa-times' className='removeDownloadFromList' onClick={this.onClearDownload} />
          : null
        }
      </div>
      {
        (this.isInProgress || this.isPaused) && this.props.download.get('totalBytes')
        ? <div className='downloadProgress' style={progressStyle} />
        : null
      }
      <div className='downloadInfo'>
        <span>
          <div className='downloadFilename'
            title={this.props.download.get('filename')}>
            {
              this.props.download.get('filename')
            }
          </div>
          {
            this.isCancelled || this.isInterrupted || this.isCompleted || this.isPaused || this.isInProgress
            ? <div className='downloadState' data-l10n-id={downloadUtil.getL10nId(this.props.download)} data-l10n-args={JSON.stringify(l10nStateArgs)} />
            : null
          }
        </span>
        <span className='downloadArrow fa-caret-down fa' />
      </div>
    </span>
  }
}

class DownloadsBar extends ImmutableComponent {
  constructor () {
    super()
    this.onHideDownloadsToolbar = this.onHideDownloadsToolbar.bind(this)
  }
  onHideDownloadsToolbar () {
    windowActions.setDownloadsToolbarVisible(false)
  }
  render () {
    const downloadItemWidth = Number.parseInt(window.getComputedStyle(document.querySelector(':root')).getPropertyValue('--download-item-width'), 10)
    const downloadItemMargin = Number.parseInt(window.getComputedStyle(document.querySelector(':root')).getPropertyValue('--download-item-margin'), 10)
    const downloadBarPadding = Number.parseInt(window.getComputedStyle(document.querySelector(':root')).getPropertyValue('--download-bar-padding'), 10)
    const downloadBarButtons = Number.parseInt(window.getComputedStyle(document.querySelector(':root')).getPropertyValue('--download-bar-buttons'), 10)
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
                downloadId={downloadId}
                downloadsSize={this.props.downloads.size} />)
        }
      </div>
      <div className='downloadBarButtons'>
        <Button className='downloadButton'
          onClick={this.onHideDownloadsToolbar} />
      </div>
    </div>
  }
}

module.exports = DownloadsBar
