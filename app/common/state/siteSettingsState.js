/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// Constants
const appConfig = require('../../../js/constants/appConfig')

// State
const siteSettings = require('../../../js/state/siteSettings')

// Utils
const {getHostPattern} = require('../../../js/lib/urlutil')

const api = {
  getAllSiteSettings: (state, isPrivate) => {
    if (isPrivate) {
      return state.get('siteSettings').mergeDeep(state.get('temporarySiteSettings'))
    }
    return state.get('siteSettings')
  },

  getSettingsByHost: (state, url) => {
    const siteSettings = state.get('siteSettings')
    const hostPattern = getHostPattern(url)

    return siteSettings ? siteSettings.get(hostPattern) : Immutable.Map()
  },

  isNoScriptEnabled (state, settings) {
    return siteSettings.activeSettings(settings, state, appConfig).noScript === true
  }
}

module.exports = api
