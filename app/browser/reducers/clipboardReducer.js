/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const {clipboard} = require('electron')

const clipboardReducer = (state, action) => {
  switch (action.actionType) {
    case appConstants.APP_CLIPBOARD_TEXT_UPDATED:
      clipboard.writeText(action.text)
      break
  }
  return state
}

module.exports = clipboardReducer
