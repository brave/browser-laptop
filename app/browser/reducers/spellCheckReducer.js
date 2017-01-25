/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const tabs = require('../tabs')
const {makeImmutable} = require('../../common/state/immutableUtil')

const spellCheckReducer = (state, action) => {
  action = makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_ADD_WORD:
      tabs.sendToAll('add-word', action.get('word'))
      break
  }
  return state
}

module.exports = spellCheckReducer
