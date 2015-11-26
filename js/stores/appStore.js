const AppDispatcher = require('../dispatcher/appDispatcher')
const EventEmitter = require('events').EventEmitter
const AppConstants = require('../constants/appconstants')
const Immutable = require('immutable')

// For this simple example, store immutable data object for a simple counter.
// This is of course very silly, but this is just for an app template with top
// level immutable data.
let appState = Immutable.fromJS({
  someObj: {
    counter: 0
  }
})

var CHANGE_EVENT = 'change'

const increment = () =>
  appState = appState.setIn(['someObj', 'counter'], appState.getIn(['someObj', 'counter']) + 1)

const decrement = () =>
  appState = appState.setIn(['someObj', 'counter'], appState.getIn(['someObj', 'counter']) - 1)

class AppStore extends EventEmitter {
  isAbove10 () {
    return appState.getIn(['someObj', 'counter']) > 10
  }

  getAppState () {
    return appState
  }

  getSomeObj () {
    return appState.get('someObj')
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
  // Just to show how you attach extra data from the Actions
  console.log(action.text)

  switch (action.actionType) {
    case AppConstants.APP_INCREMENT:
      if (appState.getIn(['someObj', 'counter']) < 15) {
        increment()
      }
      appStore.emitChange()
      break

    case AppConstants.APP_DECREMENT:
      if (appState.getIn(['someObj', 'counter']) > 0) {
        decrement()
      }
      appStore.emitChange()
      break
    default:
  }
})

module.exports = appStore
