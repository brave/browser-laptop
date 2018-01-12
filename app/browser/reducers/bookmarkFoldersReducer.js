/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// State
const bookmarksState = require('../../common/state/bookmarksState')
const bookmarkFoldersState = require('../../common/state/bookmarkFoldersState')
const bookmarkToolbarState = require('../../common/state/bookmarkToolbarState')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const siteTags = require('../../../js/constants/siteTags')
const {STATE_SITES} = require('../../../js/constants/stateConstants')

// Utils
const {makeImmutable} = require('../../common/state/immutableUtil')
const syncUtil = require('../../../js/state/syncUtil')
const textCalc = require('../../browser/api/textCalc')
const bookmarkFolderUtil = require('../../common/lib/bookmarkFoldersUtil')

const bookmarkFoldersReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_ADD_BOOKMARK_FOLDER:
      {
        const closestKey = action.get('closestKey')
        const folder = action.get('folderDetails')

        if (folder == null) {
          break
        }

        if (Immutable.List.isList(folder)) {
          let folderList = Immutable.List()
          action.get('folderDetails', Immutable.List()).forEach((folder) => {
            const folderDetails = bookmarkFolderUtil.buildFolder(folder, bookmarkFoldersState.getFolders(state))
            state = bookmarkFoldersState.addFolder(state, folderDetails, closestKey)
            state = syncUtil.updateObjectCache(state, folderDetails, STATE_SITES.BOOKMARK_FOLDERS)
            folderList = folderList.push(folderDetails)
          })
          textCalc.calcTextList(folderList)
        } else {
          const folderDetails = bookmarkFolderUtil.buildFolder(folder, bookmarkFoldersState.getFolders(state))
          state = bookmarkFoldersState.addFolder(state, folderDetails, closestKey)
          state = syncUtil.updateObjectCache(state, folderDetails, STATE_SITES.BOOKMARK_FOLDERS)
          textCalc.calcText(folderDetails, siteTags.BOOKMARK_FOLDER)
        }
        break
      }
    case appConstants.APP_EDIT_BOOKMARK_FOLDER:
      {
        const folder = action.get('folderDetails', Immutable.Map())
        const key = action.get('editKey')

        if (key == null || folder.isEmpty()) {
          break
        }

        const oldFolder = bookmarkFoldersState.getFolder(state, key)

        if (oldFolder.isEmpty()) {
          return state
        }

        state = bookmarkFoldersState.editFolder(state, key, oldFolder, folder)
        state = syncUtil.updateObjectCache(state, folder, STATE_SITES.BOOKMARK_FOLDERS)
        const folderDetails = bookmarkFoldersState.getFolder(state, key)
        textCalc.calcText(folderDetails, siteTags.BOOKMARK_FOLDER)

        if (folder.has('parentFolderId') && oldFolder.get('parentFolderId') !== folder.get('parentFolderId')) {
          state = bookmarkToolbarState.setToolbars(state)
        }

        break
      }
    case appConstants.APP_MOVE_BOOKMARK_FOLDER:
      {
        const key = action.get('folderKey')

        if (key == null) {
          break
        }

        const oldFolder = bookmarkFoldersState.getFolder(state, key)

        state = bookmarkFoldersState.moveFolder(
          state,
          key,
          action.get('destinationKey'),
          action.get('append'),
          action.get('moveIntoParent')
        )

        const destinationDetail = bookmarksState.findBookmark(state, action.get('destinationKey'))
        state = syncUtil.updateObjectCache(state, destinationDetail, STATE_SITES.BOOKMARK_FOLDERS)
        if (
          destinationDetail.get('parentFolderId') === 0 ||
          action.get('destinationKey') === 0 ||
          oldFolder.get('parentFolderId') === 0
        ) {
          state = bookmarkToolbarState.setToolbars(state)
        }
        break
      }
    case appConstants.APP_REMOVE_BOOKMARK_FOLDER:
      {
        const folderKey = action.get('folderKey')

        if (folderKey == null) {
          break
        }

        if (Immutable.List.isList(folderKey)) {
          action.get('folderKey', Immutable.List()).forEach((key) => {
            const folder = bookmarkFoldersState.getFolder(state, key)
            state = bookmarkFoldersState.removeFolder(state, key)
            state = syncUtil.updateObjectCache(state, folder, STATE_SITES.BOOKMARK_FOLDERS)
          })
          state = bookmarkToolbarState.setToolbars(state)
        } else {
          const folder = bookmarkFoldersState.getFolder(state, folderKey)
          state = bookmarkFoldersState.removeFolder(state, folderKey)
          state = syncUtil.updateObjectCache(state, folder, STATE_SITES.BOOKMARK_FOLDERS)
          if (folder.get('parentFolderId') === 0) {
            state = bookmarkToolbarState.setToolbars(state)
          }
        }
        break
      }
    case appConstants.APP_ON_BOOKMARK_FOLDER_WIDTH_CHANGED:
      {
        if (action.get('folderList', Immutable.List()).isEmpty()) {
          break
        }

        let updateToolbar = false
        action.get('folderList').forEach(item => {
          state = bookmarkFoldersState.setWidth(state, item.get('key'), item.get('width'))
          if (item.get('parentFolderId') === 0) {
            updateToolbar = true
          }
        })

        if (updateToolbar) {
          state = bookmarkToolbarState.setToolbars(state)
        }
        break
      }
  }

  return state
}

module.exports = bookmarkFoldersReducer
