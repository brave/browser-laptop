/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
const Immutable = require('immutable')
const downloadStates = require('../constants/downloadStates')
const domUtil = require('../../app/renderer/lib/domUtil')

const pendingStates = [downloadStates.IN_PROGRESS, downloadStates.PAUSED]
const stopStates = [downloadStates.CANCELLED, downloadStates.INTERRUPTED, downloadStates.COMPLETED]
const notErrorStates = [downloadStates.IN_PROGRESS, downloadStates.PAUSED, downloadStates.COMPLETED]

const downloadIsInState = (download, list) =>
 list.includes(download.get('state'))

const isPendingState = (download) =>
 downloadIsInState(download, pendingStates)

const shouldAllowPause = (download) =>
  downloadIsInState(download, [downloadStates.IN_PROGRESS])

const shouldAllowResume = (download) =>
  downloadIsInState(download, [downloadStates.PAUSED])

const shouldAllowCancel = (download) =>
 downloadIsInState(download, pendingStates)

const shouldAllowRedownload = (download) =>
 downloadIsInState(download, stopStates)

const shouldAllowOpenDownloadLocation = (download) =>
 downloadIsInState(download, notErrorStates)

const shouldAllowDelete = (download) =>
 downloadIsInState(download, stopStates)

const shouldAllowRemoveFromList = (download) =>
 downloadIsInState(download, stopStates)

const getL10nId = (download) => {
  switch (download.get('state')) {
    case downloadStates.INTERRUPTED:
      return 'downloadInterrupted'
    case downloadStates.CANCELLED:
      return 'downloadCancelled'
    case downloadStates.IN_PROGRESS:
      if (!download.get('totalBytes')) {
        return 'downloadInProgressUnknownTotal'
      } else {
        return 'downloadInProgress'
      }
    case downloadStates.COMPLETED:
      return 'downloadCompleted'
    case downloadStates.PAUSED:
      return 'downloadPaused'
  }
  return ''
}

const getPercentageComplete = (download) => {
  const totalBytes = download.get('totalBytes')
  if (!totalBytes) {
    // Most likely totalBytes has not been calculated yet. Avoid
    // division by 0.
    return '0%'
  }
  return Math.ceil(download.get('receivedBytes') / totalBytes * 100) + '%'
}

const shouldAllowCopyLink = (download) => !!download.get('url')

const getDownloadItems = (state) => {
  if (!state.get('downloads')) {
    return Immutable.List()
  }

  const downloadsSize = state.get('downloads').size
  const downloadItemWidth = domUtil.getStyleConstants('download-item-width')
  const downloadItemMargin = domUtil.getStyleConstants('download-item-margin')
  const downloadBarPadding = domUtil.getStyleConstants('download-bar-padding')
  const downloadBarButtons = domUtil.getStyleConstants('download-bar-buttons')
  const numItems = Math.floor(
    (window.innerWidth - (downloadBarPadding * 2) - downloadBarButtons) /
    (downloadItemWidth + downloadItemMargin)
  )

  return state.get('downloads')
    .sort((x, y) => x.get('startTime') - y.get('startTime'))
    .skip(downloadsSize - numItems)
    .reverse()
    .map((download, downloadId) => downloadId)
}

module.exports = {
  isPendingState,
  shouldAllowPause,
  shouldAllowResume,
  shouldAllowCancel,
  shouldAllowRedownload,
  shouldAllowOpenDownloadLocation,
  shouldAllowDelete,
  shouldAllowRemoveFromList,
  getL10nId,
  getPercentageComplete,
  shouldAllowCopyLink,
  getDownloadItems
}
