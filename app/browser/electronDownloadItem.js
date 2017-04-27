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

module.exports.updateElectronDownloadItem = (downloadId, item, state) => {
  if (state === downloadStates.INTERRUPTED || state === downloadStates.CANCELLED || state === downloadStates.COMPLETED) {
    if (state === downloadStates.COMPLETED) {
      app.dock.downloadFinished(item.getSavePath())
    }
    delete downloadMap[downloadId]
  } else {
    downloadMap[downloadId] = item
  }
}

module.exports.cancelDownload = (downloadId) =>
  downloadMap[downloadId] && downloadMap[downloadId].cancel()

module.exports.pauseDownload = (downloadId) =>
  downloadMap[downloadId] && downloadMap[downloadId].pause()

module.exports.resumeDownload = (downloadId) =>
  downloadMap[downloadId] && downloadMap[downloadId].resume()
