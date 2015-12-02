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
  sites: [],
  ui: {
    navbar: {
      urlbar: {
        location: '',
        urlPreview: '',
        suggestions: {
          activeIndex: 0,
          searchResults: [],
          suggestionList: null
        }
      }
    },
    tabs: {
      activeDraggedTab: null
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

const updateNavBarInput = (loc) => {
  appState = appState.setIn(['ui', 'navbar', 'urlbar', 'location'], loc)
  appState = appState.setIn(['ui', 'navbar', 'urlbar', 'urlPreview'], null)
}

let currentKey = 0
const incrementNextKey = () => ++currentKey

class AppStore extends EventEmitter {
  getAppState () {
    return appState
  }

  getFrameCount () {
    return appState.get('frames').size
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
    case AppConstants.APP_SET_FRAME_TITLE:
      appState = appState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps)], {
        title: action.title
      })
      appStore.emitChange()
      break
    case AppConstants.APP_WEBVIEW_LOAD_START:
      appState = appState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps)], {
        loading: true
      })
      appStore.emitChange()
      break
    case AppConstants.APP_WEBVIEW_LOAD_END:
      // Only update for the active frame.
      if (action.frameProps === appState.getIn(['frames', FrameStateUtil.findIndexForFrameKey(appState.get('frames'), appState.get('activeFrameKey'))])) {
        updateNavBarInput(action.location)
      }
      appState = appState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps)], {
        loading: false
      })
      appStore.emitChange()
      break
    case AppConstants.APP_SET_NAVBAR_FOCUSED:
      appState = appState.setIn(['ui', 'navbar', 'urlbar', 'focused'], action.focused)
      appStore.emitChange()
      break
    case AppConstants.APP_NEW_FRAME:
      let nextKey = incrementNextKey()
      appState = appState.merge(FrameStateUtil.addFrame(appState.get('frames'), action.frameOpts,
        nextKey, action.openInForeground ? nextKey : appState.get('activeFrameKey')))
      appStore.emitChange()
      break
    case AppConstants.APP_CLOSE_FRAME:
      // Use the frameProps we passed in, or default to the active frame
      let frameProps = action.frameProps || FrameStateUtil.getActiveFrame(appState)
      appState = appState.merge(FrameStateUtil.removeFrame(appState.get('frames'), appState.get('closedFrames'), frameProps,
        FrameStateUtil.getActiveFrame(appState)))
      appStore.emitChange()
      break
    case AppConstants.APP_SET_ACTIVE_FRAME:
      appState = appState.merge({
        activeFrameKey: action.frameProps.get('key')
      })
      appStore.emitChange()
      break
    case AppConstants.APP_UPDATE_BACK_FORWARD:
      appState = appState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps)], {
        canGoBack: action.canGoBack,
        canGoForward: action.canGoForward
      })
      appStore.emitChange()
      break
    case AppConstants.APP_TAB_DRAG_START:
      appState = appState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps)], {
        tabIsDragging: true
      })
      appState = appState.setIn(['ui', 'tabs', 'activeDraggedTab'], action.frameProps)
      appStore.emitChange()
      break
    case AppConstants.APP_TAB_DRAG_STOP:
      appState = appState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps)], {
        tabIsDragging: false
      })
      appState = appState.setIn(['ui', 'tabs', 'activeDraggedTab'], null)
      appStore.emitChange()
      break
    case AppConstants.APP_TAB_DRAGGING_OVER_LEFT:
      appState = appState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps)], {
        tabIsDraggingOn: false,
        tabIsDraggingOverLeftHalf: true,
        tabIsDraggingOverRightHalf: false
      })
      appStore.emitChange()
      break
    case AppConstants.APP_TAB_DRAGGING_OVER_RIGHT:
      appState = appState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps)], {
        tabIsDraggingOn: false,
        tabIsDraggingOverLeftHalf: false,
        tabIsDraggingOverRightHalf: true
      })
      appStore.emitChange()
      break
    case AppConstants.APP_TAB_DRAG_EXIT:
      appState = appState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps)], {
        tabIsDraggingOn: false,
        tabIsDraggingOverLeftHalf: false,
        tabIsDraggingOverRightHalf: false
      })
      appStore.emitChange()
      break
    case AppConstants.APP_TAB_DRAG_EXIT_RIGHT:
      appState = appState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps)], {
        tabIsDraggingOverRightHalf: false
      })
      appStore.emitChange()
      break
    case AppConstants.APP_TAB_DRAGGING_ON:
      appState = appState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps)], {
        tabIsDraggingOn: true,
        tabIsDraggingOverLeftHalf: false,
        tabIsDraggingOverRightHalf: false
      })
      appStore.emitChange()
      break
    case AppConstants.APP_TAB_MOVE:
      let sourceFramePropsIndex = FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.sourceFrameProps)
      let newIndex = FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.destinationFrameProps) + (action.prepend ? 0 : 1)
      let frames = appState.get('frames').splice(sourceFramePropsIndex, 1)
      if (newIndex > sourceFramePropsIndex) {
        newIndex--
      }
      frames = frames.splice(newIndex, 0, action.sourceFrameProps)
      appState = appState.set('frames', frames)
      appStore.emitChange()
      break
    case AppConstants.APP_SET_URL_BAR_SUGGESTIONS:
      appState = appState.setIn(['ui', 'navbar', 'urlbar', 'suggestions', 'selectedIndex'], action.selectedIndex)
      appState = appState.setIn(['ui', 'navbar', 'urlbar', 'suggestions', 'suggestionList'], action.suggestionList)
      appStore.emitChange()
      break
    case AppConstants.APP_SET_URL_BAR_PREVIEW:
      appState = appState.setIn(['ui', 'navbar', 'urlbar', 'urlPreview'], action.selectedIndex)
      appStore.emitChange()
      break
    case AppConstants.APP_SET_URL_BAR_SUGGESTION_SEARCH_RESULTS:
      appState = appState.setIn(['ui', 'navbar', 'urlbar', 'suggestions', 'searchResults'], action.searchResults)
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
