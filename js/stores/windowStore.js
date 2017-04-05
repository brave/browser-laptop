/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const AppDispatcher = require('../dispatcher/appDispatcher')
const EventEmitter = require('events').EventEmitter
const appActions = require('../actions/appActions')
const appConstants = require('../constants/appConstants')
const windowConstants = require('../constants/windowConstants')
const config = require('../constants/config')
const settings = require('../constants/settings')
const Immutable = require('immutable')
const frameStateUtil = require('../state/frameStateUtil')
const {activeFrameStatePath, frameStatePathForFrame, tabStatePathForFrame} = frameStateUtil
const ipc = require('electron').ipcRenderer
const messages = require('../constants/messages')
const debounce = require('../lib/debounce')
const getSetting = require('../settings').getSetting
const UrlUtil = require('../lib/urlutil')
const {currentWindowId, isFocused} = require('../../app/renderer/currentWindow')
const {tabFromFrame} = require('../state/frameStateUtil')
const {l10nErrorText} = require('../../app/common/lib/httpUtil')
const { makeImmutable } = require('../../app/common/state/immutableUtil')
const {aboutUrls, getTargetAboutUrl, newFrameUrl} = require('../lib/appUrlUtil')
const Serializer = require('../dispatcher/serializer')
const {updateTabPageIndex} = require('../../app/renderer/lib/tabUtil')
const assert = require('assert')

let windowState = Immutable.fromJS({
  activeFrameKey: null,
  frames: [],
  tabs: [],
  closedFrames: [],
  ui: {
    tabs: {
    },
    mouseInTitlebar: false,
    menubar: {
    }
  },
  searchDetail: null
})
let lastEmittedState

const CHANGE_EVENT = 'change'

const focusWebview = (framePath) => {
  windowState = windowState.mergeIn(framePath, {
    activeShortcut: 'focus-webview',
    activeShortcutDetails: null
  })
}

let currentKey = 0
const incrementNextKey = () => ++currentKey

class WindowStore extends EventEmitter {
  getState () {
    return windowState
  }

  get state () {
    return windowState
  }

  getFrames () {
    return frameStateUtil.getFrames(this.state)
  }

  getFrame (key) {
    return frameStateUtil.getFrameByKey(windowState, key)
  }

  getFrameCount () {
    return this.getFrames().size
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

const newFrame = (frameOpts, openInForeground, insertionIndex, nextKey) => {
  if (frameOpts === undefined) {
    frameOpts = {}
  }
  frameOpts = frameOpts.toJS ? frameOpts.toJS() : frameOpts

  // handle tabs.create properties
  insertionIndex = frameOpts.index !== undefined
    ? frameOpts.index
    : insertionIndex

  if (frameOpts.partition) {
    frameOpts.isPrivate = frameStateUtil.isPrivatePartition(frameOpts.partition)
    if (frameStateUtil.isSessionPartition(frameOpts.partition)) {
      frameOpts.partitionNumber = frameStateUtil.getPartitionNumber(frameOpts.partition)
    }
  }
  frameOpts.partitionNumber = frameOpts.partitionNumber || 0

  if (frameOpts.disposition) {
    openInForeground = frameOpts.disposition !== 'background-tab'
  }

  if (openInForeground === undefined) {
    openInForeground = true
  }

  // evaluate the location
  frameOpts.location = frameOpts.location || newFrameUrl()
  if (frameOpts.location && UrlUtil.isURL(frameOpts.location)) {
    frameOpts.location = UrlUtil.getUrlFromInput(frameOpts.location)
  } else {
    // location is a search
    const defaultURL = windowStore.getState().getIn(['searchDetail', 'searchURL'])
    if (defaultURL) {
      frameOpts.location = defaultURL
        .replace('{searchTerms}', encodeURIComponent(frameOpts.location))
    } else {
      // Bad URLs passed here can actually crash the browser
      frameOpts.location = ''
    }
  }

  // TODO: longer term get rid of parentFrameKey completely instead of
  // calculating it here.
  let parentFrameKey = frameOpts.parentFrameKey
  if (frameOpts.openerTabId) {
    parentFrameKey = frameStateUtil.getFrameKeyByTabId(windowState, frameOpts.openerTabId)
  }

  // Find the closest index to the current frame's index which has
  // a different ancestor frame key.
  const frames = frameStateUtil.getFrames(windowState)
  if (insertionIndex === undefined) {
    insertionIndex = frameStateUtil.findIndexForFrameKey(frames, parentFrameKey || frameOpts.indexByFrameKey)
    if (insertionIndex === -1) {
      insertionIndex = frames.size
    // frameOpts.indexByFrameKey is used when the insertionIndex should be used exactly
    } else if (!frameOpts.indexByFrameKey) {
      while (insertionIndex < frames.size) {
        ++insertionIndex
        if (!frameStateUtil.isAncestorFrameKey(frames, frames.get(insertionIndex), parentFrameKey)) {
          break
        }
      }
    }
  }
  if (frameStateUtil.isFrameKeyPinned(frames, parentFrameKey)) {
    insertionIndex = 0
  }

  if (nextKey === undefined) {
    nextKey = incrementNextKey()
  }

  windowState = windowState.merge(
    frameStateUtil.addFrame(
      windowState, windowState.get('tabs'), frameOpts,
      nextKey, frameOpts.partitionNumber, openInForeground || typeof windowState.get('activeFrameKey') !== 'number' ? nextKey : windowState.get('activeFrameKey'), insertionIndex))

  if (openInForeground) {
    const activeFrame = frameStateUtil.getActiveFrame(windowState)
    windowState = updateTabPageIndex(windowState, activeFrame)
  }
}

const frameTabIdChanged = (state, action) => {
  action = makeImmutable(action)
  const oldTabId = action.get('oldTabId')
  const newTabId = action.get('newTabId')
  if (newTabId == null || oldTabId === newTabId) {
    return state
  }

  let newFrameProps = new Immutable.Map()
  // TODO(bridiver) - use for pinned tab transfer
  // if (oldTabId != null && oldTabId !== -1) {
  //   let tab = appStoreRenderer.state.get('tabs').find((tab) => tab.get('tabId') === newTabId)
  //   if (tab.get('pinned')) {
  //     newFrameProps = frameStateUtil.restoreFramePropsFromTab(tab)
  //   }
  // }
  newFrameProps = newFrameProps.set('tabId', newTabId)
  return state.mergeIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(state), action.get('frameProps'))], newFrameProps)
}

const frameGuestInstanceIdChanged = (state, action) => {
  action = makeImmutable(action)
  const oldGuestInstanceId = action.get('oldGuestInstanceId')
  const newGuestInstanceId = action.get('newGuestInstanceId')

  if (oldGuestInstanceId === newGuestInstanceId) {
    return state
  }

  return state.mergeIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(state), action.get('frameProps'))], {
    guestInstanceId: newGuestInstanceId
  })
}

const tabDataChanged = (state, action) => {
  action = makeImmutable(action)
  const tabData = action.get('tabData')
  const frameProps = action.get('frameProps')

  const newProps = frameStateUtil.getFramePropsFromTab(tabData)
  state = state.mergeIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(state), frameProps)], newProps)
  state = state.mergeIn(['tabs', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(state), frameProps)], newProps)

  return state
}

const windowStore = new WindowStore()
const emitChanges = debounce(windowStore.emitChanges.bind(windowStore), 5)

const applyReducers = (state, action) => [
  require('../../app/renderer/reducers/urlBarReducer'),
  require('../../app/renderer/reducers/urlBarSuggestionsReducer'),
  require('../../app/renderer/reducers/frameReducer')
].reduce(
    (windowState, reducer) => {
      const newState = reducer(windowState, action)
      assert.ok(Immutable.Map.isMap(newState),
        `Oops! action ${action.actionType} didn't return valid state for reducer:\n\n${reducer}`)
      return newState
    }, windowState)

const immediatelyEmittedActions = [
  windowConstants.WINDOW_SET_NAVBAR_INPUT,
  windowConstants.WINDOW_SET_FIND_DETAIL,
  windowConstants.WINDOW_SET_BOOKMARK_DETAIL,
  windowConstants.WINDOW_AUTOFILL_POPUP_HIDDEN,
  windowConstants.WINDOW_SET_CONTEXT_MENU_DETAIL,
  windowConstants.WINDOW_SET_POPUP_WINDOW_DETAIL,
  windowConstants.WINDOW_SET_AUTOFILL_ADDRESS_DETAIL,
  windowConstants.WINDOW_SET_AUTOFILL_CREDIT_CARD_DETAIL,
  windowConstants.WINDOW_SET_MODAL_DIALOG_DETAIL
]

// Register callback to handle all updates
const doAction = (action) => {
  // console.log(action.actionType, action, windowState.toJS())
  windowState = applyReducers(windowState, action)
  switch (action.actionType) {
    case windowConstants.WINDOW_SET_STATE:
      windowState = action.windowState
      currentKey = frameStateUtil.getFrames(windowState).reduce((previousVal, frame) => Math.max(previousVal, frame.get('key')), 0)
      const activeFrame = frameStateUtil.getActiveFrame(windowState)
      if (activeFrame && activeFrame.get('location') !== 'about:newtab') {
        focusWebview(activeFrameStatePath(windowState))
      }
      // We should not emit here because the Window already know about the change on startup.
      return
    case windowConstants.WINDOW_FRAME_TAB_ID_CHANGED:
      windowState = frameTabIdChanged(windowState, action)
      break
    case windowConstants.WINDOW_FRAME_GUEST_INSTANCE_ID_CHANGED:
      windowState = frameGuestInstanceIdChanged(windowState, action)
      break
    case windowConstants.WINDOW_SET_FRAME_ERROR:
      const frameKey = action.frameProps.get('key')
      // set the previous location to the most recent history item or the default url
      let previousLocation = action.frameProps.get('history').unshift(config.defaultUrl).findLast((url) => url !== action.errorDetails.url)

      windowState = windowState.mergeIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps)], {
        aboutDetails: Object.assign({
          title: action.errorDetails.title || l10nErrorText(action.errorDetails.errorCode),
          message: action.errorDetails.message,
          previousLocation,
          frameKey
        }, action.errorDetails)
      })
      break
    case windowConstants.WINDOW_SET_FINDBAR_SHOWN:
      windowState = windowState.mergeIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps)], {
        findbarShown: action.shown
      })
      windowState = windowState.mergeIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps)], {
        findbarSelected: action.shown
      })
      break
    case windowConstants.WINDOW_SET_FINDBAR_SELECTED:
      windowState = windowState.mergeIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps)], {
        findbarSelected: action.selected
      })
      break
    case windowConstants.WINDOW_WEBVIEW_LOAD_START:
      windowState = windowState.mergeIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps)], {
        loading: true,
        provisionalLocation: action.location,
        startLoadTime: new Date().getTime(),
        endLoadTime: null
      })
      windowState = windowState.mergeIn(['tabs', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps)], {
        loading: true,
        provisionalLocation: action.location
      })
      // For about:newtab we want to have the urlbar focused, not the new frame.
      // Otherwise we want to focus the new tab when it is a new frame in the foreground.
      if (action.location !== getTargetAboutUrl('about:newtab')) {
        focusWebview(activeFrameStatePath(windowState))
      }
      break
    case windowConstants.WINDOW_WEBVIEW_LOAD_END:
      windowState = windowState.mergeIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps)], {
        loading: false,
        endLoadTime: new Date().getTime(),
        history: addToHistory(action.frameProps)
      })
      windowState = windowState.mergeIn(['tabs', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps)], {
        loading: false
      })
      break
    case windowConstants.WINDOW_UNLOADED_TAB_CREATED:
      action.frameOpts.unloaded = true
      newFrame(action.frameOpts, action.openInForeground)
      break
    case windowConstants.WINDOW_UNDO_CLOSED_FRAME:
      windowState = windowState.merge(frameStateUtil.undoCloseFrame(windowState, windowState.get('closedFrames')))
      focusWebview(activeFrameStatePath(windowState))
      break
    case windowConstants.WINDOW_CLEAR_CLOSED_FRAMES:
      windowState = windowState.set('closedFrames', new Immutable.List())
      break
    case windowConstants.WINDOW_SET_ACTIVE_FRAME:
      if (!action.frameProps) {
        break
      }
      windowState = windowState.merge({
        activeFrameKey: action.frameProps.get('key'),
        previewFrameKey: null
      })
      windowState = windowState.mergeIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps)], {
        lastAccessedTime: new Date().getTime() })
      windowState = windowState.deleteIn(['ui', 'tabs', 'previewTabPageIndex'])
      windowState = updateTabPageIndex(windowState, action.frameProps)
      break
    case windowConstants.WINDOW_SET_PREVIEW_FRAME:
      windowState = windowState.merge({
        previewFrameKey: action.frameProps && action.frameProps.get('key') !== windowState.get('activeFrameKey')
          ? action.frameProps.get('key') : null
      })
      break
    case windowConstants.WINDOW_SET_PREVIEW_TAB_PAGE_INDEX:
      if (action.previewTabPageIndex !== windowState.getIn(['ui', 'tabs', 'tabPageIndex'])) {
        windowState = windowState.setIn(['ui', 'tabs', 'previewTabPageIndex'], action.previewTabPageIndex)
      } else {
        windowState = windowState.deleteIn(['ui', 'tabs', 'previewTabPageIndex'])
      }
      break
    case windowConstants.WINDOW_SET_TAB_PAGE_INDEX:
      if (action.index !== undefined) {
        windowState = windowState.setIn(['ui', 'tabs', 'tabPageIndex'], action.index)
        windowState = windowState.deleteIn(['ui', 'tabs', 'previewTabPageIndex'])
      } else {
        windowState = updateTabPageIndex(windowState, action.frameProps)
      }
      break
    case windowConstants.WINDOW_SET_TAB_BREAKPOINT:
      windowState = windowState.setIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), 'breakpoint'], action.breakpoint)
      windowState = windowState.setIn(['tabs', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), 'breakpoint'], action.breakpoint)
      break
    case windowConstants.WINDOW_SET_TAB_HOVER_STATE:
      windowState = windowState.setIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), 'hoverState'], action.hoverState)
      windowState = windowState.setIn(['tabs', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), 'hoverState'], action.hoverState)
      break
    case windowConstants.WINDOW_TAB_MOVE:
      const sourceFramePropsIndex = frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.sourceFrameProps)
      let newIndex = frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.destinationFrameProps) + (action.prepend ? 0 : 1)
      let frames = frameStateUtil.getFrames(windowState).splice(sourceFramePropsIndex, 1)
      let tabs = windowState.get('tabs').splice(sourceFramePropsIndex, 1)
      if (newIndex > sourceFramePropsIndex) {
        newIndex--
      }
      frames = frames.splice(newIndex, 0, action.sourceFrameProps)
      tabs = tabs.splice(newIndex, 0, tabFromFrame(action.sourceFrameProps))
      windowState = windowState.set('frames', frames)
      windowState = windowState.set('tabs', tabs)
      // Since the tab could have changed pages, update the tab page as well
      windowState = updateTabPageIndex(windowState, frameStateUtil.getActiveFrame(windowState))
      break
    case windowConstants.WINDOW_SET_LINK_HOVER_PREVIEW:
      windowState = windowState.mergeIn(activeFrameStatePath(windowState), {
        hrefPreview: action.href,
        showOnRight: action.showOnRight
      })
      break
    case windowConstants.WINDOW_SET_THEME_COLOR:
      if (action.themeColor !== undefined) {
        windowState = windowState.setIn(frameStatePathForFrame(windowState, action.frameProps).concat(['themeColor']), action.themeColor)
        windowState = windowState.setIn(tabStatePathForFrame(windowState, action.frameProps).concat(['themeColor']), action.themeColor)
      }
      if (action.computedThemeColor !== undefined) {
        windowState = windowState.setIn(frameStatePathForFrame(windowState, action.frameProps).concat(['computedThemeColor']), action.computedThemeColor)
        windowState = windowState.setIn(tabStatePathForFrame(windowState, action.frameProps).concat(['computedThemeColor']), action.computedThemeColor)
      }
      break
    case windowConstants.WINDOW_SET_URL_BAR_FOCUSED:
      windowState = windowState.setIn(activeFrameStatePath(windowState).concat(['navbar', 'urlbar', 'focused']), action.isFocused)
      break
    case windowConstants.WINDOW_SET_URL_BAR_SELECTED:
      const urlBarPath = activeFrameStatePath(windowState).concat(['navbar', 'urlbar'])
      windowState = windowState.mergeIn(urlBarPath, {
        selected: action.selected
      })
      // selection implies focus
      if (action.selected) {
        windowState = windowState.setIn(activeFrameStatePath(windowState).concat(['navbar', 'urlbar', 'focused']), true)
      }
      break
    case windowConstants.WINDOW_FRAME_SHORTCUT_CHANGED:
      const framePath = action.frameProps ? ['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps)] : activeFrameStatePath(windowState)
      windowState = windowState.mergeIn(framePath, {
        activeShortcut: action.activeShortcut,
        activeShortcutDetails: action.activeShortcutDetails
      })
      break
    case windowConstants.WINDOW_SET_SEARCH_DETAIL:
      windowState = windowState.merge({
        searchDetail: action.searchDetail
      })
      break
    case windowConstants.WINDOW_SET_FIND_DETAIL:
      windowState = windowState.mergeIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), 'findDetail'], action.findDetail)
      break
    case windowConstants.WINDOW_SET_BOOKMARK_DETAIL:
      if (!action.currentDetail && !action.originalDetail) {
        windowState = windowState.delete('bookmarkDetail')
      } else {
        windowState = windowState.mergeIn(['bookmarkDetail'], {
          currentDetail: action.currentDetail,
          originalDetail: action.originalDetail,
          destinationDetail: action.destinationDetail,
          shouldShowLocation: action.shouldShowLocation,
          isBookmarkHanger: action.isBookmarkHanger
        })
      }
      break
    case windowConstants.WINDOW_AUTOFILL_SELECTION_CLICKED:
      ipc.send('autofill-selection-clicked', action.tabId, action.value, action.frontEndId, action.index)
      windowState = windowState.delete('contextMenuDetail')
      break
    case windowConstants.WINDOW_AUTOFILL_POPUP_HIDDEN:
      if (!action.detail &&
          windowState.getIn(['contextMenuDetail', 'type']) === 'autofill' &&
          windowState.getIn(['contextMenuDetail', 'tabId']) === action.tabId) {
        windowState = windowState.delete('contextMenuDetail')
        if (action.notify) {
          ipc.send('autofill-popup-hidden', action.tabId)
        }
      }
      break
    case windowConstants.WINDOW_SET_CONTEXT_MENU_DETAIL:
      if (!action.detail) {
        if (windowState.getIn(['contextMenuDetail', 'type']) === 'hamburgerMenu') {
          windowState = windowState.set('hamburgerMenuWasOpen', true)
        } else {
          windowState = windowState.set('hamburgerMenuWasOpen', false)
        }
        windowState = windowState.delete('contextMenuDetail')
      } else {
        if (!(action.detail.get('type') === 'hamburgerMenu' && windowState.get('hamburgerMenuWasOpen'))) {
          windowState = windowState.set('contextMenuDetail', action.detail)
        }
        windowState = windowState.set('hamburgerMenuWasOpen', false)
      }
      break
    case windowConstants.WINDOW_SET_POPUP_WINDOW_DETAIL:
      if (!action.detail) {
        windowState = windowState.delete('popupWindowDetail')
      } else {
        windowState = windowState.set('popupWindowDetail', action.detail)
      }
      break
    case windowConstants.WINDOW_SET_AUDIO_MUTED:
      windowState = windowState.setIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), 'audioMuted'], action.muted)
      windowState = windowState.setIn(['tabs', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), 'audioMuted'], action.muted)
      break
    case windowConstants.WINDOW_SET_AUDIO_PLAYBACK_ACTIVE:
      windowState = windowState.setIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), 'audioPlaybackActive'], action.audioPlaybackActive)
      windowState = windowState.setIn(['tabs', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), 'audioPlaybackActive'], action.audioPlaybackActive)
      break
    case windowConstants.WINDOW_SET_FAVICON:
      windowState = windowState.setIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), 'icon'], action.favicon)
      windowState = windowState.setIn(['tabs', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), 'icon'], action.favicon)
      break
    case windowConstants.WINDOW_SET_LAST_ZOOM_PERCENTAGE:
      windowState = windowState.setIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), 'lastZoomPercentage'], action.percentage)
      break
    case windowConstants.WINDOW_SET_MAXIMIZE_STATE:
      windowState = windowState.setIn(['ui', 'isMaximized'], action.isMaximized)
      break
    case windowConstants.WINDOW_SAVE_POSITION:
      windowState = windowState.setIn(['ui', 'position'], action.position)
      break
    case windowConstants.WINDOW_SAVE_SIZE:
      windowState = windowState.setIn(['ui', 'size'], action.size)
      break
    case windowConstants.WINDOW_SET_FULLSCREEN_STATE:
      windowState = windowState.setIn(['ui', 'isFullScreen'], action.isFullScreen)
      break
    case windowConstants.WINDOW_SET_MOUSE_IN_TITLEBAR:
      windowState = windowState.setIn(['ui', 'mouseInTitlebar'], action.mouseInTitlebar)
      break
    case windowConstants.WINDOW_SET_NOSCRIPT_VISIBLE:
      windowState = windowState.setIn(['ui', 'noScriptInfo', 'isVisible'], action.isVisible)
      break
    case windowConstants.WINDOW_SET_SITE_INFO_VISIBLE:
      windowState = windowState.setIn(['ui', 'siteInfo', 'isVisible'], action.isVisible)
      break
    case windowConstants.WINDOW_SET_BRAVERY_PANEL_DETAIL:
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
    case windowConstants.WINDOW_SET_CLEAR_BROWSING_DATA_VISIBLE:
      windowState = windowState.setIn(['ui', 'isClearBrowsingDataPanelVisible'], action.isVisible)
      break
    case windowConstants.WINDOW_SET_IMPORT_BROWSER_DATA_DETAIL:
      if (!action.importBrowserDataDetail) {
        windowState = windowState.delete('importBrowserDataDetail')
      } else {
        windowState = windowState.set('importBrowserDataDetail', Immutable.fromJS(action.importBrowserDataDetail))
      }
      break
    case windowConstants.WINDOW_SET_IMPORT_BROWSER_DATA_SELECTED:
      if (!action.selected) {
        windowState = windowState.delete('importBrowserDataSelected')
      } else {
        windowState = windowState.set('importBrowserDataSelected', Immutable.fromJS(action.selected))
      }
      break
    case windowConstants.WINDOW_WIDEVINE_PANEL_DETAIL_CHANGED:
      if (!action.widevinePanelDetail) {
        windowState = windowState.delete('widevinePanelDetail')
      } else {
        windowState = windowState.mergeIn(['widevinePanelDetail'], Immutable.fromJS(action.widevinePanelDetail))
      }
      break
    case windowConstants.WINDOW_WIDEVINE_SITE_ACCESSED_WITHOUT_INSTALL:
      const activeLocation = windowState.getIn(activeFrameStatePath(windowState).concat(['location']))
      windowState = windowState.set('widevinePanelDetail', Immutable.Map({
        alsoAddRememberSiteSetting: true,
        location: activeLocation,
        shown: true
      }))
      break
    case windowConstants.WINDOW_SET_AUTOFILL_ADDRESS_DETAIL:
      if (!action.currentDetail && !action.originalDetail) {
        windowState = windowState.delete('autofillAddressDetail')
      } else {
        windowState = windowState.mergeIn(['autofillAddressDetail'], {
          currentDetail: action.currentDetail,
          originalDetail: action.originalDetail
        })
      }
      break
    case windowConstants.WINDOW_SET_AUTOFILL_CREDIT_CARD_DETAIL:
      if (!action.currentDetail && !action.originalDetail) {
        windowState = windowState.delete('autofillCreditCardDetail')
      } else {
        windowState = windowState.mergeIn(['autofillCreditCardDetail'], {
          currentDetail: action.currentDetail,
          originalDetail: action.originalDetail
        })
      }
      break
    case windowConstants.WINDOW_SET_DOWNLOADS_TOOLBAR_VISIBLE:
      windowState = windowState.setIn(['ui', 'downloadsToolbar', 'isVisible'], action.isVisible)
      break
    case windowConstants.WINDOW_SET_RELEASE_NOTES_VISIBLE:
      windowState = windowState.setIn(['ui', 'releaseNotes', 'isVisible'], action.isVisible)
      break
    case windowConstants.WINDOW_SET_SECURITY_STATE:
      let path = frameStatePathForFrame(windowState, action.frameProps)
      if (action.securityState.secure !== undefined) {
        windowState = windowState.setIn(path.concat(['security', 'isSecure']),
                                        action.securityState.secure)
      }
      if (action.securityState.runInsecureContent !== undefined) {
        windowState = windowState.setIn(path.concat(['security', 'runInsecureContent']),
                                        action.securityState.runInsecureContent)
      }
      if (action.securityState.certDetails) {
        windowState = windowState.setIn(path.concat(['security', 'certDetails']),
                                        action.securityState.certDetails)
      }
      break
    case windowConstants.WINDOW_SET_BLOCKED_BY:
      const blockedByPath = ['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), action.blockType, 'blocked']
      let blockedBy = windowState.getIn(blockedByPath) || new Immutable.List()
      blockedBy = blockedBy.toSet().add(action.location).toList()
      windowState = windowState.setIn(blockedByPath, blockedBy)
      break
    case windowConstants.WINDOW_SET_REDIRECTED_BY:
      const redirectedByPath = ['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps), 'httpsEverywhere', action.ruleset]
      let redirectedBy = windowState.getIn(redirectedByPath) || new Immutable.List()
      windowState = windowState.setIn(redirectedByPath, redirectedBy.push(action.location))
      break
    case windowConstants.WINDOW_ADD_HISTORY:
      windowState = windowState.mergeIn(['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps)], {
        history: addToHistory(action.frameProps)
      })
      break
    case windowConstants.WINDOW_SET_BLOCKED_RUN_INSECURE_CONTENT:
      const blockedRunInsecureContentPath =
        ['frames', frameStateUtil.getFramePropsIndex(frameStateUtil.getFrames(windowState), action.frameProps)]
      if (action.source) {
        let blockedList = windowState.getIn(
          blockedRunInsecureContentPath.concat(['security', 'blockedRunInsecureContent'])) || new Immutable.List()
        windowState =
          windowState.setIn(blockedRunInsecureContentPath.concat(['security', 'blockedRunInsecureContent']),
            blockedList.push(action.source))
      } else {
        windowState =
          windowState.deleteIn(blockedRunInsecureContentPath.concat(['security', 'blockedRunInsecureContent']))
      }
      break
    case windowConstants.WINDOW_TOGGLE_MENUBAR_VISIBLE:
      if (getSetting(settings.AUTO_HIDE_MENU)) {
        doAction({actionType: windowConstants.WINDOW_SET_CONTEXT_MENU_DETAIL})
        // Use value if provided; if not, toggle to opposite.
        const newVisibleStatus = typeof action.isVisible === 'boolean'
          ? action.isVisible
          : !windowState.getIn(['ui', 'menubar', 'isVisible'])
        // Clear selection when menu is shown
        if (newVisibleStatus) {
          doAction({ actionType: windowConstants.WINDOW_SET_MENUBAR_SELECTED_INDEX, index: 0 })
        }
        windowState = windowState.setIn(['ui', 'menubar', 'isVisible'], newVisibleStatus)
      }
      break
    case windowConstants.WINDOW_HIDE_BOOKMARK_HANGER:
      const hangerShowing = windowState.getIn(['bookmarkDetail', 'isBookmarkHanger'])
      if (hangerShowing) {
        windowState = windowState.delete('bookmarkDetail')
      }
      break
    case windowConstants.WINDOW_RESET_MENU_STATE:
      doAction({actionType: windowConstants.WINDOW_SET_POPUP_WINDOW_DETAIL})
      doAction({actionType: windowConstants.WINDOW_HIDE_BOOKMARK_HANGER})
      if (getSetting(settings.AUTO_HIDE_MENU)) {
        doAction({actionType: windowConstants.WINDOW_TOGGLE_MENUBAR_VISIBLE, isVisible: false})
      } else {
        doAction({actionType: windowConstants.WINDOW_SET_CONTEXT_MENU_DETAIL})
      }
      doAction({actionType: windowConstants.WINDOW_SET_MENUBAR_SELECTED_INDEX})
      doAction({actionType: windowConstants.WINDOW_SET_CONTEXT_MENU_SELECTED_INDEX})
      doAction({actionType: windowConstants.WINDOW_SET_BOOKMARKS_TOOLBAR_SELECTED_FOLDER_ID})
      break
    case windowConstants.WINDOW_SET_MENUBAR_SELECTED_INDEX:
      windowState = windowState.setIn(['ui', 'menubar', 'selectedIndex'], action.index)
      break
    case windowConstants.WINDOW_SET_CONTEXT_MENU_SELECTED_INDEX:
      windowState = windowState.setIn(['ui', 'contextMenu', 'selectedIndex'],
          Array.isArray(action.index)
          ? action.index
          : null)
      break
    case windowConstants.WINDOW_SET_LAST_FOCUSED_SELECTOR:
      windowState = windowState.setIn(['ui', 'menubar', 'lastFocusedSelector'], action.selector)
      break
    case windowConstants.WINDOW_SET_BOOKMARKS_TOOLBAR_SELECTED_FOLDER_ID:
      windowState = windowState.setIn(['ui', 'bookmarksToolbar', 'selectedFolderId'], action.folderId)
      break
    case windowConstants.WINDOW_ON_FOCUS_CHANGED:
      windowState = windowState.setIn(['ui', 'hasFocus'], action.hasFocus)
      break
    case windowConstants.WINDOW_SET_MODAL_DIALOG_DETAIL:
      if (action.className && action.props === undefined) {
        windowState = windowState.deleteIn(['modalDialogDetail', action.className])
      } else if (action.className) {
        windowState = windowState.setIn(['modalDialogDetail', action.className], Immutable.fromJS(action.props))
      }
      break
    case windowConstants.WINDOW_TAB_CLOSED_WITH_MOUSE:
      if (frameStateUtil.getNonPinnedFrameCount(windowState) % getSetting(settings.TABS_PER_PAGE) === 0) {
        windowState = windowState.deleteIn(['ui', 'tabs', 'fixTabWidth'])
      } else {
        windowState = windowState.setIn(['ui', 'tabs', 'fixTabWidth'], action.data.fixTabWidth)
      }
      break
    case windowConstants.WINDOW_TAB_MOUSE_LEAVE:
      windowState = windowState.deleteIn(['ui', 'tabs', 'fixTabWidth'])
      break
    case windowConstants.WINDOW_TAB_DATA_CHANGED:
      windowState = tabDataChanged(windowState, action)
      break
    case appConstants.APP_NEW_WEB_CONTENTS_ADDED:
      newFrame(action.frameOpts, action.frameOpts.openInForeground)
      updateTabPageIndex(frameStateUtil.getActiveFrame(windowState))
      break
    default:
      break
  }

  // Some events must be emitted right away, such as bound countrols
  if (immediatelyEmittedActions.includes(action.actionType)) {
    windowStore.emitChanges()
  } else {
    emitChanges()
  }
}

ipc.on(messages.SHORTCUT_NEXT_TAB, () => {
  windowState = frameStateUtil.makeNextFrameActive(windowState)
  windowState = updateTabPageIndex(windowState, frameStateUtil.getActiveFrame(windowState))
  emitChanges()
})

ipc.on(messages.SHORTCUT_PREV_TAB, () => {
  windowState = frameStateUtil.makePrevFrameActive(windowState)
  windowState = updateTabPageIndex(windowState, frameStateUtil.getActiveFrame(windowState))
  emitChanges()
})

ipc.on(messages.SHORTCUT_OPEN_CLEAR_BROWSING_DATA_PANEL, (e) => {
  doAction({
    actionType: windowConstants.WINDOW_SET_CLEAR_BROWSING_DATA_VISIBLE,
    isVisible: true
  })
})

const frameShortcuts = ['stop', 'reload', 'zoom-in', 'zoom-out', 'zoom-reset', 'toggle-dev-tools', 'clean-reload', 'view-source', 'mute', 'save', 'print', 'show-findbar', 'copy', 'find-next', 'find-prev']
frameShortcuts.forEach((shortcut) => {
  // Listen for actions on the active frame
  ipc.on(`shortcut-active-frame-${shortcut}`, (e, args) => {
    if (shortcut === 'toggle-dev-tools') {
      appActions.toggleDevTools(frameStateUtil.getActiveFrameTabId(windowState))
    } else {
      windowState = windowState.mergeIn(activeFrameStatePath(windowState), {
        activeShortcut: shortcut,
        activeShortcutDetails: args
      })
      emitChanges()
    }
  })
  // Listen for actions on frame N
  if (['reload', 'mute'].includes(shortcut)) {
    ipc.on(`shortcut-frame-${shortcut}`, (e, i, args) => {
      const path = ['frames', frameStateUtil.findIndexForFrameKey(frameStateUtil.getFrames(windowState), i)]
      windowState = windowState.mergeIn(path, {
        activeShortcut: shortcut,
        activeShortcutDetails: args
      })
      emitChanges()
    })
  }
})

const dispatchEventPayload = (e, payload) => {
  let queryInfo = payload.queryInfo || payload.frameProps || {}
  queryInfo = queryInfo.toJS ? queryInfo.toJS() : queryInfo
  if (queryInfo.windowId === -2 && isFocused()) {
    queryInfo.windowId = currentWindowId
  }
  // handle any ipc dispatches that are targeted to this window
  if (queryInfo.windowId && queryInfo.windowId === currentWindowId) {
    doAction(payload)
  }
}

// Allows the parent process to dispatch window actions
ipc.on(messages.DISPATCH_ACTION, (e, serializedPayload) => {
  let payload = Serializer.deserialize(serializedPayload)
  for (var i = 0; i < payload.length; i++) {
    dispatchEventPayload(e, payload[i])
  }
})

AppDispatcher.register(doAction)

module.exports = windowStore
