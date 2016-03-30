/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')
const shell = electron.shell
const ipc = electron.ipcRenderer
const remote = electron.remote
const clipboard = electron.clipboard
const appDownloadActions = require('../constants/downloadActions')
const appActions = require('../actions/appActions')
const windowActions = require('../actions/windowActions')
const messages = require('../constants/messages')
const fs = require('fs')

/**
  * Creates an action function for the specified app download action
  * @param {string} appDownloadAction - The ID of the app action to send
  */
const appActionForDownload = (appDownloadAction) => (downloadId) =>
  ipc.send(messages.DOWNLOAD_ACTION, downloadId, appDownloadAction)

const downloadActions = {
  cancelDownload: appActionForDownload(appDownloadActions.CANCEL),
  pauseDownload: appActionForDownload(appDownloadActions.PAUSE),
  resumeDownload: appActionForDownload(appDownloadActions.RESUME),
  copyLinkToClipboard: function (download) {
    clipboard.writeText(download.get('url'))
  },
  openDownloadPath: function (download) {
    shell.openItem(download.get('savePath'))
  },
  locateShellPath: function (download) {
    shell.showItemInFolder(download.get('savePath'))
  },
  hideDownloadsToolbar: function () {
    windowActions.setDownloadsToolbarVisible(false)
  },
  deleteDownload: function (downloads, download, downloadId) {
    fs.exists(download.get('savePath'), (exists) => {
      if (exists) {
        shell.moveItemToTrash(download.get('savePath'))
      }
    })
    downloadActions.clearDownload(downloads, downloadId)
  },
  clearDownload: function (downloads, downloadId) {
    if (downloads && downloads.size === 1) {
      downloadActions.hideDownloadsToolbar()
    }
    appActions.mergeDownloadDetail(downloadId)
  },
  redownloadURL: function (download, downloadId) {
    remote.getCurrentWebContents().downloadURL(download.get('url'))
    downloadActions.clearDownload(undefined, downloadId)
  }
}

module.exports = downloadActions
