/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appDispatcher = require('../dispatcher/appDispatcher')
const EventEmitter = require('events').EventEmitter
const appActions = require('../actions/appActions')
const appConstants = require('../constants/appConstants')
const windowConstants = require('../constants/windowConstants')
const config = require('../constants/config')
const settings = require('../constants/settings')
const Immutable = require('immutable')
const frameStateUtil = require('../state/frameStateUtil')
const ipc = require('electron').ipcRenderer
const messages = require('../constants/messages')
const debounce = require('../lib/debounce')
const getSetting = require('../settings').getSetting
const UrlUtil = require('../lib/urlutil')
const {l10nErrorText} = require('../../app/common/lib/httpUtil')
const { makeImmutable } = require('../../app/common/state/immutableUtil')
const {aboutUrls, getTargetAboutUrl, newFrameUrl} = require('../lib/appUrlUtil')
const assert = require('assert')
const contextMenuState = require('../../app/common/state/contextMenuState')
const appStoreRenderer = require('./appStoreRenderer')

let windowState = Immutable.fromJS({
  activeFrameKey: null,
  frames: [],
  closedFrames: [],
  ui: {
    tabs: {
      tabPageIndex: 0
    },
    mouseInTitlebar: false,
    menubar: {
    }
  }
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

  set state (newWindowState) {
    windowState = newWindowState
  }

  getFrames () {
    return frameStateUtil.getFrames(this.state)
  }

  getFrame (key) {
    return frameStateUtil.getFrameByKey(windowState, key)
  }

  getFrameByTabId (tabId) {
    return frameStateUtil.getFrameByTabId(windowState, tabId)
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

const newFrame = (state, frameOpts) => {
  if (frameOpts === undefined) {
    frameOpts = {}
  }
  frameOpts = frameOpts.toJS ? frameOpts.toJS() : frameOpts

  // handle tabs.create properties
  let insertionIndex = frameOpts.index !== undefined
    ? frameOpts.index
    : 0

  if (frameOpts.partition) {
    frameOpts.isPrivate = frameStateUtil.isPrivatePartition(frameOpts.partition)
    if (frameStateUtil.isSessionPartition(frameOpts.partition)) {
      frameOpts.partitionNumber = frameStateUtil.getPartitionNumber(frameOpts.partition)
    }
  }
  frameOpts.partitionNumber = frameOpts.partitionNumber || 0

  const active = frameOpts.active
  delete frameOpts.active
  let openInForeground = active

  if (openInForeground == null && frameOpts.disposition) {
    openInForeground = frameOpts.disposition !== 'background-tab'
    delete frameOpts.disposition
  }

  if (openInForeground == null || state.get('activeFrameKey') == null) {
    openInForeground = true
  }

  // evaluate the location
  frameOpts.location = frameOpts.location || newFrameUrl()
  if (frameOpts.location && UrlUtil.isURL(frameOpts.location)) {
    frameOpts.location = UrlUtil.getUrlFromInput(frameOpts.location)
  } else {
    // location is a search
    const defaultURL = appStoreRenderer.state.getIn(['searchDetail', 'searchURL'])
    if (defaultURL) {
      frameOpts.location = defaultURL
        .replace('{searchTerms}', encodeURIComponent(frameOpts.location))
    } else {
      // Bad URLs passed here can actually crash the browser
      frameOpts.location = ''
    }
  }
  const nextKey = incrementNextKey()
  state = state.merge(
    frameStateUtil.addFrame(
      state, frameOpts,
      nextKey, frameOpts.partitionNumber, openInForeground, insertionIndex))
  state = frameStateUtil.updateFramesInternalIndex(state, insertionIndex)

  if (openInForeground) {
    const tabId = frameOpts.tabId
    const frame = frameStateUtil.getFrameByTabId(state, tabId)
    state = frameStateUtil.updateTabPageIndex(state, tabId)
    if (active && frame) {
      // only set the activeFrameKey if the tab is already active
      state = state.set('activeFrameKey', frame.get('key'))
    } else {
      appActions.tabActivateRequested(tabId)
    }
  }

  return state
}

const frameTabIdChanged = (state, action) => {
  action = makeImmutable(action)
  const oldTabId = action.get('oldTabId')
  const newTabId = action.get('newTabId')
  if (newTabId == null || oldTabId === newTabId) {
    return state
  }

  let newFrameProps = new Immutable.Map()
  newFrameProps = newFrameProps.set('tabId', newTabId)
  const index = frameStateUtil.getFrameIndex(state, action.getIn(['frameProps', 'key']))
  state = state.mergeIn(['frames', index], newFrameProps)
  state = frameStateUtil.deleteTabInternalIndex(state, oldTabId)
  state = frameStateUtil.updateFramesInternalIndex(state, index)
  return state
}

const frameGuestInstanceIdChanged = (state, action) => {
  action = makeImmutable(action)
  const oldGuestInstanceId = action.get('oldGuestInstanceId')
  const newGuestInstanceId = action.get('newGuestInstanceId')

  if (oldGuestInstanceId === newGuestInstanceId) {
    return state
  }

  return state.mergeIn(['frames', frameStateUtil.getFrameIndex(state, action.getIn(['frameProps', 'key']))], {
    guestInstanceId: newGuestInstanceId
  })
}

function handleChangeSettingAction (state, settingKey, settingValue) {
  switch (settingKey) {
    case settings.TABS_PER_PAGE:
      const activeFrame = frameStateUtil.getActiveFrame(state)
      state = frameStateUtil.updateTabPageIndex(state, activeFrame.get('tabId'), settingValue)
      break
    default:
  }

  return state
}

const windowStore = new WindowStore()
const emitChanges = debounce(windowStore.emitChanges.bind(windowStore), 5)

const applyReducers = (state, action, immutableAction) => [
  require('../../app/renderer/reducers/urlBarReducer'),
  require('../../app/renderer/reducers/frameReducer'),
  require('../../app/renderer/reducers/contextMenuReducer'),
  // This should be included even in production builds since you can use
  // an environment variable to show the Debug menu
  require('../../app/renderer/reducers/debugReducer')
].reduce(
    (windowState, reducer) => {
      const newState = reducer(windowState, action, immutableAction)
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
  windowState = applyReducers(windowState, action, makeImmutable(action))
  switch (action.actionType) {
    case windowConstants.WINDOW_SET_STATE:
      windowState = action.windowState
      currentKey = frameStateUtil.getFrames(windowState).reduce((previousVal, frame) => Math.max(previousVal, frame.get('key')), 0)
      const activeFrame = frameStateUtil.getActiveFrame(windowState)
      if (activeFrame && activeFrame.get('location') !== 'about:newtab') {
        focusWebview(frameStateUtil.activeFrameStatePath(windowState))
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

      windowState = windowState.mergeIn(['frames', frameStateUtil.getFrameIndex(windowState, action.frameProps.get('key'))], {
        aboutDetails: Object.assign({
          title: action.errorDetails.title || l10nErrorText(action.errorDetails.errorCode),
          message: action.errorDetails.message,
          previousLocation,
          frameKey
        }, action.errorDetails)
      })
      break
    case windowConstants.WINDOW_SET_FINDBAR_SHOWN:
      const frameIndex = frameStateUtil.getFrameIndex(windowState, action.frameKey)
      windowState = windowState.mergeIn(['frames', frameIndex], {
        findbarShown: action.shown,
        findbarSelected: action.shown
      })
      break
    case windowConstants.WINDOW_SET_FINDBAR_SELECTED:
      windowState = windowState.mergeIn(['frames', frameStateUtil.getFrameIndex(windowState, action.frameProps.get('key'))], {
        findbarSelected: action.selected
      })
      break
    case windowConstants.WINDOW_WEBVIEW_LOAD_START:
      {
        const statePath = path =>
          [path, frameStateUtil.getFrameIndex(windowState, action.frameProps.get('key'))]

        // Reset security state
        windowState =
          windowState.deleteIn(statePath('frames').concat(['security', 'blockedRunInsecureContent']))
        windowState = windowState.mergeIn(statePath('frames').concat(['security']), {
          isSecure: null,
          runInsecureContent: false
        })
        // Update loading UI
        windowState = windowState.mergeIn(statePath('frames'), {
          loading: true,
          provisionalLocation: action.location,
          startLoadTime: new Date().getTime(),
          endLoadTime: null
        })
        // For about:newtab we want to have the urlbar focused, not the new frame.
        // Otherwise we want to focus the new tab when it is a new frame in the foreground.
        if (action.location !== getTargetAboutUrl('about:newtab')) {
          focusWebview(statePath)
        }
        break
      }
    case windowConstants.WINDOW_WEBVIEW_LOAD_END:
      windowState = windowState.mergeIn(['frames', frameStateUtil.getFrameIndex(windowState, action.frameProps.get('key'))], {
        loading: false,
        endLoadTime: new Date().getTime(),
        history: addToHistory(action.frameProps)
      })
      break
    case windowConstants.WINDOW_UNDO_CLOSED_FRAME:
      {
        const closedFrames = windowState.get('closedFrames')
        if (closedFrames.size === 0) {
          break
        }
        const frame = closedFrames.last()
        windowState = windowState.set('closedFrames', closedFrames.pop())
        appActions.createTabRequested({
          url: frame.get('location'),
          partitionNumber: frame.get('partitionNumber'),
          active: true,
          index: frame.get('closedAtIndex')
        })
      }
      break
    case windowConstants.WINDOW_CLEAR_CLOSED_FRAMES:
      windowState = windowState.set('closedFrames', new Immutable.List())
      break
    case windowConstants.WINDOW_SET_PREVIEW_FRAME:
      windowState = frameStateUtil.setPreviewFrameKey(windowState, action.frameKey, true)
      break
    case windowConstants.WINDOW_SET_PREVIEW_TAB_PAGE_INDEX:
      windowState = frameStateUtil.setPreviewTabPageIndex(windowState, action.previewTabPageIndex, true)
      break
    case windowConstants.WINDOW_SET_TAB_PAGE_INDEX:
      if (action.index != null) {
        windowState = windowState.setIn(['ui', 'tabs', 'tabPageIndex'], action.index)
        windowState = windowState.deleteIn(['ui', 'tabs', 'previewTabPageIndex'])
      } else {
        windowState = frameStateUtil.updateTabPageIndex(windowState, action.frameProps.get('tabId'))
      }
      break
    case windowConstants.WINDOW_SET_TAB_BREAKPOINT:
      {
        if (!action.frameKey) {
          break
        }
        const frameIndex = frameStateUtil.getFrameIndex(windowState, action.frameKey)
        if (frameIndex !== -1) {
          windowState = windowState.setIn(['frames', frameIndex, 'breakpoint'], action.breakpoint)
        }
        break
      }
    case windowConstants.WINDOW_SET_TAB_HOVER_STATE:
      {
        windowState = frameStateUtil.setTabHoverState(windowState, action.frameKey, action.hoverState)
        break
      }
    case windowConstants.WINDOW_SET_TAB_PAGE_HOVER_STATE:
      {
        windowState = frameStateUtil.setTabPageHoverState(windowState, action.tabPageIndex, action.hoverState)
        break
      }
    case windowConstants.WINDOW_TAB_MOVE:
      {
        const sourceFrameProps = frameStateUtil.getFrameByKey(windowState, action.sourceFrameKey)
        const sourceFrameIndex = frameStateUtil.getFrameIndex(windowState, action.sourceFrameKey)
        const activeFrame = frameStateUtil.getActiveFrame(windowState)
        let newIndex = frameStateUtil.getFrameIndex(windowState, action.destinationFrameKey) + (action.prepend ? 0 : 1)
        let frames = frameStateUtil.getFrames(windowState).splice(sourceFrameIndex, 1)
        if (newIndex > sourceFrameIndex) {
          newIndex--
        }
        frames = frames.splice(newIndex, 0, sourceFrameProps)
        windowState = windowState.set('frames', frames)
        // Since the tab could have changed pages, update the tab page as well
        windowState = frameStateUtil.updateFramesInternalIndex(windowState, Math.min(sourceFrameIndex, newIndex))
        windowState = frameStateUtil.moveFrame(windowState, sourceFrameProps.get('tabId'), newIndex)
        windowState = frameStateUtil.updateTabPageIndex(windowState, activeFrame.get('tabId'))
        appActions.tabIndexChanged(activeFrame.get('tabId'), newIndex)
        break
      }
    case windowConstants.WINDOW_SET_LINK_HOVER_PREVIEW:
      {
        const framePath = frameStateUtil.activeFrameStatePath(windowState)
        if (framePath) {
          windowState = windowState.mergeIn(framePath, {
            hrefPreview: action.href,
            showOnRight: action.showOnRight
          })
        }
        break
      }
    case windowConstants.WINDOW_SET_THEME_COLOR:
      {
        const frameKey = action.frameProps.get('key')
        if (action.themeColor !== undefined) {
          windowState = windowState.setIn(frameStateUtil.frameStatePath(windowState, frameKey).concat(['themeColor']), action.themeColor)
        }
        if (action.computedThemeColor !== undefined) {
          windowState = windowState.setIn(frameStateUtil.frameStatePath(windowState, frameKey).concat(['computedThemeColor']), action.computedThemeColor)
        }
        break
      }
    case windowConstants.WINDOW_FRAME_SHORTCUT_CHANGED:
      const framePath = action.frameProps ? ['frames', frameStateUtil.getFrameIndex(windowState, action.frameProps.get('key'))] : frameStateUtil.activeFrameStatePath(windowState)
      windowState = windowState.mergeIn(framePath, {
        activeShortcut: action.activeShortcut,
        activeShortcutDetails: action.activeShortcutDetails
      })
      break
    case windowConstants.WINDOW_SET_FIND_DETAIL:
      {
        const frameIndex = frameStateUtil.getFrameIndex(windowState, action.frameKey)
        if (frameIndex !== -1) {
          windowState = windowState.mergeIn(['frames', frameIndex, 'findDetail'], action.findDetail)
        }
        break
      }
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
      windowState = contextMenuState.setContextMenu(windowState, action.detail)
      break
    case windowConstants.WINDOW_SET_POPUP_WINDOW_DETAIL:
      if (!action.detail) {
        windowState = windowState.delete('popupWindowDetail')
      } else {
        windowState = windowState.set('popupWindowDetail', action.detail)
      }
      break
    case windowConstants.WINDOW_SET_AUDIO_MUTED:
      {
        const index = frameStateUtil.getFrameIndex(windowState, action.frameKey)
        windowState = windowState.setIn(['frames', index, 'audioMuted'], action.muted)
      }
      break
    case windowConstants.WINDOW_SET_ALL_AUDIO_MUTED:
      action.frameList.forEach((frameProp) => {
        let index = frameStateUtil.getFrameIndex(windowState, frameProp.frameKey)
        windowState = windowState.setIn(['frames', index, 'audioMuted'], frameProp.muted)
      })
      break
    case windowConstants.WINDOW_SET_AUDIO_PLAYBACK_ACTIVE:
      windowState = windowState.setIn(['frames', frameStateUtil.getFrameIndex(windowState, action.frameProps.get('key')), 'audioPlaybackActive'], action.audioPlaybackActive)
      break
    case windowConstants.WINDOW_SET_FAVICON:
      windowState = windowState.setIn(['frames', frameStateUtil.getFrameIndex(windowState, action.frameProps.get('key')), 'icon'], action.favicon)
      break
    case windowConstants.WINDOW_SET_LAST_ZOOM_PERCENTAGE:
      windowState = windowState.setIn(['frames', frameStateUtil.getFrameIndex(windowState, action.frameProps.get('key')), 'lastZoomPercentage'], action.percentage)
      break
    case windowConstants.WINDOW_SET_MOUSE_IN_TITLEBAR:
      windowState = windowState.setIn(['ui', 'mouseInTitlebar'], action.mouseInTitlebar)
      break
    case windowConstants.WINDOW_SET_NOSCRIPT_VISIBLE:
      const noScriptInfoPath = ['ui', 'noScriptInfo', 'isVisible']
      windowState = windowState.setIn(noScriptInfoPath,
        typeof action.isVisible === 'boolean' ? action.isVisible : !windowState.getIn(noScriptInfoPath))
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
      const activeLocation = windowState.getIn(frameStateUtil.activeFrameStatePath(windowState).concat(['location']))
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
      {
        const path = frameStateUtil.frameStatePath(windowState, action.frameProps.get('key'))
        if (action.securityState.secure !== undefined) {
          windowState = windowState.setIn(path.concat(['security', 'isSecure']),
            action.securityState.secure)
        }
        if (action.securityState.runInsecureContent !== undefined) {
          windowState = windowState.setIn(path.concat(['security', 'runInsecureContent']),
            action.securityState.runInsecureContent)
        }
        break
      }
    case windowConstants.WINDOW_SET_BLOCKED_BY:
      const blockedByPath = ['frames', frameStateUtil.getFrameIndex(windowState, action.frameProps.get('key')), action.blockType, 'blocked']
      let blockedBy = windowState.getIn(blockedByPath) || new Immutable.List()
      blockedBy = blockedBy.toSet().add(action.location).toList()
      windowState = windowState.setIn(blockedByPath, blockedBy)
      break
    case windowConstants.WINDOW_SET_REDIRECTED_BY:
      const redirectedByPath = ['frames', frameStateUtil.getFrameIndex(windowState, action.frameProps.get('key')), 'httpsEverywhere', action.ruleset]
      let redirectedBy = windowState.getIn(redirectedByPath) || new Immutable.List()
      windowState = windowState.setIn(redirectedByPath, redirectedBy.push(action.location))
      break
    case windowConstants.WINDOW_ADD_HISTORY:
      windowState = windowState.mergeIn(['frames', frameStateUtil.getFrameIndex(windowState, action.frameProps.get('key'))], {
        history: addToHistory(action.frameProps)
      })
      break
    case windowConstants.WINDOW_SET_BLOCKED_RUN_INSECURE_CONTENT:
      const blockedRunInsecureContentPath =
        ['frames', frameStateUtil.getFrameIndex(windowState, action.frameProps.get('key'))]
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
    case windowConstants.WINDOW_SET_MODAL_DIALOG_DETAIL:
      if (action.className && action.props === undefined) {
        windowState = windowState.deleteIn(['modalDialogDetail', action.className])
      } else if (action.className) {
        windowState = windowState.setIn(['modalDialogDetail', action.className], Immutable.fromJS(action.props))
      }
      break
    case windowConstants.WINDOW_TAB_CLOSED_WITH_MOUSE:
      const frameCountAfterClose = frameStateUtil.getNonPinnedFrameCount(windowState) - 1
      if (frameCountAfterClose % getSetting(settings.TABS_PER_PAGE) === 0) {
        windowState = windowState.deleteIn(['ui', 'tabs', 'fixTabWidth'])
      } else {
        windowState = windowState.setIn(['ui', 'tabs', 'fixTabWidth'], action.data.fixTabWidth)
      }
      break
    case windowConstants.WINDOW_TAB_MOUSE_LEAVE:
      windowState = windowState.deleteIn(['ui', 'tabs', 'fixTabWidth'])
      break
    case appConstants.APP_NEW_WEB_CONTENTS_ADDED:
      if (!action.frameOpts) {
        break
      }

      action.frameOpts = makeImmutable(action.frameOpts).toJS()
      if (action.tabValue) {
        const tabValue = makeImmutable(action.tabValue)

        action.frameOpts.tabId = tabValue.get('tabId')
        action.frameOpts.icon = action.frameOpts.icon || tabValue.get('favIconUrl')
      }
      windowState = newFrame(windowState, action.frameOpts)
      break
    case appConstants.APP_CHANGE_SETTING:
      windowState = handleChangeSettingAction(windowState, action.key, action.value)
      break
    case windowConstants.WINDOW_FRAME_MOUSE_ENTER:
      windowState = windowState.setIn(['ui', 'mouseInFrame'], true)
      break
    case windowConstants.WINDOW_FRAME_MOUSE_LEAVE:
      windowState = windowState.setIn(['ui', 'mouseInFrame'], false)
      break
    case windowConstants.WINDOW_ON_MAXIMIZE:
      windowState = windowState.setIn(['ui', 'isMaximized'], true)
      break
    case windowConstants.WINDOW_ON_MINIMIZE:
      windowState = windowState.setIn(['ui', 'isMaximized'], false)
      break
    case windowConstants.WINDOW_ON_FOCUS:
      windowState = windowState.setIn(['ui', 'isFocused'], true)
      break
    case windowConstants.WINDOW_ON_BLUR:
      windowState = windowState.setIn(['ui', 'isFocused'], false)
      break
    case windowConstants.WINDOW_ON_ENTER_FULL_SCREEN:
      windowState = windowState.setIn(['ui', 'isFullScreen'], true)
      break
    case windowConstants.WINDOW_ON_EXIT_FULL_SCREEN:
      windowState = windowState.setIn(['ui', 'isFullScreen'], false)
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

ipc.on(messages.SHORTCUT_SET_ACTIVE_FRAME_BY_INDEX, (e, i) => {
  const frameProps = frameStateUtil.getFrameByDisplayIndex(windowState, i)
  if (frameProps) {
    appActions.tabActivateRequested(frameProps.get('tabId'))
  }
})

ipc.on(messages.SHORTCUT_SET_ACTIVE_FRAME_TO_LAST, () => {
  const frameProps = windowState.getIn(['frames', frameStateUtil.getFrames(windowState).size - 1])
  if (frameProps) {
    appActions.tabActivateRequested(frameProps.get('tabId'))
  }
})

ipc.on(messages.SHORTCUT_NEXT_TAB, () => {
  const frame = frameStateUtil.getNextFrame(windowState)
  if (frame && frame.get('tabId') !== -1) {
    appActions.tabActivateRequested(frame.get('tabId'))
  }
})

ipc.on(messages.SHORTCUT_PREV_TAB, () => {
  const frame = frameStateUtil.getPreviousFrame(windowState)
  if (frame && frame.get('tabId') !== -1) {
    appActions.tabActivateRequested(frame.get('tabId'))
  }
})

ipc.on(messages.SHORTCUT_OPEN_CLEAR_BROWSING_DATA_PANEL, (e) => {
  doAction({
    actionType: windowConstants.WINDOW_SET_CLEAR_BROWSING_DATA_VISIBLE,
    isVisible: true
  })
})

const frameShortcuts = ['stop', 'reload', 'zoom-in', 'zoom-out', 'zoom-reset', 'toggle-dev-tools', 'clean-reload', 'view-source', 'mute', 'save', 'print', 'show-findbar', 'find-next', 'find-prev']
frameShortcuts.forEach((shortcut) => {
  // Listen for actions on the active frame
  ipc.on(`shortcut-active-frame-${shortcut}`, (e, args) => {
    if (shortcut === 'toggle-dev-tools') {
      appActions.toggleDevTools(frameStateUtil.getActiveFrameTabId(windowState))
    } else {
      const framePath = frameStateUtil.activeFrameStatePath(windowState)
      if (framePath) {
        windowState = windowState.mergeIn(framePath, {
          activeShortcut: shortcut,
          activeShortcutDetails: args
        })
        emitChanges()
      }
    }
  })
  // Listen for actions on frame N
  if (['reload', 'mute'].includes(shortcut)) {
    ipc.on(`shortcut-frame-${shortcut}`, (e, i, args) => {
      const path = ['frames', frameStateUtil.getFrameIndex(windowState, i)]
      windowState = windowState.mergeIn(path, {
        activeShortcut: shortcut,
        activeShortcutDetails: args
      })
      emitChanges()
    })
  }
})

appDispatcher.registerLocalCallback(doAction)

module.exports = windowStore
