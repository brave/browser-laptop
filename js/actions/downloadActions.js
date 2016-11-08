/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')

let shell, ipc, clipboard, getCurrentWebContents
if (process.type === 'browser') {
  shell = electron.shell
  ipc = electron.ipcRenderer
  clipboard = electron.clipboard
  getCurrentWebContents = electron.getCurrentWebContents
} else {
  shell = electron.remote.shell
  ipc = electron.ipcRenderer
  clipboard = electron.remote.clipboard
  getCurrentWebContents = electron.remote.getCurrentWebContents
}

const appDownloadActions = require('../constants/downloadActions')
const appActions = require('../actions/appActions')
const messages = require('../constants/messages')
// const fs = require('fs')
// const path = require('path')

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
    // disabling notificiations from the main window until we have a
    // better way to do it
    // void new window.Notification(locale.translation('urlCopied'))
  },
  openDownloadPath: function (download) {
    // fs.exists(download.get('savePath'), (exists) => {
    //   if (exists) {
    //     shell.openItem(download.get('savePath'))
    //   } else {
    //     shell.beep()
    //   }
    // })
  },
  locateShellPath: function (download) {
    // fs.exists(download.get('savePath'), (exists) => {
    //   if (exists) {
    //     shell.showItemInFolder(download.get('savePath'))
    //   } else {
    //     shell.openItem(path.dirname(download.get('savePath')))
    //   }
    // })
  },
  hideDownloadsToolbar: function () {
    if (process.type === 'renderer') {
      const windowActions = require('../actions/windowActions')
      windowActions.setDownloadsToolbarVisible(false)
    }
  },
  deleteDownload: function (downloads, download, downloadId) {
    shell.moveItemToTrash(download.get('savePath'))
    downloadActions.clearDownload(downloads, downloadId)
  },
  clearDownload: function (downloads, downloadId) {
    if (downloads && downloads.size === 1) {
      downloadActions.hideDownloadsToolbar()
    }
    appActions.mergeDownloadDetail(downloadId)
  },
  redownloadURL: function (download, downloadId) {
    getCurrentWebContents().downloadURL(download.get('url'))
    downloadActions.clearDownload(undefined, downloadId)
  }
}

module.exports = downloadActions
