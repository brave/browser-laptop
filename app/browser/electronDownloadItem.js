/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const downloadStates = require('../../js/constants/downloadStates')
const electron = require('electron')
const app = electron.app

/**
 * Maps downloadId to an electron download-item
 */
const downloadMap = {}
/**
 * Monitor progress of active downloads
 */
let completedBytes = 0
const activeDownloadItems = () => Object.keys(downloadMap).length
const progressDownloadItems = () => {
  const receivedBytes = Object.keys(downloadMap).reduce((receivedBytes, downloadId) => {
    if (typeof downloadMap[downloadId].getReceivedBytes === 'function') {
      receivedBytes += downloadMap[downloadId].getReceivedBytes()
    }
    return receivedBytes
  }, completedBytes)
  const totalBytes = Object.keys(downloadMap).reduce((totalBytes, downloadId) => {
    if (typeof downloadMap[downloadId].getTotalBytes === 'function') {
      totalBytes += downloadMap[downloadId].getTotalBytes()
    }
    return totalBytes
  }, completedBytes)
  return receivedBytes / totalBytes
}

module.exports.updateElectronDownloadItem = (win, downloadId, item, state) => {
  if (state === downloadStates.INTERRUPTED || state === downloadStates.CANCELLED || state === downloadStates.UNAUTHORIZED || state === downloadStates.COMPLETED) {
    if (app.dock && state === downloadStates.COMPLETED) {
      app.dock.downloadFinished(item.getSavePath())
    }

    if (downloadMap[downloadId] != null) {
      completedBytes += downloadMap[downloadId].getTotalBytes()
    }
    delete downloadMap[downloadId]
  } else {
    downloadMap[downloadId] = item
  }
  if (['darwin', 'linux'].includes(process.platform)) {
    app.setBadgeCount(activeDownloadItems())
  }
  if (win && typeof win.isDestroyed === 'function' && !win.isDestroyed()) {
    if (activeDownloadItems()) {
      win.setProgressBar(progressDownloadItems())
    } else {
      win.setProgressBar(-1)
      completedBytes = 0
    }
  }
}

module.exports.cancelDownload = (downloadId) =>
  downloadMap[downloadId] && downloadMap[downloadId].cancel()

module.exports.pauseDownload = (downloadId) =>
  downloadMap[downloadId] && downloadMap[downloadId].pause()

module.exports.resumeDownload = (downloadId) =>
  downloadMap[downloadId] && downloadMap[downloadId].resume()
