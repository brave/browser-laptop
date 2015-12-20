/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const AppDispatcher = require('../dispatcher/appDispatcher')
const EventEmitter = require('events').EventEmitter
const AppConstants = require('../constants/appConstants')
const Immutable = require('immutable')
const FrameStateUtil = require('../state/frameStateUtil')
const SiteUtil = require('../state/siteUtil')
const ipc = global.require('electron').ipcRenderer
const messages = require('../constants/messages')

// For this simple example, store immutable data object for a simple counter.
// This is of course very silly, but this is just for an app template with top
// level immutable data.
let appState = Immutable.fromJS({
  activeFrameKey: null,
  frames: [],
  closedFrames: [],
  sites: [],
  searchDetail: null,
  updateAvailable: false,
  ui: {
    navbar: {
      searchSuggestions: true,
      focused: true,
      urlbar: {
        location: '',
        urlPreview: '',
        suggestions: {
          selectedIndex: 0,
          searchResults: [],
          suggestionList: null
        },
        autoselected: true,
        focused: true,
        active: false
      }
    },
    tabs: {
      activeDraggedTab: null
    }
  }
})

var CHANGE_EVENT = 'change'

const activeFrameStatePath = () =>
  ['frames', FrameStateUtil.findIndexForFrameKey(appState.get('frames'), appState.get('activeFrameKey'))]

const updateNavBarInput = (loc) => {
  appState = appState.setIn(['ui', 'navbar', 'urlbar', 'location'], loc)
  appState = appState.setIn(['ui', 'navbar', 'urlbar', 'urlPreview'], null)
}

/**
 * Updates the tab page index to the specified frameProps
 * @param frameProps Any frame belonging to the page
 */
const updateTabPageIndex = (frameProps) => {
  const index = FrameStateUtil.getFrameTabPageIndex(appState.get('frames'), frameProps)
  if (index === -1) {
    return
  }
  appState = appState.setIn(['ui', 'tabs', 'tabPageIndex'], index)
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
      // reload if the url is unchanged
      if (FrameStateUtil.getActiveFrame(appState).get('src') === action.location) {
        appState = appState.mergeIn(activeFrameStatePath(), {
          activeShortcut: 'reload'
        })
      } else {
        appState = appState.mergeIn(activeFrameStatePath(), {
          src: action.location,
          location: action.location,
          title: ''
        })
      }
      appStore.emitChange()
      break
    case AppConstants.APP_SET_LOCATION:
      const key = action.key || appState.get('activeFrameKey')
      appState = appState.mergeIn(activeFrameStatePath(), {
        location: action.location
      })
      // Update the displayed location in the urlbar
      if (key === appState.get('activeFrameKey')) {
        updateNavBarInput(action.location)
      }
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
      appState = appState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps)], {
        loading: false
      })
      appStore.emitChange()
      break
    case AppConstants.APP_SET_NAVBAR_FOCUSED:
      appState = appState.setIn(['ui', 'navbar', 'focused'], action.focused)
      appState = appState.setIn(['ui', 'navbar', 'urlbar', 'focused'], action.focused)
      appStore.emitChange()
      break
    case AppConstants.APP_NEW_FRAME:
      let nextKey = incrementNextKey()
      appState = appState.merge(FrameStateUtil.addFrame(appState.get('frames'), action.frameOpts,
        nextKey, action.openInForeground ? nextKey : appState.get('activeFrameKey')))
      if (action.openInForeground) {
        updateTabPageIndex(FrameStateUtil.getActiveFrame(appState))
      }
      appStore.emitChange()
      break
    case AppConstants.APP_CLOSE_FRAME:
      // Use the frameProps we passed in, or default to the active frame
      let frameProps = action.frameProps || FrameStateUtil.getActiveFrame(appState)
      const closingActive = !action.frameProps || action.frameProps === FrameStateUtil.getActiveFrame(appState)
      const index = FrameStateUtil.getFramePropsIndex(appState.get('frames'), frameProps)
      appState = appState.merge(FrameStateUtil.removeFrame(appState.get('frames'),
        appState.get('closedFrames'), frameProps.set('closedAtIndex', index),
        frameProps.get('key')))
      if (closingActive) {
        updateTabPageIndex(FrameStateUtil.getActiveFrame(appState))
      }
      appStore.emitChange()
      break
    case AppConstants.APP_UNDO_CLOSED_FRAME:
      appState = appState.merge(FrameStateUtil.undoCloseFrame(appState, appState.get('closedFrames')))
      appStore.emitChange()
      break
    case AppConstants.APP_SET_ACTIVE_FRAME:
      appState = appState.merge({
        activeFrameKey: action.frameProps.get('key')
      })
      updateTabPageIndex(action.frameProps)
      appStore.emitChange()
      break
    case AppConstants.APP_SET_TAB_PAGE_INDEX:
      appState = appState.setIn(['ui', 'tabs', 'tabPageIndex'], action.index)
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
      appState = appState.setIn(['ui', 'navbar', 'urlbar', 'urlPreview'], action.value)
      appStore.emitChange()
      break
    case AppConstants.APP_SET_URL_BAR_SUGGESTION_SEARCH_RESULTS:
      appState = appState.setIn(['ui', 'navbar', 'urlbar', 'suggestions', 'searchResults'], action.searchResults)
      appStore.emitChange()
      break
    case AppConstants.APP_SET_URL_BAR_ACTIVE:
      appState = appState.setIn(['ui', 'navbar', 'urlbar', 'active'], action.isActive)
      appStore.emitChange()
      break
    case AppConstants.APP_SET_URL_BAR_AUTOSELECTED:
      appState = appState.setIn(['ui', 'navbar', 'urlbar', 'autoselected'], action.isAutoselected)
      appStore.emitChange()
      break
    case AppConstants.APP_SET_ACTIVE_FRAME_SHORTCUT:
      appState = appState.mergeIn(activeFrameStatePath(), {
        activeShortcut: action.activeShortcut
      })
      appStore.emitChange()
      break
    case AppConstants.APP_SET_SEARCH_DETAIL:
      appState = appState.merge({
        searchDetail: action.searchDetail
      })
      break
    case AppConstants.APP_ADD_SITE:
      appState = appState.set('sites', SiteUtil.addSite(appState.get('sites'), action.frameProps, action.tag))
      appStore.emitChange()
      break
    case AppConstants.APP_REMOVE_SITE:
      appState = appState.set('sites', SiteUtil.removeSite(appState.get('sites'), action.frameProps, action.tag))
      appStore.emitChange()
      break
    case AppConstants.APP_SET_AUDIO_MUTED:
      appState = appState.setIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps), 'audioMuted'], action.muted)
      appStore.emitChange()
      break
    case AppConstants.APP_SET_AUDIO_PLAYBACK_ACTIVE:
      appState = appState.setIn(['frames', FrameStateUtil.getFramePropsIndex(appState.get('frames'), action.frameProps), 'audioPlaybackActive'], action.audioPlaybackActive)
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

ipc.on(messages.SHORTCUT_NEXT_TAB, () => {
  appState = FrameStateUtil.makeNextFrameActive(appState)
  updateTabPageIndex(FrameStateUtil.getActiveFrame(appState))
  appStore.emitChange()
})

ipc.on(messages.SHORTCUT_PREV_TAB, () => {
  appState = FrameStateUtil.makePrevFrameActive(appState)
  updateTabPageIndex(FrameStateUtil.getActiveFrame(appState))
  appStore.emitChange()
})

const frameShortcuts = ['stop', 'reload', 'zoom-in', 'zoom-out', 'zoom-reset', 'toggle-dev-tools', 'clean-reload', 'view-source', 'mute']
frameShortcuts.forEach(shortcut => {
  // Listen for actions on the active frame
  ipc.on(`shortcut-active-frame-${shortcut}`, () => {
    appState = appState.mergeIn(activeFrameStatePath(), {
      activeShortcut: shortcut
    })
    appStore.emitChange()
  })
  // Listen for actions on frame N
  if (['reload', 'mute'].includes(shortcut)) {
    ipc.on(`shortcut-frame-${shortcut}`, (e, i) => {
      let path = ['frames', FrameStateUtil.findIndexForFrameKey(appState.get('frames'), i)]
      appState = appState.mergeIn(path, {
        activeShortcut: shortcut
      })
      appStore.emitChange()
    })
  }
})

module.exports = appStore
