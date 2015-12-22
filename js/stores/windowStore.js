/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const WindowDispatcher = require('../dispatcher/windowDispatcher')
const EventEmitter = require('events').EventEmitter
const WindowConstants = require('../constants/windowConstants')
const Immutable = require('immutable')
const FrameStateUtil = require('../state/frameStateUtil')
const ipc = global.require('electron').ipcRenderer
const messages = require('../constants/messages')

// For this simple example, store immutable data object for a simple counter.
// This is of course very silly, but this is just for an app template with top
// level immutable data.
let windowState = Immutable.fromJS({
  activeFrameKey: null,
  frames: [],
  closedFrames: [],
  ui: {
    tabs: {
      activeDraggedTab: null
    }
  },
  searchDetail: null
})

var CHANGE_EVENT = 'change'

const activeFrameStatePath = () =>
  ['frames', FrameStateUtil.findIndexForFrameKey(windowState.get('frames'), windowState.get('activeFrameKey'))]

const updateNavBarInput = (loc) => {
  windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'location']), loc)
  windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'urlPreview']), null)
}

/**
 * Updates the tab page index to the specified frameProps
 * @param frameProps Any frame belonging to the page
 */
const updateTabPageIndex = (frameProps) => {
  const index = FrameStateUtil.getFrameTabPageIndex(windowState.get('frames'), frameProps)
  if (index === -1) {
    return
  }
  windowState = windowState.setIn(['ui', 'tabs', 'tabPageIndex'], index)
}

let currentKey = 0
const incrementNextKey = () => ++currentKey

class WindowStore extends EventEmitter {
  getState () {
    return windowState
  }

  getFrameCount () {
    return windowState.get('frames').size
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

const windowStore = new WindowStore()

// Register callback to handle all updates
WindowDispatcher.register((action) => {
  switch (action.actionType) {
    case WindowConstants.APP_SET_URL:
      // reload if the url is unchanged
      if (FrameStateUtil.getActiveFrame(windowState).get('src') === action.location) {
        windowState = windowState.mergeIn(activeFrameStatePath(), {
          audioPlaybackActive: false,
          activeShortcut: 'reload'
        })
      } else {
        windowState = windowState.mergeIn(activeFrameStatePath(), {
          src: action.location,
          location: action.location,
          audioPlaybackActive: false,
          title: ''
        })
      }
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_LOCATION:
      const key = action.key || windowState.get('activeFrameKey')
      windowState = windowState.mergeIn(activeFrameStatePath(), {
        audioPlaybackActive: false,
        location: action.location
      })
      // Update the displayed location in the urlbar
      if (key === windowState.get('activeFrameKey')) {
        updateNavBarInput(action.location)
      }
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_NAVBAR_INPUT:
      updateNavBarInput(action.location)
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_FRAME_TITLE:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        title: action.title
      })
      windowStore.emitChange()
      break
    case WindowConstants.APP_WEBVIEW_LOAD_START:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        loading: true
      })
      windowStore.emitChange()
      break
    case WindowConstants.APP_WEBVIEW_LOAD_END:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        loading: false
      })
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_NAVBAR_FOCUSED:
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'focused']), action.focused)
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'focused']), action.focused)
      windowStore.emitChange()
      break
    case WindowConstants.APP_NEW_FRAME:
      let nextKey = incrementNextKey()
      windowState = windowState.merge(FrameStateUtil.addFrame(windowState.get('frames'), action.frameOpts,
        nextKey, action.openInForeground ? nextKey : windowState.get('activeFrameKey')))
      if (action.openInForeground) {
        updateTabPageIndex(FrameStateUtil.getActiveFrame(windowState))
      }
      windowStore.emitChange()
      break
    case WindowConstants.APP_CLOSE_FRAME:
      // Use the frameProps we passed in, or default to the active frame
      let frameProps = action.frameProps || FrameStateUtil.getActiveFrame(windowState)
      const closingActive = !action.frameProps || action.frameProps === FrameStateUtil.getActiveFrame(windowState)
      const index = FrameStateUtil.getFramePropsIndex(windowState.get('frames'), frameProps)
      windowState = windowState.merge(FrameStateUtil.removeFrame(windowState.get('frames'),
        windowState.get('closedFrames'), frameProps.set('closedAtIndex', index),
        frameProps.get('key')))
      if (closingActive) {
        updateTabPageIndex(FrameStateUtil.getActiveFrame(windowState))
      }
      windowStore.emitChange()
      break
    case WindowConstants.APP_UNDO_CLOSED_FRAME:
      windowState = windowState.merge(FrameStateUtil.undoCloseFrame(windowState, windowState.get('closedFrames')))
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_ACTIVE_FRAME:
      windowState = windowState.merge({
        activeFrameKey: action.frameProps.get('key')
      })
      updateTabPageIndex(action.frameProps)
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_TAB_PAGE_INDEX:
      windowState = windowState.setIn(['ui', 'tabs', 'tabPageIndex'], action.index)
      windowStore.emitChange()
      break
    case WindowConstants.APP_UPDATE_BACK_FORWARD:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        canGoBack: action.canGoBack,
        canGoForward: action.canGoForward
      })
      windowStore.emitChange()
      break
    case WindowConstants.APP_TAB_DRAG_START:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        tabIsDragging: true
      })
      windowState = windowState.setIn(['ui', 'tabs', 'activeDraggedTab'], action.frameProps)
      windowStore.emitChange()
      break
    case WindowConstants.APP_TAB_DRAG_STOP:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        tabIsDragging: false
      })
      windowState = windowState.setIn(['ui', 'tabs', 'activeDraggedTab'], null)
      windowStore.emitChange()
      break
    case WindowConstants.APP_TAB_DRAGGING_OVER_LEFT:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        tabIsDraggingOn: false,
        tabIsDraggingOverLeftHalf: true,
        tabIsDraggingOverRightHalf: false
      })
      windowStore.emitChange()
      break
    case WindowConstants.APP_TAB_DRAGGING_OVER_RIGHT:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        tabIsDraggingOn: false,
        tabIsDraggingOverLeftHalf: false,
        tabIsDraggingOverRightHalf: true
      })
      windowStore.emitChange()
      break
    case WindowConstants.APP_TAB_DRAG_EXIT:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        tabIsDraggingOn: false,
        tabIsDraggingOverLeftHalf: false,
        tabIsDraggingOverRightHalf: false
      })
      windowStore.emitChange()
      break
    case WindowConstants.APP_TAB_DRAG_EXIT_RIGHT:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        tabIsDraggingOverRightHalf: false
      })
      windowStore.emitChange()
      break
    case WindowConstants.APP_TAB_DRAGGING_ON:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        tabIsDraggingOn: true,
        tabIsDraggingOverLeftHalf: false,
        tabIsDraggingOverRightHalf: false
      })
      windowStore.emitChange()
      break
    case WindowConstants.APP_TAB_MOVE:
      let sourceFramePropsIndex = FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.sourceFrameProps)
      let newIndex = FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.destinationFrameProps) + (action.prepend ? 0 : 1)
      let frames = windowState.get('frames').splice(sourceFramePropsIndex, 1)
      if (newIndex > sourceFramePropsIndex) {
        newIndex--
      }
      frames = frames.splice(newIndex, 0, action.sourceFrameProps)
      windowState = windowState.set('frames', frames)
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_URL_BAR_SUGGESTIONS:
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex']), action.selectedIndex)
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), action.suggestionList)
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_URL_BAR_PREVIEW:
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'urlPreview']), action.value)
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_URL_BAR_SUGGESTION_SEARCH_RESULTS:
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'suggestionResults']), action.searchResults)
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_URL_BAR_ACTIVE:
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'active']), action.isActive)
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_URL_BAR_AUTOSELECTED:
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'autoselected']), action.isAutoselected)
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_ACTIVE_FRAME_SHORTCUT:
      windowState = windowState.mergeIn(activeFrameStatePath(), {
        activeShortcut: action.activeShortcut
      })
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_SEARCH_DETAIL:
      windowState = windowState.merge({
        searchDetail: action.searchDetail
      })
      break
    case WindowConstants.APP_SET_AUDIO_MUTED:
      windowState = windowState.setIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps), 'audioMuted'], action.muted)
      windowStore.emitChange()
      break
    case WindowConstants.APP_SET_AUDIO_PLAYBACK_ACTIVE:
      windowState = windowState.setIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps), 'audioPlaybackActive'], action.audioPlaybackActive)
      windowStore.emitChange()
      break
    default:
  }
})

ipc.on(messages.SHORTCUT_NEXT_TAB, () => {
  windowState = FrameStateUtil.makeNextFrameActive(windowState)
  updateTabPageIndex(FrameStateUtil.getActiveFrame(windowState))
  windowStore.emitChange()
})

ipc.on(messages.SHORTCUT_PREV_TAB, () => {
  windowState = FrameStateUtil.makePrevFrameActive(windowState)
  updateTabPageIndex(FrameStateUtil.getActiveFrame(windowState))
  windowStore.emitChange()
})

const frameShortcuts = ['stop', 'reload', 'zoom-in', 'zoom-out', 'zoom-reset', 'toggle-dev-tools', 'clean-reload', 'view-source', 'mute']
frameShortcuts.forEach(shortcut => {
  // Listen for actions on the active frame
  ipc.on(`shortcut-active-frame-${shortcut}`, () => {
    windowState = windowState.mergeIn(activeFrameStatePath(), {
      activeShortcut: shortcut
    })
    windowStore.emitChange()
  })
  // Listen for actions on frame N
  if (['reload', 'mute'].includes(shortcut)) {
    ipc.on(`shortcut-frame-${shortcut}`, (e, i) => {
      let path = ['frames', FrameStateUtil.findIndexForFrameKey(windowState.get('frames'), i)]
      windowState = windowState.mergeIn(path, {
        activeShortcut: shortcut
      })
      windowStore.emitChange()
    })
  }
})

module.exports = windowStore
