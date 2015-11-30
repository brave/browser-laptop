const AppDispatcher = require('../dispatcher/appDispatcher')
const EventEmitter = require('events').EventEmitter
const AppConstants = require('../constants/appConstants')
const Immutable = require('immutable')
const FrameStateUtil = require('../state/frameStateUtil')
const ipc = require('ipc')

// For this simple example, store immutable data object for a simple counter.
// This is of course very silly, but this is just for an app template with top
// level immutable data.
let appState = Immutable.fromJS({
  activeFrameKey: null,
  frames: [],
  closedFrames: [],
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
  appState = appState.mergeIn(['frames', FrameStateUtil.findIndexForFrameKey(appState.get('frames'), appState.get('activeFrameKey'))], {
    src: loc,
    location: loc,
    title: ''
  })

const updateNavBarInput = (loc) =>
  appState = appState.setIn(['ui', 'navbar', 'urlbar', 'location'], loc)

let currentKey = 0
const incrementNextKey = () => ++currentKey

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
    case AppConstants.APP_NEW_FRAME:
      let nextKey = incrementNextKey()
      appState = appState.merge(FrameStateUtil.addFrame(appState.get('frames'), action.frameOpts,
        nextKey, action.openInForeground ? nextKey : appState.get('activeFrameKey')))
      appStore.emitChange()
      break
    default:
  }
})

ipc.on('shortcut-next-tab', () => {
  appState = FrameStateUtil.makeNextFrameActive(appState)
  appStore.emitChange()
})
ipc.on('shortcut-prev-tab', () => {
  appState = FrameStateUtil.makePrevFrameActive(appState)
  appStore.emitChange()
})

module.exports = appStore
