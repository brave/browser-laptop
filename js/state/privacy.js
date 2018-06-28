/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appDispatcher = require('../dispatcher/appDispatcher')
const AppStore = require('../stores/appStore')
const appConstants = require('../constants/appConstants')
const {passwordManagers} = require('../constants/passwordManagers')
const settings = require('../constants/settings')
const {registerUserPrefs} = require('./userPrefs')
const getSetting = require('../settings').getSetting

const getPrivacySettings = () => {
  const passwordManagerEnabled = getSetting(settings.ACTIVE_PASSWORD_MANAGER) === passwordManagers.BUILT_IN
  return { 'autofill.enabled': getSetting(settings.AUTOFILL_ENABLED),
    'profile.password_manager_enabled': passwordManagerEnabled,
    'credentials_enable_service': passwordManagerEnabled,
    'credentials_enable_autosignin': false,
    // required explicitly disable it because it is true by default
    // https://chromium.googlesource.com/chromium/src/+/dac2bad4efc572810f6b39598705c01df7c64ea6/components/safe_browsing/common/safe_browsing_prefs.cc#283
    'safebrowsing.enabled': false
  }
}

let updateTrigger

// Register callback to handle all updates
const doAction = (action) => {
  if (action.actionType === appConstants.APP_CHANGE_SETTING) {
    appDispatcher.waitFor([AppStore.dispatchToken], () => {
      updateTrigger()
    })
  }
}

module.exports.init = () => {
  updateTrigger = registerUserPrefs(() => getPrivacySettings())
  appDispatcher.register(doAction)
}
