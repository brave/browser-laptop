/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const Immutable = require('immutable')
const appConstants = require('../../../js/constants/appConstants')
const {makeImmutable} = require('../../common/state/immutableUtil')

const importerReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_IMPORT_BROWSER_DATA:
      {
        const importer = require('../../importer')
        const selected = action.get('selected')

        if (selected == null) {
          break
        }

        if (selected.get('type') === 5) {
          if (selected.get('favorites')) {
            importer.importHTML(selected)
          }
        } else {
          importer.importData(selected)
        }
        break
      }
    case appConstants.APP_ON_IMPORT_BROWSER_DATA_DETAIL:
      {
        const windowId = action.get('windowId')
        if (windowId == null || windowId === -1) {
          break
        }
        const data = action.get('importBrowserDataDetail')
        if (data == null) {
          state = state.deleteIn(['windows', windowId, 'importBrowserDataDetail'])
        } else {
          const oldState = state.getIn(['windows', windowId, 'importBrowserDataDetail'], Immutable.Map())
          const newState = oldState.merge(data)
          state = state.setIn(['windows', windowId, 'importBrowserDataDetail'], newState)
        }
        break
      }
    case appConstants.APP_ON_IMPORT_BROWSER_DATA_SELECTED:
      {
        const windowId = action.get('windowId')
        if (windowId == null || windowId === -1) {
          break
        }
        if (action.get('selected') == null) {
          state = state.deleteIn(['windows', windowId, 'importBrowserDataSelected'])
        } else {
          if (typeof action.get('selected') === 'number') {
            const detail = state.getIn(['windows', windowId, 'importBrowserDataDetail', 'browsers', action.get('selected')])
            state = state.setIn(['windows', windowId, 'importBrowserDataSelected'], detail)
          } else {
            action.get('selected').forEach((item, index) => {
              state = state.setIn(['windows', windowId, 'importBrowserDataSelected', index], item)
            })
          }
        }
        break
      }
  }
  return state
}

module.exports = importerReducer
