/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const AppDispatcher = require('../dispatcher/appDispatcher')
const EventEmitter = require('events').EventEmitter
const AppConstants = require('../constants/appConstants')
const Immutable = require('immutable')
const SiteUtil = require('../state/siteUtil')
const ipc = global.require('electron').ipcRenderer
const messages = require('../constants/messages')

// For this simple example, store immutable data object for a simple counter.
// This is of course very silly, but this is just for an app template with top
// level immutable data.
let appState = Immutable.fromJS({
  sites: [],
  visits: [],
  updateAvailable: false
})

var CHANGE_EVENT = 'change'

class AppStore extends EventEmitter {
  getState () {
    return appState
  }

  emitChange () {
    this.emit(CHANGE_EVENT)
  }

  addChangeListener (callback) {
    this.on(CHANGE_EVENT, callback)
  }

  removeChangeListener (callback) {
    this.removeListener(CHANGE_EVENT, callback)
  }
}

const appStore = new AppStore()

// Register callback to handle all updates
AppDispatcher.register((action) => {
  switch (action.actionType) {
    case AppConstants.APP_ADD_SITE:
      appState = appState.set('sites', SiteUtil.addSite(appState.get('sites'), action.frameProps, action.tag))
      appStore.emitChange()
      break
    case AppConstants.APP_REMOVE_SITE:
      appState = appState.set('sites', SiteUtil.removeSite(appState.get('sites'), action.frameProps, action.tag))
      appStore.emitChange()
      break
    default:
  }
})

ipc.on(messages.UPDATE_AVAILABLE, () => {
  console.log('appStore update-available')
  appState = appState.merge({
    updateAvailable: true
  })
  appStore.emitChange()
})

module.exports = appStore
