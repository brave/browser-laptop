/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Button = require('./button')
const electron = require('electron')
const shell = electron.shell
const remote = electron.remote
const clipboard = electron.clipboard
const ipc = electron.ipcRenderer
const contextMenus = require('../contextMenus')
const messages = require('../constants/messages')
const downloadStates = require('../constants/downloadStates')
const downloadActions = require('../constants/downloadActions')
const appActions = require('../actions/appActions')
const windowActions = require('../actions/windowActions')
const cx = require('../lib/classSet')
const fs = require('fs')

class DownloadItem extends ImmutableComponent {
  constructor () {
    super()
    this.clearDownload = this.clearDownload.bind(this)
    this.deleteDownload = this.deleteDownload.bind(this)
    this.redownloadURL = this.redownloadURL.bind(this)
    this.openDownloadPath = this.openDownloadPath.bind(this)
    this.locateShellPath = this.locateShellPath.bind(this)
    this.copyLinkToClipboard = this.copyLinkToClipboard.bind(this)
    this.cancelDownload = this.cancelDownload.bind(this)
    this.pauseDownload = this.pauseDownload.bind(this)
    this.resumeDownload = this.resumeDownload.bind(this)
    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
  }
  clearDownload (e) {
    if (e) {
      e.stopPropagation()
    }
    if (this.props.downloadsSize === 1) {
      this.props.onHideDownloads()
    }
    appActions.mergeDownloadDetail(this.props.downloadId)
  }
  deleteDownload () {
    this.clearDownload()
    fs.exists(this.savePath, (exists) => {
      if (exists) {
        shell.moveItemToTrash(this.props.download.get('savePath'))
      }
    })
  }
  redownloadURL () {
    remote.getCurrentWebContents().downloadURL(this.props.download.get('url'))
    this.clearDownload()
  }
  copyLinkToClipboard () {
    clipboard.writeText(this.props.download.get('url'))
  }
  openDownloadPath () {
    shell.openItem(this.props.download.get('savePath'))
  }
  locateShellPath () {
    shell.showItemInFolder(this.props.download.get('savePath'))
  }
  cancelDownload () {
    ipc.send(messages.DOWNLOAD_ACTION, this.props.downloadId, downloadActions.CANCEL)
  }
  pauseDownload () {
    ipc.send(messages.DOWNLOAD_ACTION, this.props.downloadId, downloadActions.PAUSE)
  }
  resumeDownload () {
    ipc.send(messages.DOWNLOAD_ACTION, this.props.downloadId, downloadActions.RESUME)
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
  get isExpanded () {
    return this.props.download.get('isExpanded')
  }
  get savePath () {
    return this.props.download.get('savePath')
  }
  onMouseEnter () {
    appActions.mergeDownloadDetail(this.props.downloadId, { isExpanded: true })
  }
  onMouseLeave () {
    appActions.mergeDownloadDetail(this.props.downloadId, { isExpanded: false })
  }
  get stateL10nId () {
    switch (this.props.download.get('state')) {
      case downloadStates.INTERRUPTED:
        return 'downloadInterrupted'
      case downloadStates.CANCELLED:
        return 'downloadCancelled'
      case downloadStates.IN_PROGRESS:
        return 'downloadInProgress'
      case downloadStates.COMPLETED:
        return 'downloadCompleted'
      case downloadStates.PAUSED:
        return 'downloadPaused'
    }
    return undefined
  }
  render () {
    const percentComplete = Math.ceil(this.props.download.get('receivedBytes') / this.props.download.get('totalBytes') * 100) + '%'
    const progressStyle = {
      width: percentComplete
    }
    const l10nStateArgs = {}
    if (this.isCancelled || this.isInterrupted) {
      progressStyle.display = 'none'
    } else if (this.isInProgress || this.isPaused) {
      l10nStateArgs.downloadPercent = percentComplete
    }
    return <span
      onDoubleClick={this.openDownloadPath}
      onMouseEnter={this.onMouseEnter}
      onMouseLeave={this.onMouseLeave}
      className={cx({
        downloadItem: true,
        [this.props.download.get('state')]: true
      })}>
      <div className='downloadActions'>
        {
          this.isInProgress
          ? <Button l10nId='downloadPause' iconClass='fa-pause' onClick={this.pauseDownload}/>
          : null
        }
        {
          this.isPaused
          ? <Button l10nId='downloadResume' iconClass='fa-play' onClick={this.resumeDownload}/>
          : null
        }
        {
          this.isInProgress || this.isPaused
          ? <Button l10nId='downloadCancel' iconClass='fa-times' onClick={this.cancelDownload}/>
          : null
        }
        {
          this.isCancelled || this.isInterrupted || this.isCompleted
          ? <Button l10nId='downloadRedownload' iconClass='fa-repeat' onClick={this.redownloadURL}/>
          : null
        }
        {
          this.isCancelled || this.isInterrupted || this.isInProgress || this.isPaused || this.isCompleted
          ? <Button l10nId='downloadCopyLinkLocation' iconClass='fa-link' onClick={this.copyLinkToClipboard}/>
          : null
        }
        {
          this.isInProgress || this.isCompleted || this.isPaused
          ? <Button l10nId='downloadOpenPath' iconClass='fa-folder-open-o' onClick={this.locateShellPath}/>
          : null
        }
        {
          this.isCancelled || this.isInterrupted || this.isCompleted
          ? <Button l10nId='downloadDelete' iconClass='fa-trash-o' onClick={this.deleteDownload}/>
          : null
        }
        {
          this.isInterrupted || this.isCompleted || this.isCancelled
          ? <Button l10nId='downloadRemoveFromList' iconClass='fa-times' className='removeDownloadFromList' onClick={this.clearDownload} />
          : null
        }

      </div>
      {
        this.isInProgress || this.isPaused
        ? <div className='downloadProgress' style={progressStyle}/>
        : null
      }
      <div className='downloadInfo'>
        <span>
          <div className='downloadFilename'>
            {
              this.props.download.get('filename')
            }
          </div>
        {
          this.isCancelled || this.isInterrupted || this.isCompleted || this.isPaused || this.isInProgress
          ? <div className='downloadState' data-l10n-id={this.stateL10nId} data-l10n-args={JSON.stringify(l10nStateArgs)}/>
          : null
        }
        </span>
        <span className={cx({
          downloadArrow: true,
          fa: true,
          'fa-caret-down': !this.isExpanded
        })}/>
      </div>
    </span>
  }
}

class DownloadsBar extends ImmutableComponent {
  constructor () {
    super()
    this.onHideDownloads = this.onHideDownloads.bind(this)
  }
  onHideDownloads () {
    windowActions.setDownloadsToolbarVisible(false)
  }
  render () {
    const downloadItemWidth = Number.parseInt(window.getComputedStyle(document.querySelector(':root')).getPropertyValue('--download-item-width'))
    const downloadItemMargin = Number.parseInt(window.getComputedStyle(document.querySelector(':root')).getPropertyValue('--download-item-margin'))
    const downloadBarPadding = Number.parseInt(window.getComputedStyle(document.querySelector(':root')).getPropertyValue('--download-bar-padding'))
    const numItems = Math.floor((this.props.windowWidth - downloadBarPadding * 2) / (downloadItemWidth + downloadItemMargin))
    return <div className='downloadsBar'
      onContextMenu={contextMenus.onDownloadsToolbarContextMenu}>
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
              downloadsSize={this.props.downloads.size}
              onHideDownloads={this.onHideDownloads}/>)
      }
      </div>
      <div className='downloadBarButtons'>
        <Button iconClass='fa-times'
          className='downloadButton smallButton hideButton'
          onClick={this.onHideDownloads} />
      </div>
    </div>
  }
}

module.exports = DownloadsBar
