/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// State
const bookmarkFoldersState = require('../../common/state/bookmarkFoldersState')

// Constants
const appConstants = require('../../../js/constants/appConstants')

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

            if (syncUtil.syncEnabled()) {
              state = syncUtil.updateSiteCache(state, folder)
            }
          })
        } else {
          state = bookmarkFoldersState.addFolder(state, folder, closestKey)

          if (syncUtil.syncEnabled()) {
            state = syncUtil.updateSiteCache(state, folder)
          }
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

        if (syncUtil.syncEnabled()) {
          state = syncUtil.updateSiteCache(state, folder)
        }

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

        if (syncUtil.syncEnabled()) {
          const destinationDetail = state.getIn(['sites', action.get('destinationKey')])
          state = syncUtil.updateSiteCache(state, destinationDetail)
        }
        break
      }
    case appConstants.APP_REMOVE_BOOKMARK_FOLDER:
      {
        const key = action.get('folderKey')

        if (key == null) {
          break
        }

        state = bookmarkFoldersState.removeFolder(state, key)
        break
      }
  }

  return state
}

module.exports = bookmarkFoldersReducer
