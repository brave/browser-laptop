/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// State
const bookmarkFoldersState = require('../../common/state/bookmarkFoldersState')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const {STATE_SITES} = require('../../../js/constants/stateConstants')

// Utils
const {makeImmutable} = require('../../common/state/immutableUtil')
const syncUtil = require('../../../js/state/syncUtil')

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
          action.get('folderDetails', Immutable.List()).forEach((folder) => {
            state = bookmarkFoldersState.addFolder(state, folder, closestKey)
            state = syncUtil.updateObjectCache(state, folder, STATE_SITES.BOOKMARK_FOLDERS)
          })
        } else {
          state = bookmarkFoldersState.addFolder(state, folder, closestKey)
          state = syncUtil.updateObjectCache(state, folder, STATE_SITES.BOOKMARK_FOLDERS)
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

        state = bookmarkFoldersState.editFolder(state, key, folder)
        state = syncUtil.updateObjectCache(state, folder, STATE_SITES.BOOKMARK_FOLDERS)

        break
      }
    case appConstants.APP_MOVE_BOOKMARK_FOLDER:
      {
        const key = action.get('folderKey')

        if (key == null) {
          break
        }

        state = bookmarkFoldersState.moveFolder(
          state,
          key,
          action.get('destinationKey'),
          action.get('append'),
          action.get('moveIntoParent')
        )

        const destinationDetail = bookmarkFoldersState.getFolder(state, action.get('destinationKey'))
        state = syncUtil.updateObjectCache(state, destinationDetail, STATE_SITES.BOOKMARK_FOLDERS)
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
            const folder = state.getIn([STATE_SITES.BOOKMARK_FOLDERS, key])
            state = bookmarkFoldersState.removeFolder(state, key)
            state = syncUtil.updateObjectCache(state, folder, STATE_SITES.BOOKMARK_FOLDERS)
          })
        } else {
          const folder = state.getIn([STATE_SITES.BOOKMARK_FOLDERS, folderKey])
          state = bookmarkFoldersState.removeFolder(state, folderKey)
          state = syncUtil.updateObjectCache(state, folder, STATE_SITES.BOOKMARK_FOLDERS)
        }

        break
      }
  }

  return state
}

module.exports = bookmarkFoldersReducer
