/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const AppDispatcher = require('../dispatcher/appDispatcher')
const EventEmitter = require('events').EventEmitter
const WindowConstants = require('../constants/windowConstants')
const config = require('../constants/config.js')
const settings = require('../constants/settings')
const Immutable = require('immutable')
const FrameStateUtil = require('../state/frameStateUtil')
const getFavicon = require('../lib/faviconUtil.js')
const ipc = global.require('electron').ipcRenderer
const messages = require('../constants/messages')
const debounce = require('../lib/debounce.js')
const getSetting = require('../settings').getSetting
const importFromHTML = require('../lib/importer').importFromHTML
const UrlUtil = require('../lib/urlutil')
const urlParse = require('url').parse

const { l10nErrorText } = require('../lib/errorUtil')
const { aboutUrls, getSourceAboutUrl, isIntermediateAboutPage, navigatableTypes } = require('../lib/appUrlUtil')
const Serializer = require('../dispatcher/serializer')

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
 * Updates the active frame state with what the URL bar suffix should be.
 * @param suggestionList - The suggestion list to use to figure out the suffix.
 */
const updateUrlSuffix = (suggestionList) => {
  const suggestion = suggestionList && suggestionList.get(0)
  let suffix = ''
  if (suggestion) {
    const selectedIndex = windowState.getIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'selectedIndex']))
    const autocompleteEnabled = windowState.getIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']))
    if (!selectedIndex && autocompleteEnabled) {
      const location = windowState.getIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'location']))
      const index = suggestion.location.toLowerCase().indexOf(location.toLowerCase())
      if (index !== -1) {
        const beforePrefix = suggestion.location.substring(0, index)
        if (beforePrefix.endsWith('://') || beforePrefix.endsWith('://www.') || index === 0) {
          suffix = suggestion.location.substring(index + location.length)
        }
      }
    }
  }
  windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'urlSuffix']), suffix)
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
      .filter((frame) => !frame.get('pinnedLocation')), frameProps, getSetting(settings.TABS_PER_PAGE))
  if (index === -1) {
    return
  }
  windowState = windowState.setIn(['ui', 'tabs', 'tabPageIndex'], index)
}

const focusWebview = (frameStatePath) => {
  windowState = windowState.mergeIn(frameStatePath, {
    activeShortcut: 'focus-webview',
    activeShortcutDetails: null
  })
}

let currentKey = 0
let currentPartitionNumber = 0
const incrementNextKey = () => ++currentKey
const incrementPartitionNumber = () => ++currentPartitionNumber

class WindowStore extends EventEmitter {
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

const addToHistory = (frameProps) => {
  let history = frameProps.get('history') || Immutable.fromJS([])
  if (!aboutUrls.get(frameProps.get('location'))) {
    history = history.push(frameProps.get('location'))
  }
  return history.slice(-10)
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
      const activeFrame = FrameStateUtil.getActiveFrame(windowState)
      if (activeFrame && activeFrame.get('location') !== 'about:newtab') {
        focusWebview(activeFrameStatePath())
      }
      // We should not emit here because the Window already know about the change on startup.
      return
    case WindowConstants.WINDOW_SET_URL:
      const frame = FrameStateUtil.getFrameByKey(windowState, action.key)
      const currentLocation = frame.get('location')
      const parsedUrl = urlParse(action.location)

      // For types that are not navigatable, just do a loadUrl on them
      if (!navigatableTypes.includes(parsedUrl.protocol)) {
        if (parsedUrl.protocol !== 'javascript:' ||
            currentLocation.substring(0, 6).toLowerCase() !== 'about:') {
          windowState = windowState.mergeIn(frameStatePath(action.key), {
            activeShortcut: 'load-non-navigatable-url',
            activeShortcutDetails: action.location
          })
        }
        updateNavBarInput(frame.get('location'), frameStatePath(action.key))
      } else if (currentLocation === action.location) {
        // reload if the url is unchanged
        windowState = windowState.mergeIn(frameStatePath(action.key), {
          audioPlaybackActive: false,
          activeShortcut: 'reload'
        })
      } else {
      // If the user is changing back to the original src and they already navigated away then we need to
      // explicitly set a new location via webview.loadURL.
        let activeShortcut
        if (frame.get('location') !== action.location &&
            frame.get('src') === action.location &&
            !isIntermediateAboutPage(action.location)) {
          activeShortcut = 'explicitLoadURL'
        }

        windowState = windowState.mergeIn(frameStatePath(action.key), {
          src: action.location,
          location: action.location,
          activeShortcut
        })
        // force a navbar update in case this was called from an app
        // initiated navigation (bookmarks, etc...)
        updateNavBarInput(action.location, frameStatePath(action.key))
      }
      break
    case WindowConstants.WINDOW_SET_NAVIGATED:
      action.location = action.location.trim()
      // For about: URLs, make sure we store the URL as about:something
      // and not what we map to.
      action.location = getSourceAboutUrl(action.location) || action.location

      if (UrlUtil.isURL(action.location)) {
        action.location = UrlUtil.getUrlFromInput(action.location)
      }

      const key = action.key || windowState.get('activeFrameKey')
      windowState = windowState.mergeIn(frameStatePath(key), {
        location: action.location
      })
      if (!action.isNavigatedInPage) {
        windowState = windowState.mergeIn(frameStatePath(key), {
          adblock: {},
          audioPlaybackActive: false,
          computedThemeColor: undefined,
          httpsEverywhere: {},
          icon: undefined,
          location: action.location,
          noScript: {},
          themeColor: undefined,
          title: '',
          trackingProtection: {},
          fingerprintingProtection: {}
        })
      }
      updateNavBarInput(action.location, frameStatePath(key))
      break
    case WindowConstants.WINDOW_SET_NAVBAR_INPUT:
      updateNavBarInput(action.location)
      updateUrlSuffix(windowState.getIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), action.suggestionList))
      // Since this value is bound we need to notify the control sync
      windowStore.emitChanges()
      return
    case WindowConstants.WINDOW_SET_FRAME_TAB_ID:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        tabId: action.tabId
      })
      break
    case WindowConstants.WINDOW_SET_FRAME_ERROR:
      const frameKey = action.frameProps.get('key')
      // set the previous location to the most recent history item or the default url
      let previousLocation = action.frameProps.get('history').unshift(config.defaultUrl).findLast((url) => url !== action.errorDetails.url)

      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        aboutDetails: Object.assign({
          title: action.errorDetails.title || l10nErrorText(action.errorDetails.errorCode),
          message: action.errorDetails.message,
          previousLocation,
          frameKey
        }, action.errorDetails)
      })
      break
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
        provisionalLocation: action.location,
        startLoadTime: new Date().getTime(),
        endLoadTime: null
      })
      break
    case WindowConstants.WINDOW_WEBVIEW_LOAD_END:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        loading: false,
        endLoadTime: new Date().getTime(),
        history: addToHistory(action.frameProps)
      })
      break
    case WindowConstants.WINDOW_SET_FULL_SCREEN:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        isFullScreen: action.isFullScreen !== undefined ? action.isFullScreen : windowState.getIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)].concat('isFullScreen')),
        showFullScreenWarning: action.showFullScreenWarning
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
      if (action.frameOpts === undefined) {
        action.frameOpts = {}
      }
      if (action.openInForeground === undefined) {
        action.openInForeground = true
      }
      action.frameOpts.location = action.frameOpts.location || config.defaultUrl
      if (action.frameOpts.location && UrlUtil.isURL(action.frameOpts.location)) {
        action.frameOpts.location = UrlUtil.getUrlFromInput(action.frameOpts.location)
      } else {
        const defaultURL = windowStore.getState().getIn(['searchDetail', 'searchURL'])
        if (defaultURL) {
          action.frameOpts.location = defaultURL
            .replace('{searchTerms}', encodeURIComponent(action.frameOpts.location))
        } else {
          // Bad URLs passed here can actually crash the browser
          action.frameOpts.location = ''
        }
      }

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
      if (action.frameOpts.location && UrlUtil.isFileType(action.frameOpts.location, 'pdf')) {
        // Workaround #2427
        action.frameOpts.location = 'chrome-extension://adnmjfhcejodgpaljdmlmjoclihpcfka/' + action.frameOpts.location
      }
      windowState = windowState.merge(FrameStateUtil.addFrame(windowState.get('frames'), action.frameOpts,
        nextKey, nextPartitionNumber, action.openInForeground ? nextKey : windowState.get('activeFrameKey')))
      if (action.openInForeground) {
        const activeFrame = FrameStateUtil.getActiveFrame(windowState)
        updateTabPageIndex(activeFrame)
        // For about:newtab we want to have the urlbar focused, not the new frame.
        // Otherwise we want to focus the new tab when it is a new frame in the foreground.
        if (activeFrame.get('location') !== 'about:newtab') {
          focusWebview(activeFrameStatePath())
        }
      }
      break
    case WindowConstants.WINDOW_CLOSE_FRAME:
      const currentWindow = require('electron').remote.getCurrentWindow()
      if (currentWindow && currentWindow.isFullScreen()) {
        currentWindow.setFullScreen(false)
      }
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
      focusWebview(activeFrameStatePath())
      break
    case WindowConstants.WINDOW_SET_ACTIVE_FRAME:
      if (!action.frameProps) {
        break
      }
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
      if (action.suggestionList !== undefined) {
        windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'suggestionList']), action.suggestionList)
      }
      updateUrlSuffix(action.suggestionList)
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
        windowState = windowState.mergeIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions']), {
          selectedIndex: null,
          suggestionList: null
        })
      }
      break
    case WindowConstants.WINDOW_SET_URL_BAR_AUTCOMPLETE_ENABLED:
      windowState = windowState.setIn(activeFrameStatePath().concat(['navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']), action.enabled)
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
      break
    case WindowConstants.WINDOW_SET_ACTIVE_FRAME_SHORTCUT:
      const framePath = action.frameProps ? ['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)] : activeFrameStatePath()
      windowState = windowState.mergeIn(framePath, {
        activeShortcut: action.activeShortcut,
        activeShortcutDetails: action.activeShortcutDetails
      })
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
    case WindowConstants.WINDOW_SET_POPUP_WINDOW_DETAIL:
      if (!action.detail) {
        windowState = windowState.delete('popupWindowDetail')
      } else {
        windowState = windowState.set('popupWindowDetail', action.detail)
      }
      // Drag and drop bookmarks code expects this to be set sync
      windowStore.emitChanges()
      return
    case WindowConstants.WINDOW_SET_PINNED:
      // Check if there's already a frame which is pinned.
      // If so we just want to set it as active.
      const location = action.frameProps.get('location')
      const alreadyPinnedFrameProps = windowState.get('frames').find((frame) => frame.get('pinnedLocation') && frame.get('pinnedLocation') === location)
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
      getFavicon(action.frameProps, action.favicon).then((icon) => {
        windowState = windowState.setIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps), 'icon'], action.favicon)
      })
      break
    case WindowConstants.WINDOW_SET_MAXIMIZE_STATE:
      windowState = windowState.setIn(['ui', 'isMaximized'], action.isMaximized)
      break
    case WindowConstants.WINDOW_SAVE_POSITION:
      windowState = windowState.setIn(['ui', 'position'], action.position)
      break
    case WindowConstants.WINDOW_SET_FULLSCREEN_STATE:
      windowState = windowState.setIn(['ui', 'isFullScreen'], action.isFullScreen)
      break
    case WindowConstants.WINDOW_SET_MOUSE_IN_TITLEBAR:
      windowState = windowState.setIn(['ui', 'mouseInTitlebar'], action.mouseInTitlebar)
      break
    case WindowConstants.WINDOW_SET_NOSCRIPT_VISIBLE:
      windowState = windowState.setIn(['ui', 'noScriptInfo', 'isVisible'], action.isVisible)
      break
    case WindowConstants.WINDOW_SET_SITE_INFO_VISIBLE:
      windowState = windowState.setIn(['ui', 'siteInfo', 'isVisible'], action.isVisible)
      break
    case WindowConstants.WINDOW_SET_BRAVERY_PANEL_DETAIL:
      if (!action.braveryPanelDetail) {
        windowState = windowState.delete('braveryPanelDetail')
      } else {
        windowState = windowState.mergeIn(['braveryPanelDetail'], {
          advancedControls: action.braveryPanelDetail.advancedControls,
          expandAdblock: action.braveryPanelDetail.expandAdblock,
          expandHttpse: action.braveryPanelDetail.expandHttpse,
          expandNoScript: action.braveryPanelDetail.expandNoScript,
          expandFp: action.braveryPanelDetail.expandFp
        })
      }
      break
    case WindowConstants.WINDOW_SET_DOWNLOADS_TOOLBAR_VISIBLE:
      windowState = windowState.setIn(['ui', 'downloadsToolbar', 'isVisible'], action.isVisible)
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
    case WindowConstants.WINDOW_SET_LOGIN_REQUIRED_DETAIL:
      if (action.detail) {
        windowState = windowState.setIn(frameStatePathForFrame(action.frameProps).concat(['security', 'loginRequiredDetail']), action.detail)
      } else {
        windowState = windowState.deleteIn(frameStatePathForFrame(action.frameProps).concat(['security', 'loginRequiredDetail']))
      }
      break
    case WindowConstants.WINDOW_SET_BLOCKED_BY:
      const blockedByPath = ['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps), action.blockType, 'blocked']
      let blockedBy = windowState.getIn(blockedByPath) || new Immutable.List()
      blockedBy = blockedBy.toSet().add(action.location).toList()
      windowState = windowState.setIn(blockedByPath, blockedBy)
      break
    case WindowConstants.WINDOW_SET_REDIRECTED_BY:
      const redirectedByPath = ['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps), 'httpsEverywhere', action.ruleset]
      let redirectedBy = windowState.getIn(redirectedByPath) || new Immutable.List()
      windowState = windowState.setIn(redirectedByPath, redirectedBy.push(action.location))
      break
    case WindowConstants.WINDOW_ADD_HISTORY:
      windowState = windowState.mergeIn(['frames', FrameStateUtil.getFramePropsIndex(windowState.get('frames'), action.frameProps)], {
        history: addToHistory(action.frameProps)
      })
      break
    default:
  }

  emitChanges()
}

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

const frameShortcuts = ['stop', 'reload', 'zoom-in', 'zoom-out', 'zoom-reset', 'toggle-dev-tools', 'clean-reload', 'view-source', 'mute', 'save', 'print', 'show-findbar', 'copy', 'find-next', 'find-prev']
frameShortcuts.forEach((shortcut) => {
  // Listen for actions on the active frame
  ipc.on(`shortcut-active-frame-${shortcut}`, () => {
    windowState = windowState.mergeIn(activeFrameStatePath(), {
      activeShortcut: shortcut,
      activeShortcutDetails: null
    })
    emitChanges()
  })
  // Listen for actions on frame N
  if (['reload', 'mute'].includes(shortcut)) {
    ipc.on(`shortcut-frame-${shortcut}`, (e, i) => {
      const path = ['frames', FrameStateUtil.findIndexForFrameKey(windowState.get('frames'), i)]
      windowState = windowState.mergeIn(path, {
        activeShortcut: shortcut,
        activeShortcutDetails: null
      })
      emitChanges()
    })
  }
})

// Allows the parent process to dispatch window actions
ipc.on(messages.DISPATCH_ACTION, (e, serializedPayload) => {
  let action = Serializer.deserialize(serializedPayload)
  let queryInfo = action.queryInfo || action.frameProps || {}
  queryInfo = queryInfo.toJS ? queryInfo.toJS() : queryInfo
  let win = require('electron').remote.getCurrentWindow()
  if (queryInfo.windowId === -2 && win.isFocused()) {
    queryInfo.windowId = win.id
  }
  // handle any ipc dispatches that are targeted to this window
  if (queryInfo.windowId && queryInfo.windowId === win.id) {
    doAction(action)
  }
})

AppDispatcher.register(doAction)

module.exports = windowStore
