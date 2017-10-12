/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const path = require('path')
const {app, shell} = require('electron')

const updatesReducer = (state, action) => {
  switch (action.actionType) {
    case appConstants.APP_UPDATE_LOG_OPENED:
      shell.openItem(path.join(app.getPath('userData'), 'updateLog.log'))
      break
  }
  return state
}

module.exports = updatesReducer
