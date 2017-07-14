/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const Immutable = require('immutable')
const siteUtil = require('../../../js/state/siteUtil')
const siteSettings = require('../../../js//state/siteSettings')

const siteSettingsReducer = (state, action) => {
  switch (action.actionType) {
    case appConstants.APP_ALLOW_FLASH_ONCE: {
      const propertyName = action.isPrivate ? 'temporarySiteSettings' : 'siteSettings'
      state = state.set(propertyName,
        siteSettings.mergeSiteSetting(state.get(propertyName), siteUtil.getOrigin(action.url), 'flash', 1))
      break
    }
    case appConstants.APP_ALLOW_FLASH_ALWAYS: {
      const propertyName = action.isPrivate ? 'temporarySiteSettings' : 'siteSettings'
      const expirationTime = Date.now() + (7 * 24 * 3600 * 1000)
      state = state.set(propertyName,
        siteSettings.mergeSiteSetting(state.get(propertyName), siteUtil.getOrigin(action.url), 'flash', expirationTime))
      break
    }
    case appConstants.APP_CHANGE_SITE_SETTING: {
      let propertyName = action.temporary ? 'temporarySiteSettings' : 'siteSettings'
      let newSiteSettings = siteSettings.mergeSiteSetting(state.get(propertyName), action.hostPattern, action.key, action.value)
      if (action.skipSync) {
        newSiteSettings = newSiteSettings.setIn([action.hostPattern, 'skipSync'], true)
      }
      state = state.set(propertyName, newSiteSettings)
      break
    }
    case appConstants.APP_REMOVE_SITE_SETTING: {
      let propertyName = action.temporary ? 'temporarySiteSettings' : 'siteSettings'
      let newSiteSettings = siteSettings.removeSiteSetting(state.get(propertyName),
        action.hostPattern, action.key)
      if (action.skipSync) {
        newSiteSettings = newSiteSettings.setIn([action.hostPattern, 'skipSync'], true)
      }
      state = state.set(propertyName, newSiteSettings)
      break
    }
    case appConstants.APP_CLEAR_SITE_SETTINGS: {
      let propertyName = action.temporary ? 'temporarySiteSettings' : 'siteSettings'
      let newSiteSettings = new Immutable.Map()
      state.get(propertyName).map((entry, hostPattern) => {
        let newEntry = entry.delete(action.key)
        if (action.skipSync) {
          newEntry = newEntry.set('skipSync', true)
        }
        newSiteSettings = newSiteSettings.set(hostPattern, newEntry)
      })
      state = state.set(propertyName, newSiteSettings)
      break
    }
    case appConstants.APP_ADD_NOSCRIPT_EXCEPTIONS: {
      const propertyName = action.temporary ? 'temporarySiteSettings' : 'siteSettings'
      // Note that this is always cleared on restart or reload, so should not
      // be synced or persisted.
      const key = 'noScriptExceptions'
      if (!action.origins || !action.origins.size) {
        // Clear the exceptions
        state = state.setIn([propertyName, action.hostPattern, key], new Immutable.Map())
      } else {
        const currentExceptions = state.getIn([propertyName, action.hostPattern, key]) || new Immutable.Map()
        state = state.setIn([propertyName, action.hostPattern, key], currentExceptions.merge(action.origins))
      }
      break
    }
    case appConstants.APP_ENABLE_UNDEFINED_PUBLISHERS:
      const sitesObject = state.get('siteSettings')
      Object.keys(action.publishers).map((item) => {
        const pattern = `https?://${item}`
        const siteSetting = sitesObject.get(pattern)
        const result = (siteSetting) && (siteSetting.get('ledgerPayments'))

        if (result === undefined) {
          let newSiteSettings = siteSettings.mergeSiteSetting(state.get('siteSettings'), pattern, 'ledgerPayments', true)
          state = state.set('siteSettings', newSiteSettings)
        }
      })
      break
    case appConstants.APP_CHANGE_LEDGER_PINNED_PERCENTAGES:
      Object.keys(action.publishers).map((item) => {
        const pattern = `https?://${item}`
        let newSiteSettings = siteSettings.mergeSiteSetting(state.get('siteSettings'), pattern, 'ledgerPinPercentage', action.publishers[item].pinPercentage)
        state = state.set('siteSettings', newSiteSettings)
      })
      break
  }
  return state
}

module.exports = siteSettingsReducer
