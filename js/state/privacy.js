/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const AppDispatcher = require('../dispatcher/appDispatcher')
const AppStore = require('../stores/appStore')
const AppConstants = require('../constants/appConstants')
const settings = require('../constants/settings')
const {registerUserPrefs} = require('./userPrefs')
const getSetting = require('../settings').getSetting

const getPrivacySettings = () => {
  return { 'autofill.enabled': getSetting(settings.AUTOFILL_ENABLED) }
}

let updateTrigger

// Register callback to handle all updates
const doAction = (action) => {
  if (action.actionType === AppConstants.APP_CHANGE_SETTING) {
    AppDispatcher.waitFor([AppStore.dispatchToken], () => {
      updateTrigger()
    })
  }
}

module.exports.init = () => {
  updateTrigger = registerUserPrefs(() => getPrivacySettings())
  AppDispatcher.register(doAction)
}
