/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const downloadStates = require('../../../js/constants/downloadStates')
const settings = require('../../../js/constants/settings')
const {clipboard, BrowserWindow, shell, dialog, app} = require('electron')
const fs = require('fs')
const path = require('path')
const {cancelDownload, pauseDownload, resumeDownload} = require('../electronDownloadItem')
const {CANCEL, PAUSE, RESUME} = require('../../common/constants/electronDownloadItemActions')
const appActions = require('../../../js/actions/appActions')

const downloadsReducer = (state, action) => {
  const download = action.downloadId ? state.getIn(['downloads', action.downloadId]) : undefined
  if (!download &&
      ![appConstants.APP_MERGE_DOWNLOAD_DETAIL,
        appConstants.APP_CLEAR_COMPLETED_DOWNLOADS,
        appConstants.APP_DOWNLOAD_DEFAULT_PATH].includes(action.actionType)) {
    return state
  }
  switch (action.actionType) {
    case appConstants.APP_DOWNLOAD_REVEALED:
      fs.exists(download.get('savePath'), (exists) => {
        if (exists) {
          shell.showItemInFolder(download.get('savePath'))
        } else {
          shell.openItem(path.dirname(download.get('savePath')))
        }
      })
      break
    case appConstants.APP_DOWNLOAD_OPENED:
      fs.exists(download.get('savePath'), (exists) => {
        if (exists) {
          shell.openItem(download.get('savePath'))
        } else {
          shell.beep()
        }
      })
      break
    case appConstants.APP_DOWNLOAD_ACTION_PERFORMED:
      switch (action.downloadAction) {
        case CANCEL:
          // It's important to update state before the cancel since it'll remove the reference
          state = state.setIn(['downloads', action.downloadId, 'state'], downloadStates.CANCELLED)
          cancelDownload(action.downloadId)
          break
        case PAUSE:
          pauseDownload(action.downloadId)
          state = state.setIn(['downloads', action.downloadId, 'state'], downloadStates.PAUSED)
          break
        case RESUME:
          resumeDownload(action.downloadId)
          state = state.setIn(['downloads', action.downloadId, 'state'], downloadStates.IN_PROGRESS)
          break
      }
      break
    case appConstants.APP_DOWNLOAD_COPIED_TO_CLIPBOARD:
      clipboard.writeText(download.get('url'))
      break
    case appConstants.APP_DOWNLOAD_DELETED:
      shell.moveItemToTrash(download.get('savePath'))
      state = state.deleteIn(['downloads', action.downloadId])
      break
    case appConstants.APP_DOWNLOAD_CLEARED:
      state = state.deleteIn(['downloads', action.downloadId])
      break
    case appConstants.APP_DOWNLOAD_REDOWNLOADED:
      const win = BrowserWindow.getFocusedWindow()
      if (win) {
        win.webContents.downloadURL(download.get('url'))
        state = state.deleteIn(['downloads', action.downloadId])
      } else {
        shell.beep()
      }
      break
    case appConstants.APP_MERGE_DOWNLOAD_DETAIL:
      if (action.downloadDetail) {
        state = state.mergeIn(['downloads', action.downloadId], action.downloadDetail)
      } else {
        state = state.deleteIn(['downloads', action.downloadId])
      }
      break
    case appConstants.APP_CLEAR_COMPLETED_DOWNLOADS:
      if (state.get('downloads')) {
        const downloads = state.get('downloads')
          .filter((download) =>
            ![downloadStates.COMPLETED, downloadStates.INTERRUPTED, downloadStates.CANCELLED].includes(download.get('state')))
        state = state.set('downloads', downloads)
      }
      break
    case appConstants.APP_DOWNLOAD_DEFAULT_PATH:
      const focusedWindow = BrowserWindow.getFocusedWindow()

      dialog.showOpenDialog(focusedWindow, {
        defaultPath: app.getPath('downloads'),
        properties: ['openDirectory']
      }, (folder) => {
        if (Array.isArray(folder) && fs.lstatSync(folder[0]).isDirectory()) {
          appActions.changeSetting(settings.DOWNLOAD_DEFAULT_PATH, folder[0])
        }
      })
      break
  }
  return state
}

module.exports = downloadsReducer
