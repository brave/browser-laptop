/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

const globalStyles = require('../styles/global')
const {theme} = require('../styles/theme')

// Components
const ReduxComponent = require('../reduxComponent')
const BrowserButton = require('../common/browserButton')

// Constants
const downloadStates = require('../../../../js/constants/downloadStates')
const {PAUSE, RESUME, CANCEL} = require('../../../common/constants/electronDownloadItemActions')
const locale = require('../../../../js/l10n')

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

    return <section
      onContextMenu={contextMenus.onDownloadsToolbarContextMenu.bind(null, this.props.downloadId, this.props.download)}
      onDoubleClick={this.onOpenDownload}
      onMouseLeave={this.onHideDeleteConfirmation}
      data-test-id='downloadItem'
      data-test2-id={this.isCompleted ? 'downloadItemCompleted' : null}
      className={cx({
        downloadItem: true,
        deleteConfirmationVisible: this.props.deleteConfirmationVisible,
        [this.props.downloadState]: true,
        [css(styles.downloadItem, (this.isCompleted || this.isInterrupted || this.isCancelled) && styles.downloadItem_fillBackground)]: true
      })}>
      {
        this.props.deleteConfirmationVisible
        ? <div className={cx({
          deleteConfirmation: true,
          [css(styles.downloadItem__deleteConfirmation)]: true
        })}>
          <span data-l10n-id='downloadDeleteConfirmation' />
          <BrowserButton primaryColor smallItem
            testId='confirmDeleteButton'
            l10nId='ok'
            onClick={this.onDeleteDownload}
          />
        </div>
        : null
      }
      <div className={cx({
        downloadActions: true,
        [css(styles.downloadItem__actions)]: true
      })}>
        <div className={css(styles.downloadItem__actions__left)}>
          {
            this.props.allowPause
            ? <BrowserButton
              groupedItem
              iconOnly
              iconClass={globalStyles.appIcons.pause}
              size='15px'
              testId='pauseButton'
              l10nId='downloadPause'
              onClick={this.onPauseDownload}
            />
            : null
          }
          {
            this.props.allowResume
            ? <BrowserButton
              groupedItem
              iconOnly
              iconClass={globalStyles.appIcons.resume}
              size='15px'
              testId='resumeButton'
              l10nId='downloadResume'
              onClick={this.onResumeDownload}
            />
            : null
          }
          {
            this.props.allowCancel
            ? <BrowserButton
              groupedItem
              iconOnly
              iconClass={globalStyles.appIcons.remove}
              size='15px'
              testId='cancelButton'
              l10nId='downloadCancel'
              onClick={this.onCancelDownload}
            />
            : null
          }
          {
            this.props.allowRedownload
            ? <BrowserButton
              groupedItem
              iconOnly
              iconClass={globalStyles.appIcons.retry}
              size='15px'
              testId='redownloadButton'
              l10nId='downloadRedownload'
              onClick={this.onReDownload}
            />
            : null
          }
          {
            this.props.allowCopyLink
            ? <BrowserButton
              groupedItem
              iconOnly
              iconClass={globalStyles.appIcons.link}
              size='15px'
              testId='copyLinkButton'
              l10nId='downloadCopyLinkLocation'
              onClick={this.onCopyLinkToClipboard}
            />
            : null
          }
          {
            this.props.allowOpenDownloadLocation
            ? <BrowserButton
              groupedItem
              iconOnly
              iconClass={globalStyles.appIcons.openLocation}
              size='15px'
              testId='revealButton'
              l10nId='downloadOpenPath'
              onClick={this.onRevealDownload}
            />
            : null
          }
          {
            this.props.allowDelete
            ? <BrowserButton
              groupedItem
              iconOnly
              iconClass={globalStyles.appIcons.trashO}
              size='15px'
              testId='deleteButton'
              l10nId='downloadDelete'
              onClick={this.onShowDeleteConfirmation}
            />
            : null
          }
        </div>
        {
          this.props.allowRemoveFromList
          ? <BrowserButton
            groupedItem
            iconOnly
            iconClass={globalStyles.appIcons.remove}
            size='15px'
            testId='downloadRemoveFromList'
            l10nId='downloadRemoveFromList'
            onClick={this.onClearDownload}
          />
          : null
        }
      </div>
      {
        (this.isInProgress || this.isPaused) && this.props.totalBytes
        ? <div data-test-id='downloadProgress'
          className={cx({
            downloadProgress: true,
            [css(styles.downloadItem__progress, this.isPaused && styles.downloadItem__progress_isPaused)]: true
          })}
          style={progressStyle}
        />
        : null
      }
      <div className={cx({
        downloadInfo: true,
        [css(styles.downloadItem__info)]: true
      })}>
        <div className={css(styles.downloadItem__info__left)}>
          <div className={css(styles.downloadItem__info__left__column)}
            data-test-id='downloadFilename'
            title={this.props.fileName + '\n' + locale.translation(this.props.statel10n)}
          >
            {this.props.fileName}
          </div>
          {
            this.props.origin
              ? <div data-test-id='downloadOrigin'
                className={css(styles.downloadItem__info__left__column)}
              >
                {
                  this.props.isInsecure
                    ? <span className={cx({
                      [globalStyles.appIcons.unlock]: true,
                      [css(styles.downloadItem__info__left__column__unlock)]: true
                    })} />
                    : null
                }
                <span data-l10n-id={this.props.isLocalFile ? 'downloadLocalFile' : null}
                  title={this.props.origin + '\n' + locale.translation(this.props.statel10n)}
                >
                  {this.props.isLocalFile ? null : this.props.origin}
                </span>
              </div>
              : null
          }
          {
            this.isCancelled || this.isInterrupted || this.isCompleted || this.isPaused || this.isInProgress || this.isUnauthorized
            ? <div data-l10n-id={this.props.statel10n}
              data-l10n-args={JSON.stringify(l10nStateArgs)}
              className={css(
                styles.downloadItem__info__left__column,
                (this.isCancelled || this.isInterrupted || this.isCompleted || this.isUnauthorized) && styles.downloadItem__info__left__column_bold
              )}
            />
            : null
          }
        </div>
        <span className={cx({
          [globalStyles.appIcons.downArrow]: true,
          [css(styles.downloadItem__info__right_arrow)]: true,

          // Required by .downloadItem:hover .downloadInfo .downloadArrow
          downloadArrow: true
        })} />
      </div>
    </section>
  }
}

const styles = StyleSheet.create({
  downloadItem: {
    backgroundColor: theme.downloadsBar.item.backgroundColor,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: theme.downloadsBar.item.borderColor,
    borderRadius: globalStyles.radius.borderRadius,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    fontSize: '11px',
    height: '50px',
    padding: '0 14px',
    position: 'relative',
    margin: `auto ${globalStyles.downloadBar.spacing.item.margin} auto 0`,
    maxWidth: globalStyles.downloadBar.spacing.item.width,
    minWidth: globalStyles.downloadBar.spacing.item.width
  },

  downloadItem_fillBackground: {
    backgroundColor: theme.downloadsBar.item.backgroundColor_filled
  },

  downloadItem__deleteConfirmation: {
    boxSizing: 'border-box',
    fontSize: '12px',
    marginTop: globalStyles.downloadBar.spacing.item.info.margin,
    paddingBottom: globalStyles.downloadBar.spacing.item.info.margin,
    borderWidth: '0 0 1px 0',
    borderStyle: 'solid',
    borderColor: theme.downloadsBar.item.deleteConfirmation.borderColor,
    marginBottom: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  downloadItem__actions: {
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: globalStyles.downloadBar.spacing.item.info.margin
  },

  downloadItem__actions__left: {
    display: 'flex'
  },

  downloadItem__progress: {
    backgroundColor: theme.downloadsBar.item.progress.backgroundColor,
    transition: 'width 0.5s',
    left: 0,
    opacity: 0.5,
    position: 'absolute',
    width: '100%',
    height: '100%'
  },

  downloadItem__progress_isPaused: {
    borderWidth: '0 1px 0 0',
    borderStyle: 'solid',
    borderColor: theme.downloadsBar.item.progress.isPaused.borderColor,

    // #9320: Cancel the transition animation.
    transition: 'none'
  },

  downloadItem__info: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: globalStyles.downloadBar.spacing.item.info.margin,
    marginBottom: globalStyles.downloadBar.spacing.item.info.margin,
    height: globalStyles.downloadBar.spacing.item.height
  },

  downloadItem__info__left: {
    width: '150px',
    marginRight: '12px'
  },

  downloadItem__info__left__column: {
    margin: 'auto 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '150px'
  },

  downloadItem__info__left__column_bold: {
    fontWeight: 'bold'
  },

  downloadItem__info__left__column__unlock: {
    color: theme.downloadsBar.item.unlock.color,
    marginRight: '2px'
  },

  downloadItem__info__right_arrow: {
    width: '14px',
    margin: 'auto 0 auto auto'
  }
})

module.exports = ReduxComponent.connect(DownloadItem)
