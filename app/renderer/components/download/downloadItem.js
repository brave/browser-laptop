/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const Button = require('../common/button')

// Constants
const downloadStates = require('../../../../js/constants/downloadStates')
const {PAUSE, RESUME, CANCEL} = require('../../../common/constants/electronDownloadItemActions')

// Actions
const appActions = require('../../../../js/actions/appActions')

// Utils
const contextMenus = require('../../../../js/contextMenus')
const downloadUtil = require('../../../../js/state/downloadUtil')
const urlUtil = require('../../../../js/lib/urlutil')
const {getOrigin} = require('../../../../js/lib/urlutil')
const cx = require('../../../../js/lib/classSet')

class DownloadItem extends React.Component {
  constructor (props) {
    super(props)
    this.onRevealDownload = this.onRevealDownload.bind(this)
    this.onOpenDownload = this.onOpenDownload.bind(this)
    this.onPauseDownload = this.onDownloadActionPerformed.bind(this, PAUSE)
    this.onResumeDownload = this.onDownloadActionPerformed.bind(this, RESUME)
    this.onCancelDownload = this.onDownloadActionPerformed.bind(this, CANCEL)
    this.onClearDownload = this.onClearDownload.bind(this)
    this.onShowDeleteConfirmation = this.onShowDeleteConfirmation.bind(this)
    this.onHideDeleteConfirmation = this.onHideDeleteConfirmation.bind(this)
    this.onDeleteDownload = this.onDeleteDownload.bind(this)
    this.onReDownload = this.onReDownload.bind(this)
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

  onReDownload () {
    appActions.downloadRedownloaded(this.props.downloadId)
  }

  get isInterrupted () {
    return this.props.downloadState === downloadStates.INTERRUPTED
  }

  get isUnauthorized () {
    return this.props.downloadState === downloadStates.UNAUTHORIZED
  }

  get isInProgress () {
    return this.props.downloadState === downloadStates.IN_PROGRESS
  }

  get isCompleted () {
    return this.props.downloadState === downloadStates.COMPLETED
  }

  get isCancelled () {
    return this.props.downloadState === downloadStates.CANCELLED
  }

  get isPaused () {
    return this.props.downloadState === downloadStates.PAUSED
  }

  mergeProps (state, ownProps) {
    const download = state.getIn(['downloads', ownProps.downloadId]) || Immutable.Map()
    const origin = getOrigin(download.get('url'))

    const props = {}
    // used in renderer
    props.downloadId = ownProps.downloadId
    props.deleteConfirmationVisible = state.get('deleteConfirmationVisible')
    props.isLocalFile = urlUtil.isLocalFile(origin)
    props.isInsecure = origin && origin.startsWith('http://')
    props.percentageComplete = downloadUtil.getPercentageComplete(download)
    props.isPendingState = downloadUtil.isPendingState(download)
    props.downloadState = download.get('state')
    props.totalBytes = download.get('totalBytes')
    props.fileName = download.get('filename')
    props.origin = origin
    props.statel10n = downloadUtil.getL10nId(download)
    props.download = download // TODO (nejc) only primitive types
    props.allowPause = downloadUtil.shouldAllowPause(props.download)
    props.allowResume = downloadUtil.shouldAllowResume(props.download)
    props.allowCancel = downloadUtil.shouldAllowCancel(props.download)
    props.allowRedownload = downloadUtil.shouldAllowRedownload(props.download)
    props.allowCopyLink = downloadUtil.shouldAllowCopyLink(props.download)
    props.allowOpenDownloadLocation = downloadUtil.shouldAllowOpenDownloadLocation(props.download)
    props.allowDelete = downloadUtil.shouldAllowDelete(props.download)
    props.allowRemoveFromList = downloadUtil.shouldAllowRemoveFromList(props.download)

    return props
  }

  render () {
    const l10nStateArgs = {}
    const progressStyle = {
      width: this.props.percentageComplete
    }

    if (this.isCancelled || this.isInterrupted || this.isUnauthorized) {
      progressStyle.display = 'none'
    } else if (this.props.isPendingState) {
      l10nStateArgs.downloadPercent = this.props.percentageComplete
    }

    return <span
      onContextMenu={contextMenus.onDownloadsToolbarContextMenu.bind(null, this.props.downloadId, this.props.download)}
      onDoubleClick={this.onOpenDownload}
      onMouseLeave={this.onHideDeleteConfirmation}
      data-test-id='downloadItem'
      data-test2-id={this.isCompleted ? 'completed' : null}
      className={cx({
        downloadItem: true,
        deleteConfirmationVisible: this.props.deleteConfirmationVisible,
        [this.props.downloadState]: true
      })}>
      {
        this.props.deleteConfirmationVisible
        ? <div className='deleteConfirmation'>
          <span data-l10n-id='downloadDeleteConfirmation' /><Button testId='confirmDeleteButton' l10nId='ok' className='primaryButton confirmDeleteButton' onClick={this.onDeleteDownload} />
        </div>
        : null
      }
      <div className='downloadActions'>
        {
          this.props.allowPause
          ? <Button
            testId='pauseButton'
            className='pauseButton'
            l10nId='downloadPause'
            iconClass='fa-pause'
            onClick={this.onPauseDownload}
          />
          : null
        }
        {
          this.props.allowResume
          ? <Button
            testId='resumeButton'
            className='resumeButton'
            l10nId='downloadResume'
            iconClass='fa-play'
            onClick={this.onResumeDownload}
          />
          : null
        }
        {
          this.props.allowCancel
          ? <Button
            testId='cancelButton'
            className='cancelButton'
            l10nId='downloadCancel'
            iconClass='fa-times'
            onClick={this.onCancelDownload}
          />
          : null
        }
        {
          this.props.allowRedownload
          ? <Button
            testId='redownloadButton'
            className='redownloadButton'
            l10nId='downloadRedownload'
            iconClass='fa-repeat'
            onClick={this.onReDownload}
          />
          : null
        }
        {
          this.props.allowCopyLink
          ? <Button
            testId='copyLinkButton'
            className='copyLinkButton'
            l10nId='downloadCopyLinkLocation'
            iconClass='fa-link'
            onClick={this.onCopyLinkToClipboard}
          />
          : null
        }
        {
          this.props.allowOpenDownloadLocation
          ? <Button
            testId='revealButton'
            className='revealButton'
            l10nId='downloadOpenPath'
            iconClass='fa-folder-open-o'
            onClick={this.onRevealDownload}
          />
          : null
        }
        {
          this.props.allowDelete
          ? <Button
            testId='deleteButton'
            className='deleteButton'
            l10nId='downloadDelete'
            iconClass='fa-trash-o'
            onClick={this.onShowDeleteConfirmation}
          />
          : null
        }
        {
          this.props.allowRemoveFromList
          ? <Button
            testId='downloadRemoveFromList'
            l10nId='downloadRemoveFromList'
            iconClass='fa-times'
            className='removeDownloadFromList'
            onClick={this.onClearDownload}
          />
          : null
        }
      </div>
      {
        (this.isInProgress || this.isPaused) && this.props.totalBytes
        ? <div data-test-id='downloadProgress' className='downloadProgress' style={progressStyle} />
        : null
      }
      <div className='downloadInfo'>
        <span>
          <div data-test-id='downloadFilename' className='downloadFilename' title={this.props.fileName}>
            {this.props.fileName}
          </div>
          {
            this.props.origin
              ? <div data-test-id='downloadOrigin' className='downloadOrigin'>
                {
                  this.props.isInsecure
                    ? <span className='fa fa-unlock isInsecure' />
                    : null
                }
                <span data-l10n-id={this.props.isLocalFile ? 'downloadLocalFile' : null} title={this.props.origin}>
                  {this.props.isLocalFile ? null : this.props.origin}
                </span>
              </div>
              : null
          }
          {
            this.isCancelled || this.isInterrupted || this.isUnauthorized || this.isCompleted || this.isPaused || this.isInProgress
            ? <div className='downloadState' data-l10n-id={this.props.statel10n} data-l10n-args={JSON.stringify(l10nStateArgs)} />
            : null
          }
        </span>
        <span className='downloadArrow fa-caret-down fa' />
      </div>
    </span>
  }
}

module.exports = ReduxComponent.connect(DownloadItem)
