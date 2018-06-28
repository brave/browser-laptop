/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appDispatcher = require('../dispatcher/appDispatcher')
const EventEmitter = require('events').EventEmitter
const appActions = require('../actions/appActions')
const webviewActions = require('../actions/webviewActions')
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
const color = require('../lib/color')
const {l10nErrorText} = require('../../app/common/lib/httpUtil')
const { makeImmutable } = require('../../app/common/state/immutableUtil')
const {aboutUrls, getTargetAboutUrl, newFrameUrl} = require('../lib/appUrlUtil')
const assert = require('assert')
const contextMenuState = require('../../app/common/state/contextMenuState')
const appStoreRenderer = require('./appStoreRenderer')
const bookmarkFoldersState = require('../../app/common/state/bookmarkFoldersState')
const bookmarksState = require('../../app/common/state/bookmarksState')
const tabState = require('../../app/common/state/tabState')
const bookmarkUtil = require('../../app/common/lib/bookmarkUtil')

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

const focusWebview = () => {
  webviewActions.setWebviewFocused()
}

let currentKey = 0
const incrementNextKey = () => ++currentKey

class WindowStore extends EventEmitter {
  constructor () {
    super()
    // Many components can subscribe to changes in store state
    // so ignore any memory-leak warning about having more than 10 listeners.
    this.setMaxListeners(0)
  }

  getState () {
    return windowState
  }

  get state () {
    return windowState
  }

  set state (newWindowState) {
    windowState = newWindowState
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
  // setup debug logging
  const shouldLogDebug = getSetting(settings.DEBUG_VERBOSE_TAB_INFO)
  // normalize input
  frameOpts = frameOpts.toJS ? frameOpts.toJS() : frameOpts
  // handle tabs.create properties
  if (shouldLogDebug) {
    console.debug('newFrame', frameOpts)
  }
  // Ensure valid index
  let insertionIndex = frameOpts.index
  const highestFrameIndex = (state.get('frames') || Immutable.List()).count()
  const insertionIndexIsInvalid = (insertionIndex == null || insertionIndex < 0 || insertionIndex > highestFrameIndex)
  if (insertionIndexIsInvalid) {
    if (shouldLogDebug) {
      console.debug(`newFrame: invalid insertionIndex of ${insertionIndex} so using max index of ${highestFrameIndex}`)
    }
    frameOpts.index = insertionIndex = highestFrameIndex
  }

  if (frameOpts.partition) {
    if (frameStateUtil.isSessionPartition(frameOpts.partition)) {
      frameOpts.partitionNumber = frameStateUtil.getPartitionNumber(frameOpts.partition)
    }
  }
  frameOpts.partitionNumber = frameOpts.partitionNumber || 0
  const isPinned = frameOpts.isPinned
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

  if (openInForeground && !isPinned) {
    const tabId = frameOpts.tabId
    const frame = frameStateUtil.getFrameByTabId(state, tabId)
    state = frameStateUtil.updateTabPageIndex(state, tabId)
    if (!active || !frame) {
      appActions.tabActivateRequested(tabId)
    }
  }

  return state
}

const frameTabReplaced = (state, action) => {
  action = makeImmutable(action)
  const oldTabId = action.get('oldTabId')
  const newTabValue = action.get('newTabValue')
  const newTabId = newTabValue.get('tabId')
  if (newTabId == null || oldTabId === newTabId) {
    console.error('Invalid action arguments for frameTabReplaced')
    return state
  }
  let newFrameProps = new Immutable.Map()
  newFrameProps = newFrameProps.set('tabId', newTabId)
  newFrameProps = newFrameProps.set('guestInstanceId', newTabValue.get('guestInstanceId'))
  newFrameProps = newFrameProps.set('isPlaceholder', newTabValue.get('isPlaceholder'))
  const frame = frameStateUtil.getFrameByTabId(state, oldTabId)
  if (!frame) {
    console.error(`Could not find frame with tabId ${oldTabId} in order to replace with new tabId ${newTabId}`)
    return state
  }
  const index = frameStateUtil.getFrameIndex(state, frame.get('key'))
  state = state.mergeIn(['frames', index], newFrameProps)
  state = frameStateUtil.deleteTabInternalIndex(state, oldTabId)
  state = frameStateUtil.updateFramesInternalIndex(state, index)
  return state
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
  require('../../app/renderer/reducers/tabContentReducer'),
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
  windowConstants.WINDOW_ON_ADD_BOOKMARK,
  windowConstants.WINDOW_ON_EDIT_BOOKMARK,
  windowConstants.WINDOW_AUTOFILL_POPUP_HIDDEN,
  windowConstants.WINDOW_SET_CONTEXT_MENU_DETAIL,
  windowConstants.WINDOW_SET_POPUP_WINDOW_DETAIL,
  windowConstants.WINDOW_SET_AUTOFILL_ADDRESS_DETAIL,
  windowConstants.WINDOW_SET_AUTOFILL_CREDIT_CARD_DETAIL,
  windowConstants.WINDOW_SET_MODAL_DIALOG_DETAIL
]

// Register callback to handle all updates
const doAction = (action) => {
  let t0
  if (windowState.get('debugStoreActions')) {
    t0 = window.performance.now()
    console.log(`%caction-start %c${action.actionType}`, 'color: #aaa', 'font-weight: bold', action)
  }
  windowState = applyReducers(windowState, action, makeImmutable(action))
  switch (action.actionType) {
    case windowConstants.WINDOW_SET_STATE:
      windowState = action.windowState
      currentKey = frameStateUtil.getFrames(windowState).reduce((previousVal, frame) => Math.max(previousVal, frame.get('key')), 0)
      const activeFrame = frameStateUtil.getActiveFrame(windowState)
      if (activeFrame && activeFrame.get('location') !== 'about:newtab') {
        focusWebview()
      }
      // We should not emit here because the Window already know about the change on startup.
      return
    case appConstants.APP_TAB_REPLACED:
      windowState = frameTabReplaced(windowState, action)
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
      windowState = windowState.mergeIn(['frames', frameStateUtil.getFrameIndex(windowState, action.frameKey)], {
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
          evCert: undefined,
          runInsecureContent: false
        })
        // Update loading UI
        const isNewTabUrl = action.location === getTargetAboutUrl('about:newtab')
        const frameUpdatedData = {
          loading: true,
          provisionalLocation: action.location,
          startLoadTime: new Date().getTime(),
          endLoadTime: null
        }
        // Optimization to prevent flash of tab color
        // when creating new tabs.
        if (isNewTabUrl) {
          frameUpdatedData.themeColor = '#222222'
          frameUpdatedData.computedThemeColor = undefined
        }
        windowState = windowState.mergeIn(statePath('frames'), frameUpdatedData)
        // For about:newtab we want to have the urlbar focused, not the new frame.
        // Otherwise we want to focus the new tab when it is a new frame in the foreground.
        if (!isNewTabUrl) {
          focusWebview()
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
        if (!closedFrames || closedFrames.size === 0) {
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
      if (!action.location) {
        windowState = windowState.set('closedFrames', new Immutable.List())
      } else {
        const closedFrames = windowState.get('closedFrames', Immutable.List()) || Immutable.List()
        windowState = windowState.set('closedFrames',
          closedFrames.filterNot((frame) => frame.get('location') === action.location)
        )
      }
      break
    case windowConstants.WINDOW_SET_PREVIEW_TAB_PAGE_INDEX:
      windowState = frameStateUtil.setPreviewTabPageIndex(windowState, action.previewTabPageIndex, true)
      break
    case windowConstants.WINDOW_SET_TAB_PAGE_INDEX:
      if (action.index != null) {
        windowState = windowState.setIn(['ui', 'tabs', 'tabPageIndex'], action.index)
        windowState = windowState.deleteIn(['ui', 'tabs', 'previewTabPageIndex'])
      } else {
        windowState = frameStateUtil.updateTabPageIndex(windowState, action.tabId)
      }
      break
    case windowConstants.WINDOW_SET_TAB_HOVER_STATE:
      {
        windowState = frameStateUtil
          .setTabHoverState(windowState, action.frameKey, action.hoverState, action.previewMode)
        break
      }
    case windowConstants.WINDOW_SET_TAB_PAGE_HOVER_STATE:
      {
        windowState = frameStateUtil.setTabPageHoverState(windowState, action.tabPageIndex, action.hoverState)
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
          // remove alpha channel
          const solidColor = color.removeAlphaChannelForBackground(action.themeColor, 255, 255, 255)
          windowState = windowState.setIn(frameStateUtil.frameStatePath(windowState, frameKey).concat(['themeColor']), solidColor)
        }
        if (action.computedThemeColor !== undefined) {
          const solidColor = color.removeAlphaChannelForBackground(action.computedThemeColor, 255, 255, 255)
          windowState = windowState.setIn(frameStateUtil.frameStatePath(windowState, frameKey).concat(['computedThemeColor']), solidColor)
        }
        break
      }
    case windowConstants.WINDOW_SET_FIND_DETAIL:
      {
        const frameIndex = frameStateUtil.getFrameIndex(windowState, action.frameKey)
        if (frameIndex !== -1) {
          windowState = windowState.mergeIn(['frames', frameIndex, 'findDetail'], action.findDetail)
        }
        break
      }
    case windowConstants.WINDOW_ON_ADD_BOOKMARK:
      windowState = windowState.setIn(['bookmarkDetail'], Immutable.fromJS({
        siteDetail: action.siteDetail,
        isBookmarkHanger: false,
        closestKey: action.closestKey
      }))
      break
    case windowConstants.WINDOW_ON_BOOKMARK_CLOSE:
      windowState = windowState.delete('bookmarkDetail')
      break
    case windowConstants.WINDOW_ON_EDIT_BOOKMARK:
      {
        const siteDetail = bookmarksState.getBookmark(appStoreRenderer.state, action.editKey)

        windowState = windowState.setIn(['bookmarkDetail'], Immutable.fromJS({
          siteDetail: siteDetail,
          editKey: action.editKey,
          isBookmarkHanger: action.isHanger
        }))
        break
      }
    case windowConstants.WINDOW_ON_BOOKMARK_ADDED:
      {
        let bookmarkDetail = action.bookmarkDetail

        if (bookmarkDetail == null) {
          bookmarkDetail = frameStateUtil.getActiveFrame(windowState)
        }

        bookmarkDetail = bookmarkDetail.set('location', UrlUtil.getLocationIfPDF(bookmarkDetail.get('location')))

        const editKey = bookmarkUtil.getKey(bookmarkDetail)

        windowState = windowState.setIn(['bookmarkDetail'], Immutable.fromJS({
          siteDetail: bookmarkDetail,
          editKey: editKey,
          isBookmarkHanger: action.isHanger,
          isAdded: true
        }))
      }
      break
    case windowConstants.WINDOW_ON_ADD_BOOKMARK_FOLDER:
      windowState = windowState.setIn(['bookmarkFolderDetail'], Immutable.fromJS({
        folderDetails: action.folderDetails,
        closestKey: action.closestKey
      }))
      break
    case windowConstants.WINDOW_ON_EDIT_BOOKMARK_FOLDER:
      {
        const folderDetails = bookmarkFoldersState.getFolder(appStoreRenderer.state, action.editKey)

        windowState = windowState.setIn(['bookmarkFolderDetail'], Immutable.fromJS({
          folderDetails: folderDetails,
          editKey: action.editKey
        }))
        break
      }
    case windowConstants.WINDOW_ON_BOOKMARK_FOLDER_CLOSE:
      windowState = windowState.delete('bookmarkFolderDetail')
      break
    case windowConstants.WINDOW_AUTOFILL_SELECTION_CLICKED:
      windowState = contextMenuState.setContextMenu(windowState)
      ipc.send('autofill-selection-clicked', action.tabId, action.value, action.frontEndId, action.index)
      break
    case windowConstants.WINDOW_AUTOFILL_POPUP_HIDDEN:
      {
        const contextMenuDetail = contextMenuState.getContextMenu(windowState)
        if (!action.detail &&
            contextMenuDetail.get('type') === 'autofill' &&
            contextMenuDetail.get('tabId') === action.tabId) {
          windowState = contextMenuState.setContextMenu(windowState)
          if (action.notify) {
            ipc.send('autofill-popup-hidden', action.tabId)
          }
        }
        break
      }
    case windowConstants.WINDOW_SET_CONTEXT_MENU_DETAIL:
      if (action.contextMenuDetail) {
        windowState = windowState.set('contextMenuDetail', action.contextMenuDetail)
      } else {
        windowState = windowState.delete('contextMenuDetail')
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
    case windowConstants.WINDOW_SET_FAVICON:
      windowState = windowState.setIn(['frames', frameStateUtil.getFrameIndex(windowState, action.frameProps.get('key')), 'icon'], action.favicon)
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
      if (action.selected == null) {
        windowState = windowState.delete('importBrowserDataSelected')
      } else {
        if (typeof action.selected === 'number') {
          const detail = windowState.getIn(['importBrowserDataDetail', action.selected])
          windowState = windowState.set('importBrowserDataSelected', detail)
        } else {
          for (let prop in action.selected) {
            if (!action.selected.hasOwnProperty(prop)) continue

            windowState = windowState.setIn(['importBrowserDataSelected', prop], action.selected[prop])
          }
        }
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
      if (!action.property && !action.wholeObject) {
        windowState = windowState.delete('autofillAddressDetail')
      } else if (action.wholeObject) {
        windowState = windowState.set('autofillAddressDetail', Immutable.fromJS(action.wholeObject))
      } else {
        windowState = windowState.setIn(['autofillAddressDetail', action.property], action.newValue)
      }
      break
    case windowConstants.WINDOW_SET_AUTOFILL_CREDIT_CARD_DETAIL:
      if (!action.property && !action.wholeObject) {
        windowState = windowState.delete('autofillCreditCardDetail')
      } else if (action.wholeObject) {
        windowState = windowState.set('autofillCreditCardDetail', Immutable.fromJS(action.wholeObject))
      } else {
        windowState = windowState.setIn(['autofillCreditCardDetail', action.property], action.newValue)
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
        const path = frameStateUtil.frameStatePathByTabId(windowState, action.tabId)
        if (action.securityState.secure !== undefined) {
          windowState = windowState.setIn(path.concat(['security', 'isSecure']),
            action.securityState.secure)
        }
        if (action.securityState.runInsecureContent !== undefined) {
          windowState = windowState.setIn(path.concat(['security', 'runInsecureContent']),
            action.securityState.runInsecureContent)
        }
        if (action.securityState.evCert !== undefined) {
          windowState = windowState.setIn(path.concat(['security', 'evCert']),
            action.securityState.evCert)
        }
        break
      }
    case windowConstants.WINDOW_SET_BLOCKED_BY:
      const blockedByPath = ['frames', frameStateUtil.getIndexByTabId(windowState, action.tabId), action.blockType, 'blocked']
      let blockedBy = windowState.getIn(blockedByPath) || new Immutable.List()
      blockedBy = blockedBy.toSet().add(action.location).toList()
      windowState = windowState.setIn(blockedByPath, blockedBy)
      break
    case windowConstants.WINDOW_SET_REDIRECTED_BY:
      const redirectedByPath = ['frames', frameStateUtil.getIndexByTabId(windowState, action.tabId), 'httpsEverywhere', action.ruleset]
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
    case windowConstants.WINDOW_NEW_FRAME:
      if (!action.frameOpts) {
        break
      }

      action.frameOpts = makeImmutable(action.frameOpts).toJS()
      if (action.tabValue) {
        const tabValue = makeImmutable(action.tabValue)

        action.frameOpts.tabId = tabValue.get('tabId')
        action.frameOpts.icon = action.frameOpts.icon || tabValue.get('favIconUrl')
      }

      // Update some properties from latest tab state as frame object has been in transit
      // and may have missed some events.
      // TODO: These properties should be read directly from tabState by components because
      // of it's permanency, instead of keeping frame and tab synchronized.
      if (action.frameOpts.tabId) {
        const tab = tabState.getByTabId(appStoreRenderer.state, action.frameOpts.tabId)
        if (tab) {
          // handle tabStripWindowId changed whilst tab was being moved (avoiding non-displaying tab)
          const existingTabStripWindowId = tab.get('tabStripWindowId')
          action.frameOpts.tabStripWindowId = existingTabStripWindowId
        }
      }
      // if we get a new frame, we're no longer in a close-tab-with-mouse frenzy
      windowState = windowState.deleteIn(['ui', 'tabs', 'fixTabWidth'])
      // add the frame to the state
      windowState = newFrame(windowState, action.frameOpts)
      setImmediate(() => {
        // Inform subscribers that we now have a frame
        // representation of a tab.
        // Note that this is only required since we have some
        // code that should be performed in state reducers
        // but is performed in event handlers and requires up-to-date
        // knowledge of frames in the state.
        const tabId = action.frameOpts.tabId
        if (tabId != null) {
          const frame = frameStateUtil.getFrameByTabId(windowState, tabId)
          windowStore.emit(`new-frame-${tabId}`, frame)
        }
      })
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
    case appConstants.APP_WINDOW_READY:
    case appConstants.APP_WINDOW_UPDATED:
    case appConstants.APP_WINDOW_RESIZED:
      let windowValue = makeImmutable(action.windowValue)
      const oldInfo = windowState.get('windowInfo', Immutable.Map())
      // detect if window is newly focused
      if (windowValue.get('focused') && !oldInfo.get('focused')) {
        // record time of focus so we can make sure the window
        // z-index is restored on app-restart
        windowValue = windowValue.set('focusTime', new Date().getTime())
      }
      windowState = windowState.set('windowInfo', oldInfo.merge(windowValue))
      break
    case windowConstants.WINDOW_TAB_MOVE_INCREMENTAL_REQUESTED:
      const sourceFrame = frameStateUtil.getActiveFrame(windowState)
      const sourceIsPinned = sourceFrame.get('pinnedLocation')
      const frameGroup = sourceIsPinned ? frameStateUtil.getPinnedFrames(windowState) : frameStateUtil.getNonPinnedFrames(windowState)
      const sourceFrameGroupIndex = frameGroup.indexOf(sourceFrame)
      const destinationFrameGroupIndex = sourceFrameGroupIndex + (action.moveNext ? 1 : -1)
      // conditions we cannot move tab:
      // - if we can't find it,
      // - if we ask to move to previous and tab is first,
      // - or we ask to move to next and tab is last
      if (destinationFrameGroupIndex < 0 || destinationFrameGroupIndex >= frameGroup.count()) {
        break
      }
      const destinationFrame = frameGroup.get(destinationFrameGroupIndex)
      const destinationFrameIndex = frameStateUtil.getFrameIndex(windowState, destinationFrame.get('key'))
      const sourceFrameTabId = sourceFrame.get('tabId')
      appActions.tabIndexChangeRequested(sourceFrameTabId, destinationFrameIndex)
      break
    default:
      break
  }
  if (windowState.get('debugStoreActions')) {
    console.log(`%caction-end %dms, activeFrameKey: %d, frames:`, 'color: #aaa', window.performance.now() - t0, windowState.get('activeFrameKey'), windowState.get('frames', Immutable.List()).toJS())
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

appDispatcher.registerLocalCallback(doAction)

module.exports = windowStore
