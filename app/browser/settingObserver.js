/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appStore = require('../../js/stores/appStore')
const Immutable = require('Immutable')
const getSetting = require('../../js/settings').getSetting
let lastSettings = Immutable.Map()
let watchedPrefs = []

/**
 * Registers to get notifications when a preference changes.
 * @param prefKey - The preference key to watch
 * @param cb - The callback to call when changes occur
 * @return a function which can be called by the caller to unregister itself
 */
const registerForPref = (prefKey, cb) => {
  watchedPrefs.push({ prefKey, cb })
  // Return a function which removes itself when called
  return () => {
    watchedPrefs = watchedPrefs.filter((pref) => prefKey !== pref.prefKey || cb !== pref.cb)
  }
}

const init = () =>
  appStore.addChangeListener(() => {
    // Determine if we should check for changes
    if (lastSettings !== appStore.getState().get('settings')) {
      watchedPrefs.forEach((pref) => {
        const prefValue = getSetting(pref.prefKey)
        if (prefValue !== getSetting(pref.prefKey, lastSettings)) {
          pref.cb(pref.prefKey, prefValue)
        }
      })
      lastSettings = appStore.getState().get('settings')
    }
  })

const getWatchedPrefCount = () => watchedPrefs.length

module.exports = {
  init,
  registerForPref,
  getWatchedPrefCount
}
