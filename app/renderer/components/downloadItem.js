/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const Button = require('../../../js/components/button')
const contextMenus = require('../../../js/contextMenus')
const downloadStates = require('../../../js/constants/downloadStates')
const {PAUSE, RESUME, CANCEL} = require('../../common/constants/electronDownloadItemActions')
const appActions = require('../../../js/actions/appActions')
const downloadUtil = require('../../../js/state/downloadUtil')
const {getOrigin} = require('../../../js/state/siteUtil')
const cx = require('../../../js/lib/classSet')

class DownloadItem extends ImmutableComponent {
  constructor () {
    super()
    this.onRevealDownload = this.onRevealDownload.bind(this)
    this.onOpenDownload = this.onOpenDownload.bind(this)
    this.onPauseDownload = this.onDownloadActionPerformed.bind(this, PAUSE)
    this.onResumeDownload = this.onDownloadActionPerformed.bind(this, RESUME)
    this.onCancelDownload = this.onDownloadActionPerformed.bind(this, CANCEL)
    this.onClearDownload = this.onClearDownload.bind(this)
    this.onShowDeleteConfirmation = this.onShowDeleteConfirmation.bind(this)
    this.onHideDeleteConfirmation = this.onHideDeleteConfirmation.bind(this)
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
  onShowDeleteConfirmation () {
    appActions.showDownloadDeleteConfirmation()
  }
  onHideDeleteConfirmation () {
    appActions.hideDownloadDeleteConfirmation()
  }
  onDeleteDownload () {
    appActions.hideDownloadDeleteConfirmation()
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
    const origin = getOrigin(this.props.download.get('url'))
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
      onMouseLeave={this.onHideDeleteConfirmation}
      className={cx({
        downloadItem: true,
        deleteConfirmationVisible: this.props.deleteConfirmationVisible,
        [this.props.download.get('state')]: true
      })}>
      {
        this.props.deleteConfirmationVisible
        ? <div className='deleteConfirmation'><span data-l10n-id='downloadDeleteConfirmation' /><Button l10nId='ok' className='primaryButton confirmDeleteButton' onClick={this.onDeleteDownload} /></div>
        : null
      }
      <div className='downloadActions'>
        {
          downloadUtil.shouldAllowPause(this.props.download)
          ? <Button className='pauseButton' l10nId='downloadPause' iconClass='fa-pause' onClick={this.onPauseDownload} />
          : null
        }
        {
          downloadUtil.shouldAllowResume(this.props.download)
          ? <Button className='resumeButton' l10nId='downloadResume' iconClass='fa-play' onClick={this.onResumeDownload} />
          : null
        }
        {
          downloadUtil.shouldAllowCancel(this.props.download)
          ? <Button className='cancelButton' l10nId='downloadCancel' iconClass='fa-times' onClick={this.onCancelDownload} />
          : null
        }
        {
          downloadUtil.shouldAllowRedownload(this.props.download)
          ? <Button className='redownloadButton' l10nId='downloadRedownload' iconClass='fa-repeat' onClick={this.onRedownload} />
          : null
        }
        {
          downloadUtil.shouldAllowCopyLink(this.props.download)
          ? <Button className='copyLinkButton' l10nId='downloadCopyLinkLocation' iconClass='fa-link' onClick={this.onCopyLinkToClipboard} />
          : null
        }
        {
          downloadUtil.shouldAllowOpenDownloadLocation(this.props.download)
          ? <Button className='revealButton' l10nId='downloadOpenPath' iconClass='fa-folder-open-o' onClick={this.onRevealDownload} />
          : null
        }
        {
          downloadUtil.shouldAllowDelete(this.props.download)
          ? <Button className='deleteButton' l10nId='downloadDelete' iconClass='fa-trash-o' onClick={this.onShowDeleteConfirmation} />
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
            origin
              ? <div className={cx({
                downloadOrigin: true,
                isSecure: origin.startsWith('https://'),
                isInsecure: origin.startsWith('http://')
              })} title={origin}>{origin}</div>
              : null
          }
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

module.exports = DownloadItem
