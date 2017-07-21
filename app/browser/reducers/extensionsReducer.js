/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// const electron = require('electron')
// const app = electron.app

// const path = require('path')
// TODO @cezaraugusto enable again once we have a GUI to exclude an extension
// const rimraf = require('rimraf')

const extensionState = require('../../common/state/extensionState')
const ExtensionConstants = require('../../common/constants/extensionConstants')
const {makeImmutable} = require('../../common/state/immutableUtil')

const extensionsReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case ExtensionConstants.EXTENSION_UNINSTALLED:
      // let extensionId = action.get('extensionId').toString()
      // let extensionPath = path.join(app.getPath('userData'), 'Extensions', extensionId)

      state = extensionState.extensionUninstalled(state, action)
      // TODO @cezaraugusto enable again once we have a GUI to exclude an extension
      // Remove extension folder
      // rimraf(extensionPath, err => {
      //   if (err) {
      //     console.log('unable to remove extension', err)
      //   }
      //   console.log(`extension id ${extensionId} removed at: \n ${extensionPath}`)
      // })
      break
  }
  return state
}

module.exports = extensionsReducer
