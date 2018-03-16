/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const { createSelector } = require('reselect')
// Constants
const appConfig = require('../../../js/constants/appConfig')

// State
const siteSettings = require('../../../js/state/siteSettings')

// Utils
const {getHostPattern} = require('../../../js/lib/urlutil')

const getAllSiteSettings = state => state.get('siteSettings')

const api = {
  getAllAndTemporarySiteSettingsSelector: createSelector(
    getAllSiteSettings,
    state => state.get('temporarySiteSettings'),
    (allSiteSettings, temporarySiteSettings) => allSiteSettings.mergeDeep(temporarySiteSettings)
  ),

  getAllSiteSettings: (state, isPrivate) => {
    if (isPrivate) {
      return api.getAllAndTemporarySiteSettingsSelector(state)
    }
    return getAllSiteSettings(state)
  },

  getSettingsByHost: (state, url) => {
    const siteSettings = getAllSiteSettings(state)
    const hostPattern = getHostPattern(url)

    return siteSettings ? siteSettings.get(hostPattern) : Immutable.Map()
  },

  isNoScriptEnabled: (state, settings) => {
    return siteSettings.activeSettings(settings, state, appConfig).noScript === true
  },

  getSettingsProp: (state, pattern, prop) => {
    if (prop == null) {
      return null
    }

    return state.getIn(['siteSettings', pattern, prop])
  },

  setSettingsProp: (state, pattern, prop, value) => {
    if (prop == null || pattern == null) {
      return state
    }

    return state.setIn(['siteSettings', pattern, prop], value)
  }
}

module.exports = api
