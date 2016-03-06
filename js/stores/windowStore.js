/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('../constants/config')
const WindowDispatcher = require('../dispatcher/windowDispatcher')
const EventEmitter = require('events').EventEmitter
const WindowConstants = require('../constants/windowConstants')
const settings = require('../constants/settings')
const Immutable = require('immutable')
const FrameStateUtil = require('../state/frameStateUtil')
const getFavicon = require('../lib/faviconUtil.js')
const ipc = global.require('electron').ipcRenderer
const messages = require('../constants/messages')
const debounce = require('../lib/debounce.js')
const getSetting = require('../settings').getSetting
const importFromHTML = require('../lib/importer').importFromHTML

let windowState = Immutable.fromJS({
  activeFrameKey: null,
  frames: [],
  closedFrames: [],
  ui: {
    tabs: {
    },
    mouseInTitlebar: false
  },
  searchDetail: null
})
let lastEmittedState

const CHANGE_EVENT = 'change'

const frameStatePath = (key) =>
  ['frames', FrameStateUtil.findIndexForFrameKey(windowState.get('frames'), key)]
const activeFrameStatePath = () => frameStatePath(windowState.get('activeFrameKey'))
const frameStatePathForFrame = (frameProps) =>
  ['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), frameProps)]

const updateNavBarInput = (loc, frameStatePath = activeFrameStatePath()) => {
  windowState = windowState.setIn(frameStatePath.concat(['navbar', 'urlbar', 'location']), loc)
  windowState = windowState.setIn(frameStatePath.concat(['navbar', 'urlbar', 'urlPreview']), null)
}

/**
 * Updates the tab page index to the specified frameProps
 * @param frameProps Any frame belonging to the page
 */
const updateTabPageIndex = (frameProps) => {
  // No need to update tab page index if we are given a pinned frame
  if (frameProps.get('pinnedLocation')) {
    return
  }

  const index = FrameStateUtil.getFrameTabPageIndex(windowState.get('frames')
      .filter(frame => !frame.get('pinnedLocation')), frameProps, getSetting(settings.TABS_PER_TAB_PAGE))
  if (index === -1) {
    return
  }
  windowState = windowState.setIn(['ui', 'tabs', 'tabPageIndex'], index)
}

let currentKey = 0
let currentPartitionNumber = 0
const incrementNextKey = () => ++currentKey
const incrementPartitionNumber = () => ++currentPartitionNumber

class WindowStore extends EventEmitter {
  constructor () {
    super()
  }
  getState () {
    return windowState
  }

  getFrameCount () {
    return windowState.get('frames').size
  }

  emitChanges () {
    if (lastEmittedState !== windowState) {
      lastEmittedState = windowState
      this.emit(CHANGE_EVENT)
    }
  }

  addChangeListener (callback) {
    this.on(CHANGE_EVENT, callback)
  }

  removeChangeListener (callback) {
    this.removeListener(CHANGE_EVENT, callback)
  }
}

const windowStore = new WindowStore()
const emitChanges = debounce(windowStore.emitChanges.bind(windowStore), 5)

// Register callback to handle all updates
const doAction = (action) => {
  // console.log(action.actionType, action, windowState.toJS())
  switch (action.actionType) {
    case WindowConstants.WINDOW_SET_STATE:
      windowState = action.windowState
      currentKey = windowState.get('frames').reduce((previousVal, frame) => Math.max(previousVal, frame.get('key')), 0)
      currentPartitionNumber = windowState.get('frames').reduce((previousVal, frame) => Math.max(previousVal, frame.get('partitionNumber')), 0)
      // We should not emit here because the Window already know about the change on startup.
      return
    case WindowConstants.WINDOW_SET_URL:
      // reload if the url is unchanged
      if (FrameStateUtil.getFrameByKey(windowState, action.key).get('src') === action.location) {
        windowState = windowState.mergeIn(frameStatePath(action.key), {
          audioPlaybackActive: false,
          activeShortcut: 'reload'
        })
      } else {
        windowState = windowState.mergeIn(frameStatePath(action.key), {
          src: action.location,
          location: action.location,
          audioPlaybackActive: false,
          icon: undefined,
          // We want theme colors reset here instead of in WINDOW_SET_LOCATION
          // because intra-page navigation would make the tab color
          // blink otherwise.  The theme color will be reset eventually
          // once the page loads anyway though for the case of navigation change
          // without src change.
          themeColor: undefined,
          computedThemeColor: undefined,
          title: ''
        })
        // force a navbar update in case this was called from an app
        // initiated navigation (bookmarks, etc...)
        updateNavBarInput(action.location, frameStatePath(action.key))
      }
      break
    case WindowConstants.WINDOW_SET_LOCATION:
      const key = action.key || windowState.get('activeFrameKey')
      const lastLocation = windowState.getIn(frameStatePath(key).concat(['location']))
      const lastTitle = windowState.getIn(frameStatePath(key).concat(['title']))
      let locationChanged = !action.location || !lastLocation ||
        action.location.split('#')[0] !== lastLocation.split('#')[0]
      windowState = windowState.mergeIn(frameStatePath(key), {
        audioPlaybackActive: false,
        adblock: {},
        trackingProtection: {},
        title: locationChanged ? '' : lastTitle,
        location: action.location
      })
      // include the url fragment when updating navbar input
      if (action.location !== lastLocation) {
        updateNavBarInput(action.location, frameStatePath(key))
      }
      break
    case WindowConstants.WINDOW_SET_NAVBAR_INPUT:
      updateNavBarInput(action.location)
      // Since this value is bound we need to notify the control sync
      windowStore.emitChanges()
      return
    case WindowConstants.WINDOW_SET_FRAME_TITLE:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        title: action.title
      })
      break
    case WindowConstants.WINDOW_SET_FINDBAR_SHOWN:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        findbarShown: action.shown
      })
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        findbarSelected: action.shown
      })
      break
    case WindowConstants.WINDOW_SET_FINDBAR_SELECTED:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        findbarSelected: action.selected
      })
      break
    case WindowConstants.WINDOW_WEBVIEW_LOAD_START:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        loading: true,
        startLoadTime: new Date().getTime(),
        endLoadTime: null
      })
      break
    case WindowConstants.WINDOW_WEBVIEW_LOAD_END:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        loading: false,
        endLoadTime: new Date().getTime()
      })
      break
    case WindowConstants.WINDOW_SET_NAVBAR_FOCUSED:
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'focused']), action.focused)
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'focused']), action.focused)
      // selection should be cleared on blur
      if (!action.focused) {
        windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'selected']), action.false)
      }
      break
    case WindowConstants.WINDOW_NEW_FRAME:
      const nextKey = incrementNextKey()
      let nextPartitionNumber = 0
      if (action.frameOpts.partitionNumber) {
        nextPartitionNumber = action.frameOpts.partitionNumber
        if (currentPartitionNumber < nextPartitionNumber) {
          currentPartitionNumber = nextPartitionNumber
        }
      } else if (action.frameOpts.isPartitioned) {
        nextPartitionNumber = incrementPartitionNumber()
      }
      windowState = windowState.merge(FrameStateUtil.addFrame(windowState.get('frames'), action.frameOpts,
        nextKey, nextPartitionNumber, action.openInForeground ? nextKey : windowState.get('activeFrameKey')))
      if (action.openInForeground) {
        updateTabPageIndex(FrameStateUtil.getActiveFrame(windowState))
      }
      break
    case WindowConstants.WINDOW_CLOSE_FRAME:
      // Use the frameProps we passed in, or default to the active frame
      const frameProps = action.frameProps || FrameStateUtil.getActiveFrame(windowState)
      const closingActive = !action.frameProps || action.frameProps === FrameStateUtil.getActiveFrame(windowState)
      const index = FrameStateUtil.getFramePropsIndex(windowState.get('frames'), frameProps)
      windowState = windowState.merge(FrameStateUtil.removeFrame(windowState.get('frames'),
        windowState.get('closedFrames'), frameProps.set('closedAtIndex', index),
        frameProps.get('key')))
      if (closingActive) {
        updateTabPageIndex(FrameStateUtil.getActiveFrame(windowState))
      }
      break
    case WindowConstants.WINDOW_UNDO_CLOSED_FRAME:
      windowState = windowState.merge(FrameStateUtil.undoCloseFrame(windowState, windowState.get('closedFrames')))
      break
    case WindowConstants.WINDOW_SET_ACTIVE_FRAME:
      windowState = windowState.merge({
        activeFrameKey: action.frameProps.get('key'),
        previewFrameKey: null
      })
      updateTabPageIndex(action.frameProps)
      break
    case WindowConstants.WINDOW_SET_PREVIEW_FRAME:
      windowState = windowState.merge({
        previewFrameKey: action.frameProps && action.frameProps.get('key') !== windowState.get('activeFrameKey')
          ? action.frameProps.get('key') : null
      })
      break
    case WindowConstants.WINDOW_SET_TAB_PAGE_INDEX:
      if (action.index !== undefined) {
        windowState = windowState.setIn(['ui', 'tabs', 'tabPageIndex'], action.index)
      } else {
        updateTabPageIndex(action.frameProps)
      }
      break
    case WindowConstants.WINDOW_UPDATE_BACK_FORWARD:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        canGoBack: action.canGoBack,
        canGoForward: action.canGoForward
      })
      break
    case WindowConstants.WINDOW_SET_IS_BEING_DRAGGED_OVER_DETAIL:
      if (!action.dragOverKey) {
        windowState = windowState.deleteIn(['ui', 'dragging'])
      } else {
        windowState = windowState.mergeIn(['ui', 'dragging', 'draggingOver'], Immutable.fromJS(Object.assign({}, action.dragDetail, { dragOverKey: action.dragOverKey, dragType: action.dragType })))
      }
      break
    case WindowConstants.WINDOW_TAB_MOVE:
      const sourceFramePropsIndex = FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.sourceFrameProps)
      let newIndex = FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.destinationFrameProps) + (action.prepend ? 0 : 1)
      let frames = windowState.get('frames').splice(sourceFramePropsIndex, 1)
      if (newIndex > sourceFramePropsIndex) {
        newIndex--
      }
      frames = frames.splice(newIndex, 0, action.sourceFrameProps)
      windowState = windowState.set('frames', frames)
      // Since the tab could have changed pages, update the tab page as well
      updateTabPageIndex(FrameStateUtil.getActiveFrame(windowState))
      break
    case WindowConstants.WINDOW_SET_LINK_HOVER_PREVIEW:
      windowState = windowState.mergeIn(activeFrameStatePath(), {
        hrefPreview: action.href,
        showOnRight: action.showOnRight
      })
      break
    case WindowConstants.WINDOW_SET_URL_BAR_SUGGESTIONS:
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex']), action.selectedIndex)
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), action.suggestionList)
      break
    case WindowConstants.WINDOW_SET_URL_BAR_PREVIEW:
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'urlPreview']), action.value)
      break
    case WindowConstants.WINDOW_SET_URL_BAR_SUGGESTION_SEARCH_RESULTS:
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'searchResults']), action.searchResults)
      break
    case WindowConstants.WINDOW_SET_THEME_COLOR:
      if (action.themeColor !== undefined) {
        windowState = windowState.setIn(frameStatePathForFrame(action.frameProps).concat(['themeColor']), action.themeColor)
      }
      if (action.computedThemeColor !== undefined) {
        windowState = windowState.setIn(frameStatePathForFrame(action.frameProps).concat(['computedThemeColor']), action.computedThemeColor)
      }
      break
    case WindowConstants.WINDOW_SET_URL_BAR_ACTIVE:
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'active']), action.isActive)
      if (!action.isActive) {
        windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex']), null)
        windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), null)
      }
      break
    case WindowConstants.WINDOW_SET_URL_BAR_SELECTED:
      const urlBarPath = activeFrameStatePath().concat(['navbar', 'urlbar'])
      windowState = windowState.mergeIn(urlBarPath, {
        selected: action.selected
      })
      // selection implies focus
      if (action.selected) {
        windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'focused']), true)
      }
      if (action.forSearchMode !== undefined) {
        windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'searchSuggestions']), action.forSearchMode)
      }
      break
    case WindowConstants.WINDOW_SET_ACTIVE_FRAME_SHORTCUT:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps), 'activeShortcut'], action.activeShortcut)
      break
    case WindowConstants.WINDOW_SET_SEARCH_DETAIL:
      windowState = windowState.merge({
        searchDetail: action.searchDetail
      })
      break
    case WindowConstants.WINDOW_SET_FIND_DETAIL:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps), 'findbarSelected'], false)
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps), 'findDetail'], action.findDetail)
      // Since the input value is bound, we need to notify the control sync.
      windowStore.emitChanges()
      return
    case WindowConstants.WINDOW_SET_BOOKMARK_DETAIL:
      if (!action.currentDetail && !action.originalDetail) {
        windowState = windowState.delete('bookmarkDetail')
      } else {
        windowState = windowState.mergeIn(['bookmarkDetail'], {
          currentDetail: action.currentDetail,
          originalDetail: action.originalDetail,
          destinationDetail: action.destinationDetail
        })
      }
      // Since the input values of bookmarks are bound, we need to notify the controls sync.
      windowStore.emitChanges()
      return
    case WindowConstants.WINDOW_SET_CONTEXT_MENU_DETAIL:
      if (!action.detail) {
        windowState = windowState.delete('contextMenuDetail')
      } else {
        windowState = windowState.set('contextMenuDetail', action.detail)
      }
      // Drag and drop bookmarks code expects this to be set sync
      windowStore.emitChanges()
      return
    case WindowConstants.WINDOW_SET_PINNED:
      // Support lazy obtaining the location via just the key
      let location = action.frameProps.get('location')
      if (!location) {
        const foundFrame = FrameStateUtil.getFrameByKey(windowState, action.frameProps.get('key'))
        if (foundFrame) {
          location = foundFrame.get('location')
        }
      }
      // Check if there's already a frame which is pinned.
      // If so we just want to set it as active.
      const alreadyPinnedFrameProps = windowState.get('frames').find(frame => frame.get('pinnedLocation') && frame.get('pinnedLocation') === location)
      if (alreadyPinnedFrameProps && action.isPinned) {
        action.actionType = WindowConstants.WINDOW_CLOSE_FRAME
        doAction(action)
        action.actionType = WindowConstants.WINDOW_SET_ACTIVE_FRAME
        doAction(action)
      } else {
        windowState = windowState.setIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps), 'pinnedLocation'],
          action.isPinned ? location : undefined)
      }
      // Remove preview frame key when unpinning / pinning
      // becuase it can get messed up.
      windowState = windowState.merge({
        previewFrameKey: null
      })
      // Pin changes need to happen right away or else a race condition could happen for app state
      // change detection where it adds a second frame
      windowStore.emitChanges()
      return
    case WindowConstants.WINDOW_SET_AUDIO_MUTED:
      windowState = windowState.setIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps), 'audioMuted'], action.muted)
      break
    case WindowConstants.WINDOW_SET_AUDIO_PLAYBACK_ACTIVE:
      windowState = windowState.setIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps), 'audioPlaybackActive'], action.audioPlaybackActive)
      break
    case WindowConstants.WINDOW_SET_FAVICON:
      getFavicon(action.frameProps, action.favicon).then(icon => {
        windowState = windowState.setIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps), 'icon'], action.favicon)
      })
      break
    case WindowConstants.WINDOW_SET_MOUSE_IN_TITLEBAR:
      windowState = windowState.setIn(['ui', 'mouseInTitlebar'], action.mouseInTitlebar)
      break
    case WindowConstants.WINDOW_SET_SITE_INFO_VISIBLE:
      windowState = windowState.setIn(['ui', 'siteInfo', 'isVisible'], action.isVisible)
      if (action.expandTrackingProtection !== undefined) {
        windowState = windowState.setIn(['ui', 'siteInfo', 'expandTrackingProtection'], action.expandTrackingProtection)
      }
      if (action.expandAdblock !== undefined) {
        windowState = windowState.setIn(['ui', 'siteInfo', 'expandAdblock'], action.expandAdblock)
      }
      break
    case WindowConstants.WINDOW_SET_RELEASE_NOTES_VISIBLE:
      windowState = windowState.setIn(['ui', 'releaseNotes', 'isVisible'], action.isVisible)
      break
    case WindowConstants.WINDOW_SET_SECURITY_STATE:
      let path = frameStatePathForFrame(action.frameProps)
      if (action.securityState.secure !== undefined) {
        windowState = windowState.setIn(path.concat(['security', 'isSecure']),
                                        action.securityState.secure)
      }
      if (action.securityState.certDetails) {
        windowState = windowState.setIn(path.concat(['security', 'certDetails']),
                                        action.securityState.certDetails)
      }
      break
    case WindowConstants.WINDOW_SET_BLOCKED_BY:
      const blockedByPath = ['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps), action.blockType, 'blocked']
      let blockedBy = windowState.getIn(blockedByPath) || new Immutable.List()
      blockedBy = blockedBy.toSet().add(action.location).toList()
      windowState = windowState.setIn(blockedByPath, blockedBy)
      break
    // Zoom state
    case WindowConstants.WINDOW_ZOOM_IN:
      let zoomInLevel = FrameStateUtil.getFramePropValue(windowState, action.frameProps, 'zoomLevel')
      // for backwards compatibility with previous stored window state
      if (zoomInLevel === undefined) {
        zoomInLevel = 1
      }
      if (config.zoom.max > zoomInLevel) {
        zoomInLevel += 1
      }
      windowState = windowState.setIn(FrameStateUtil.getFramePropPath(windowState, action.frameProps, 'zoomLevel'), zoomInLevel)
      break
    case WindowConstants.WINDOW_ZOOM_OUT:
      let zoomOutLevel = FrameStateUtil.getFramePropValue(windowState, action.frameProps, 'zoomLevel')
      // for backwards compatibility with previous stored window state
      if (zoomOutLevel === undefined) {
        zoomOutLevel = 1
      }
      if (config.zoom.min < zoomOutLevel) {
        zoomOutLevel -= 1
      }
      windowState = windowState.setIn(FrameStateUtil.getFramePropPath(windowState, action.frameProps, 'zoomLevel'), zoomOutLevel)
      break
    case WindowConstants.WINDOW_ZOOM_RESET:
      windowState = windowState.setIn(FrameStateUtil.getFramePropPath(windowState, action.frameProps, 'zoomLevel'), config.zoom.defaultValue)
      break
    default:
  }

  emitChanges()
}

WindowDispatcher.register(doAction)

ipc.on(messages.SHORTCUT_NEXT_TAB, () => {
  windowState = FrameStateUtil.makeNextFrameActive(windowState)
  updateTabPageIndex(FrameStateUtil.getActiveFrame(windowState))
  emitChanges()
})

ipc.on(messages.SHORTCUT_PREV_TAB, () => {
  windowState = FrameStateUtil.makePrevFrameActive(windowState)
  updateTabPageIndex(FrameStateUtil.getActiveFrame(windowState))
  emitChanges()
})

ipc.on(messages.IMPORT_BOOKMARKS, () => {
  const dialog = require('electron').remote.dialog
  const files = dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{
      name: 'HTML',
      extensions: ['html', 'htm']
    }]
  })
  if (files && files.length > 0) {
    const file = files[0]
    importFromHTML(file)
  }
})

const frameShortcuts = ['stop', 'reload', 'zoom-in', 'zoom-out', 'zoom-reset', 'toggle-dev-tools', 'clean-reload', 'view-source', 'mute', 'save', 'print', 'show-findbar']
frameShortcuts.forEach(shortcut => {
  // Listen for actions on the active frame
  ipc.on(`shortcut-active-frame-${shortcut}`, () => {
    windowState = windowState.mergeIn(activeFrameStatePath(), {
      activeShortcut: shortcut
    })
    emitChanges()
  })
  // Listen for actions on frame N
  if (['reload', 'mute'].includes(shortcut)) {
    ipc.on(`shortcut-frame-${shortcut}`, (e, i) => {
      const path = ['frames', FrameStateUtil.findIndexForFrameKey(windowState.get('frames'), i)]
      windowState = windowState.mergeIn(path, {
        activeShortcut: shortcut
      })
      emitChanges()
    })
  }
})

// Allows the parent process to send window level actions
if (process.env.NODE_ENV === 'test') {
  ipc.on('handle-action', (e, action) => {
    action.frameProps = action.frameProps && Immutable.fromJS(action.frameProps)
    doAction(action)
  })
}

module.exports = windowStore
