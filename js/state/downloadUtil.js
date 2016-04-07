const downloadStates = require('../constants/downloadStates')

const pendingStates = [downloadStates.IN_PROGRESS, downloadStates.PAUSED]
const stopStates = [downloadStates.CANCELLED, downloadStates.INTERRUPTED, downloadStates.COMPLETED]
const notErrorStates = [downloadStates.IN_PROGRESS, downloadStates.PAUSED, downloadStates.COMPLETED]

const downloadIsInState = (download, list) =>
 list.includes(download.get('state'))

module.exports.isPendingState = (download) =>
 downloadIsInState(download, pendingStates)

module.exports.shouldAllowPause = (download) =>
  downloadIsInState(download, [downloadStates.IN_PROGRESS])

module.exports.shouldAllowResume = (download) =>
  downloadIsInState(download, [downloadStates.PAUSED])

module.exports.shouldAllowCancel = (download) =>
 downloadIsInState(download, pendingStates)

module.exports.shouldAllowRedownload = (download) =>
 downloadIsInState(download, stopStates)

module.exports.shouldAllowOpenDownloadLocation = (download) =>
 downloadIsInState(download, notErrorStates)

module.exports.shouldAllowDelete = (download) =>
 downloadIsInState(download, stopStates)

module.exports.shouldAllowRemoveFromList = (download) =>
 downloadIsInState(download, stopStates)

module.exports.getL10nId = (download) => {
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

module.exports.getPercentageComplete = (download) =>
  Math.ceil(download.get('receivedBytes') / download.get('totalBytes') * 100) + '%'

module.exports.shouldAllowCopyLink = (download) => !!download.get('url')
