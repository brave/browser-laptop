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
const userPrefs = require('../../../js/state/userPrefs')
const getSetting = require('../../../js/settings').getSetting

const downloadsReducer = (state, action) => {
  const download = action.downloadId ? state.getIn(['downloads', action.downloadId]) : undefined
  if (!download &&
      ![appConstants.APP_MERGE_DOWNLOAD_DETAIL,
        appConstants.APP_CLEAR_COMPLETED_DOWNLOADS,
        appConstants.APP_SELECT_DEFAULT_DOWNLOAD_PATH,
        appConstants.APP_CHANGE_SETTING,
        appConstants.APP_SET_STATE].includes(action.actionType)) {
    return state
  }
  switch (action.actionType) {
    case appConstants.APP_SET_STATE:
      if (getSetting(settings.DOWNLOAD_DEFAULT_PATH) === '') {
        const defaultPath = app.getPath('downloads')
        appActions.changeSetting(settings.DOWNLOAD_DEFAULT_PATH, defaultPath)
      }
      break
    case appConstants.APP_DOWNLOAD_REVEALED:
      fs.access(download.get('savePath'), fs.constants.F_OK, (err) => {
        if (err) {
          shell.openItem(path.dirname(download.get('savePath')))
        } else {
          shell.showItemInFolder(download.get('savePath'))
        }
      })
      break
    case appConstants.APP_DOWNLOAD_OPENED:
      fs.access(download.get('savePath'), fs.constants.F_OK, (err) => {
        if (err) {
          shell.beep()
        } else {
          shell.openItem(download.get('savePath'))
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
          break
        case RESUME:
          resumeDownload(action.downloadId)
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
        win.webContents.downloadURL(download.get('url'), true)
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
            ![downloadStates.COMPLETED, downloadStates.INTERRUPTED, downloadStates.UNAUTHORIZED, downloadStates.CANCELLED].includes(download.get('state')))
        state = state.set('downloads', downloads)
      }
      break
    case appConstants.APP_SELECT_DEFAULT_DOWNLOAD_PATH:
      const focusedWindow = BrowserWindow.getFocusedWindow()

      dialog.showDialog(focusedWindow, {
        defaultPath: app.getPath('downloads'),
        type: 'select-folder'
      }, (paths) => {
        if (Array.isArray(paths) && fs.lstatSync(paths[0]).isDirectory()) {
          appActions.changeSetting(settings.DOWNLOAD_DEFAULT_PATH, paths[0])
        }
      })
      break
    case appConstants.APP_CHANGE_SETTING:
      if (action.key === settings.DOWNLOAD_DEFAULT_PATH) {
        userPrefs.setUserPref('download.default_directory', action.value)
      }
      break
  }
  return state
}

module.exports = downloadsReducer
