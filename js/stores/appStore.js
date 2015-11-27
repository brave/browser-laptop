const AppDispatcher = require('../dispatcher/appDispatcher')
const EventEmitter = require('events').EventEmitter
const AppConstants = require('../constants/appconstants')
const Immutable = require('immutable')

// For this simple example, store immutable data object for a simple counter.
// This is of course very silly, but this is just for an app template with top
// level immutable data.
let appState = Immutable.fromJS({
  frame: {
    location: 'http://www.brave.com'
  },
  ui: {
    navbar: {
      urlbar: {
        location: ''
      }
    }
  }
})

var CHANGE_EVENT = 'change'

const updateUrl = (loc) =>
  appState = appState.setIn(['frame', 'location'], loc)

const updateNavBarInput = (loc) =>
  appState = appState.setIn(['ui', 'navbar', 'urlbar', 'location'], loc)

class AppStore extends EventEmitter {
  getAppState () {
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
    case AppConstants.APP_SET_URL:
      updateUrl(action.location)
      appStore.emitChange()
      break
    case AppConstants.APP_SET_NAVBAR_INPUT:
      updateNavBarInput(action.location)
      appStore.emitChange()
      break
    default:
  }
})

module.exports = appStore
