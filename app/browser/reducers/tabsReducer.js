/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const {BrowserWindow} = require('electron')
const Immutable = require('immutable')

// Actions
const windowActions = require('../../../js/actions/windowActions')

// State
const tabState = require('../../common/state/tabState')
const windowState = require('../../common/state/windowState')
const siteSettings = require('../../../js/state/siteSettings')
const siteSettingsState = require('../../common/state/siteSettingsState')
const {frameOptsFromFrame, isTor} = require('../../../js/state/frameStateUtil')
const updateState = require('../../common/state/updateState')

// Constants
const appConfig = require('../../../js/constants/appConfig')
const appConstants = require('../../../js/constants/appConstants')
const windowConstants = require('../../../js/constants/windowConstants')
const webrtcConstants = require('../../../js/constants/webrtcConstants')
const dragTypes = require('../../../js/constants/dragTypes')
const tabActionConsts = require('../../common/constants/tabAction')
const appActions = require('../../../js/actions/appActions')
const settings = require('../../../js/constants/settings')

// Utils
const tabs = require('../tabs')
const windows = require('../windows')
const {getWebContents} = require('../webContentsCache')
const {makeImmutable} = require('../../common/state/immutableUtil')
const {getFlashResourceId} = require('../../../js/flash')
const {l10nErrorText} = require('../../common/lib/httpUtil')
const flash = require('../../../js/flash')
const {isSourceAboutUrl, isTargetAboutUrl, isNavigatableAboutPage} = require('../../../js/lib/appUrlUtil')
const {shouldDebugTabEvents} = require('../../cmdLine')

const getWebRTCPolicy = (state, tabId) => {
  const webrtcSetting = state.getIn(['settings', settings.WEBRTC_POLICY])
  if (webrtcSetting && webrtcSetting !== webrtcConstants.default) {
    // Global webrtc setting overrides fingerprinting shield setting
    return webrtcSetting
  }

  const tabValue = tabState.getByTabId(state, tabId)
  if (tabValue == null) {
    return webrtcConstants.default
  }

  if (isTor(tabValue)) {
    return webrtcConstants.disableNonProxiedUdp
  }

  const allSiteSettings = siteSettingsState.getAllSiteSettings(state, tabValue.get('incognito') === true)
  const tabSiteSettings =
    siteSettings.getSiteSettingsForURL(allSiteSettings, tabValue.get('url'))
  const activeSiteSettings = siteSettings.activeSettings(tabSiteSettings, state, appConfig)

  if (!activeSiteSettings || activeSiteSettings.fingerprintingProtection !== true) {
    return webrtcConstants.default
  } else {
    return webrtcConstants.disableNonProxiedUdp
  }
}

function expireContentSettings (state, tabId, origin) {
  // Expired Flash settings should be deleted when the webview is
  // navigated or closed. Same for NoScript's allow-once option.
  const tabValue = tabState.getByTabId(state, tabId)
  const isPrivate = tabValue.get('incognito') === true
  const allSiteSettings = siteSettingsState.getAllSiteSettings(state, isPrivate)
  const tabSiteSettings =
    siteSettings.getSiteSettingsForURL(allSiteSettings, tabValue.get('url'))
  if (!tabSiteSettings) {
    return
  }
  const originFlashEnabled = tabSiteSettings.get('flash')
  const originWidevineEnabled = tabSiteSettings.get('widevine')
  const originNoScriptEnabled = tabSiteSettings.get('noScript')
  const originNoScriptExceptions = tabSiteSettings.get('noScriptExceptions')
  if (typeof originFlashEnabled === 'number') {
    if (originFlashEnabled < Date.now()) {
      appActions.removeSiteSetting(origin, 'flash', isPrivate)
    }
  }
  if (originWidevineEnabled === 0) {
    appActions.removeSiteSetting(origin, 'widevine', isPrivate)
  }
  if (originNoScriptEnabled === 0) {
    appActions.removeSiteSetting(origin, 'noScript', isPrivate)
  }
  if (originNoScriptExceptions) {
    appActions.noScriptExceptionsAdded(origin, originNoScriptExceptions.map(value => value === 0 ? false : value))
  }
}

const tabsReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case tabActionConsts.FINISH_NAVIGATION:
    case tabActionConsts.START_NAVIGATION:
      {
        const tabId = action.get('tabId')
        const originalOrigin = tabState.getVisibleOrigin(state, tabId)
        state = tabState.setNavigationState(state, tabId, action.get('navigationState'))
        const newOrigin = tabState.getVisibleOrigin(state, tabId)
        // For cross-origin navigation, clear temp approvals
        if (originalOrigin !== newOrigin) {
          expireContentSettings(state, tabId, originalOrigin)
        }
        setImmediate(() => {
          tabs.setWebRTCIPHandlingPolicy(tabId, getWebRTCPolicy(state, tabId))
        })
        break
      }
    case tabActionConsts.NAVIGATION_PROGRESS_CHANGED:
      {
        const tabId = action.get('tabId')
        state = tabState.setNavigationProgressPercent(state, tabId, action.get('progressPercent'))
        break
      }
    case tabActionConsts.RELOAD:
      {
        const tabId = tabState.resolveTabId(state, action.get('tabId'))
        setImmediate(() => {
          tabs.reload(tabId, action.get('ignoreCache'))
        })
        break
      }
    case tabActionConsts.FIND_IN_PAGE_REQUEST:
      {
        const tabId = tabState.resolveTabId(state, action.get('tabId'))
        setImmediate(() => {
          tabs.findInPage(
            tabId,
            action.get('searchString'),
            action.get('caseSensitivity'),
            action.get('forward'),
            action.get('findNext')
          )
        })
        break
      }
    case tabActionConsts.STOP_FIND_IN_PAGE_REQUEST:
      {
        const tabId = tabState.resolveTabId(state, action.get('tabId'))
        setImmediate(() => {
          tabs.stopFindInPage(tabId)
        })
        break
      }
    case tabActionConsts.ZOOM_CHANGED:
      {
        const tabId = tabState.resolveTabId(state, action.get('tabId'))
        const zoomPercent = action.get('zoomPercent')
        state = tabState.setZoomPercent(state, tabId, zoomPercent)
        break
      }
    case appConstants.APP_SET_STATE:
      state = tabs.init(state, action)
      break
    case appConstants.APP_TAB_CREATED:
      state = tabState.maybeCreateTab(state, action)
      break
    case appConstants.APP_TAB_MOVED:
      state = tabs.updateTabsStateForAttachedTab(state, action.get('tabId'))
      break
    case appConstants.APP_TAB_INSERTED_TO_TAB_STRIP: {
      const windowId = action.get('windowId')
      if (windowId == null) {
        break
      }
      const tabId = action.get('tabId')
      state = tabState.setTabStripWindowId(state, tabId, windowId)
      state = tabs.updateTabIndexesForWindow(state, windowId)
      break
    }
    case appConstants.APP_TAB_DETACHED_FROM_TAB_STRIP: {
      const windowId = action.get('windowId')
      if (windowId == null) {
        break
      }
      state = tabs.updateTabIndexesForWindow(state, windowId)
      break
    }
    case appConstants.APP_TAB_DETACH_MENU_ITEM_CLICKED: {
      setImmediate(() => {
        const tabId = action.get('tabId')
        const frameOpts = frameOptsFromFrame(action.get('frameOpts'))
        const browserOpts = action.get('browserOpts') || new Immutable.Map()
        const windowId = action.get('windowId') || -1
        tabs.moveTo(state, tabId, frameOpts, browserOpts, windowId)
      })
      break
    }
    case appConstants.APP_TAB_PAGE_CLOSE_MENU_ITEM_CLICKED: {
      const windowId = action.get('windowId')
      const tabPageIndex = action.get('tabPageIndex')
      state = tabs.closeTabPage(state, windowId, tabPageIndex)
      break
    }
    case appConstants.APP_CLOSE_TABS_TO_LEFT_MENU_ITEM_CLICKED: {
      const tabId = action.get('tabId')
      state = tabs.closeTabsToLeft(state, tabId)
      break
    }
    case appConstants.APP_CLOSE_TABS_TO_RIGHT_MENU_ITEM_CLICKED: {
      const tabId = action.get('tabId')
      state = tabs.closeTabsToRight(state, tabId)
      break
    }
    case appConstants.APP_CLOSE_OTHER_TABS_MENU_ITEM_CLICKED: {
      const tabId = action.get('tabId')
      state = tabs.closeOtherTabs(state, tabId)
      break
    }
    case appConstants.APP_DISCARD_TAB_REQUESTED: {
      const tabId = action.get('tabId')
      setImmediate(() => {
        tabs.discard(tabId)
      })
      break
    }
    case appConstants.APP_CREATE_TAB_REQUESTED:
      if (action.getIn(['createProperties', 'windowId']) == null) {
        const senderWindowId = action.getIn(['senderWindowId'])
        if (senderWindowId != null) {
          action = action.setIn(['createProperties', 'windowId'], senderWindowId)
        } else {
          // no specified window, so use active one, or create one
          const activeWindowId = windows.getActiveWindowId()
          if (activeWindowId === windowState.WINDOW_ID_NONE) {
            setImmediate(() => appActions.newWindow(action.get('createProperties')))
            // this action will get dispatched again
            // once the new window is ready to have tabs
            break
          }
          action = action.setIn(['createProperties', 'windowId'], activeWindowId)
        }
      }
      // option to focus the window the tab is being created in
      const windowId = action.getIn(['createProperties', 'windowId'])
      const shouldFocusWindow = action.get('focusWindow')
      if (shouldFocusWindow && windowId) {
        windows.focus(windowId)
      }
      const url = action.getIn(['createProperties', 'url'])
      setImmediate(() => {
        if (action.get('activateIfOpen') ||
            ((isSourceAboutUrl(url) || isTargetAboutUrl(url)) && isNavigatableAboutPage(url))) {
          tabs.maybeCreateTab(state, action.get('createProperties'))
        } else {
          tabs.create(action.get('createProperties'), null, action.get('isRestore'))
        }
      })
      break
    case appConstants.APP_RECREATE_TOR_TAB:
      {
        const tabId = action.get('tabId')
        tabs.create({
          url: 'about:newtab',
          isPrivate: true,
          windowId: tabState.getWindowId(state, tabId),
          index: action.get('index'),
          active: true,
          isTor: action.get('torEnabled')
        }, (tab) => {
          appActions.tabCloseRequested(tabId)
        })
        break
      }
    case appConstants.APP_TAB_UPDATED:
      state = tabState.maybeCreateTab(state, action)
      // tabs.debugTabs(state)
      break
    case appConstants.APP_TAB_REPLACED:
      if (action.get('isPermanent')) {
        if (shouldDebugTabEvents) {
          console.log('APP_TAB_REPLACED before')
          tabs.debugTabs(state)
        }
        state = tabState.replaceTabValue(state, action.get('oldTabId'), action.get('newTabValue'))
        if (shouldDebugTabEvents) {
          console.log('APP_TAB_REPLACED after')
          tabs.debugTabs(state)
        }
      }
      break
    case appConstants.APP_TAB_CLOSE_REQUESTED:
      {
        let tabId = action.get('tabId')
        // We can't use TAB_ID_ACTIVE directly in resolveTabId because
        // it figures out the active window based on state with focused property,
        // and the focused window might actually be a devtools window.
        if (tabId === tabState.TAB_ID_ACTIVE) {
          if (BrowserWindow.getActiveWindow()) {
            tabId = tabState.getActiveTabId(state, BrowserWindow.getActiveWindow().id)
          } else {
            break
          }
        } else {
          tabId = tabState.resolveTabId(state, tabId)
        }
        if (tabId === tabState.TAB_ID_NONE) {
          break
        }

        if (tabId) {
          if (tabs.isDevToolsFocused(tabId)) {
            setImmediate(() => {
              tabs.toggleDevTools(tabId)
            })
          } else {
            // This check is only needed in case front end tries to close
            // a tabId it thinks exists but doesn't actually exist anymore.
            const tabValue = tabState.getByTabId(state, tabId)
            if (!tabValue) {
              break
            }
            const windowId = tabState.getWindowId(state, tabId)
            const isPinned = tabState.isTabPinned(state, tabId)
            const nonPinnedTabs = tabState.getNonPinnedTabsByWindowId(state, windowId)
            const pinnedTabs = tabState.getPinnedTabsByWindowId(state, windowId)

            if (nonPinnedTabs.size > 1 ||
              (nonPinnedTabs.size > 0 && pinnedTabs.size > 0)) {
              setImmediate(() => {
                if (isPinned) {
                  // if a tab is pinned, unpin before closing
                  state = tabs.pin(state, tabId, false)
                }
                tabs.closeTab(tabId, action.get('forceClosePinned'))
              })
            } else {
              windows.closeWindow(windowId)
            }
          }
        }
      }
      break
    case appConstants.APP_TAB_CLOSED:
      {
        const tabId = action.get('tabId')
        if (tabId === tabState.TAB_ID_NONE) {
          break
        }
        // Must be called before tab is removed
        // But still check for no tabId because on tab detach there's a dummy tabId
        const tabValue = tabState.getByTabId(state, tabId)
        if (tabValue) {
          const lastOrigin = tabState.getVisibleOrigin(state, tabId)
          expireContentSettings(state, tabId, lastOrigin)
          const windowIdOfTabBeingRemoved = tabState.getWindowId(state, tabId)
          state = tabs.updateTabIndexesForWindow(state, windowIdOfTabBeingRemoved)
        }
        state = tabState.removeTabByTabId(state, tabId)
        tabs.forgetTab(tabId)
      }
      break
    case appConstants.APP_ALLOW_FLASH_ONCE:
    case appConstants.APP_ALLOW_FLASH_ALWAYS:
      setImmediate(() => {
        const webContents = getWebContents(action.get('tabId'))
        if (webContents && !webContents.isDestroyed() && webContents.getURL() === action.get('url')) {
          webContents.authorizePlugin(getFlashResourceId())
        }
      })
      break
    case appConstants.APP_TAB_CLONED:
      setImmediate(() => {
        tabs.clone(action)
      })
      break
    case appConstants.APP_TAB_PINNED:
      state = tabs.pin(state, action.get('tabId'), action.get('pinned'))
      break
    case windowConstants.WINDOW_SET_AUDIO_MUTED:
      setImmediate(() => {
        tabs.setAudioMuted(action)
      })
      break
    case windowConstants.WINDOW_SET_ALL_AUDIO_MUTED:
      action.get('frameList').forEach((frameProp) => {
        setImmediate(() => {
          tabs.setAudioMuted(frameProp)
        })
      })
      break
    case appConstants.APP_TAB_ACTIVATE_REQUESTED:
      setImmediate(() => {
        tabs.setActive(action.get('tabId'))
      })
      break
    case appConstants.APP_TAB_INDEX_CHANGE_REQUESTED:
      setImmediate(() => {
        tabs.setTabIndex(action.get('tabId'), action.get('index'))
      })
      break
    case appConstants.APP_TAB_SET_FULL_SCREEN: {
      const isFullscreen = action.get('isFullScreen')
      const tabId = action.get('tabId')
      if (isFullscreen === true || isFullscreen === false) {
        tabs.setFullScreen(tabId, isFullscreen)
      }
      break
    }
    case appConstants.APP_TAB_TOGGLE_DEV_TOOLS:
      setImmediate(() => {
        tabs.toggleDevTools(action.get('tabId'))
      })
      break
    case appConstants.APP_INSPECT_ELEMENT:
      setImmediate(() => {
        tabs.inspectElement(action.get('tabId'), action.get('x'), action.get('y'))
      })
      break
    case appConstants.APP_COPY_IMAGE:
      setImmediate(() => {
        tabs.copyImageAt(action.get('tabId'), action.get('x'), action.get('y'))
      })
      break
    case appConstants.APP_LOAD_URL_REQUESTED:
      setImmediate(() => {
        tabs.loadURL(action)
      })
      break
    case appConstants.APP_LOAD_URL_IN_ACTIVE_TAB_REQUESTED:
      setImmediate(() => {
        tabs.loadURLInActiveTab(state, action.get('windowId'), action.get('url'))
      })
      break
    case appConstants.APP_ON_GO_BACK:
      setImmediate(() => {
        tabs.goBack(action.get('tabId'))
      })
      break
    case appConstants.APP_ON_GO_FORWARD:
      setImmediate(() => {
        tabs.goForward(action.get('tabId'))
      })
      break
    case appConstants.APP_ON_GO_TO_INDEX:
      setImmediate(() => {
        tabs.goToIndex(action.get('tabId'), action.get('index'))
      })
      break
    case appConstants.APP_ON_GO_BACK_LONG:
      {
        const history = tabs.getHistoryEntries(state, action)
        const tabValue = tabState.getByTabId(state, action.get('tabId'))
        const windowId = tabValue.get('windowId')

        if (history !== null) {
          windowActions.onLongBackHistory(
            history,
            action.getIn(['rect', 'left']),
            action.getIn(['rect', 'bottom']),
            tabValue.get('partitionNumber'),
            action.get('tabId'),
            windowId
          )
        }
        break
      }
    case appConstants.APP_ON_GO_FORWARD_LONG:
      {
        const history = tabs.getHistoryEntries(state, action)
        const tabValue = tabState.getByTabId(state, action.get('tabId'))
        const windowId = tabValue.get('windowId')

        if (history !== null) {
          windowActions.onLongForwardHistory(
            history,
            action.getIn(['rect', 'left']),
            action.getIn(['rect', 'bottom']),
            tabValue.get('partitionNumber'),
            action.get('tabId'),
            windowId
          )
        }
        break
      }
    case appConstants.APP_FRAMES_CHANGED:
      for (const frameAction of action.get('frames').valueSeq()) {
        state = tabState.updateFrame(state, frameAction, shouldDebugTabEvents)
      }
      break
    // TODO: convert window frame navigation status (load, error, etc)
    // to browser actions with data on tab state. This reducer responds to
    // actions from both at the moment (browser-side for certificate errors and
    // renderer-side for load errors) until all can be refactored.
    case windowConstants.WINDOW_SET_FRAME_ERROR:
    case tabActionConsts.SET_CONTENTS_ERROR:
      {
        const tabId = action.getIn(['frameProps', 'tabId']) || action.get('tabId')
        const tab = getWebContents(tabId)
        if (tab) {
          let currentIndex = tab.getCurrentEntryIndex()
          let previousLocation = tab.getURL()
          while (previousLocation === action.getIn(['errorDetails', 'url'])) {
            previousLocation = tab.getURLAtIndex(--currentIndex)
          }
          let tabValue = tabState.getByTabId(state, tabId)
          if (tabValue) {
            tabValue = tabValue.set('aboutDetails', makeImmutable({
              title: action.getIn(['errorDetails', 'title']) || l10nErrorText(action.getIn(['errorDetails', 'errorCode'])),
              message: action.getIn(['errorDetails', 'message']),
              previousLocation
            }).merge(action.get('errorDetails')))
            state = tabState.updateTabValue(state, tabValue)
          }
        }
      }
      break
    case appConstants.APP_WINDOW_READY: {
      // Get the window's id from the action or the sender
      if (!action.getIn(['createProperties', 'windowId'])) {
        const senderWindowId = action.getIn(['senderWindowId'])
        if (senderWindowId) {
          action = action.setIn(['createProperties', 'windowId'], senderWindowId)
        }
      }
      // Show welcome tab in first window on first start,
      // but not in the buffer window.
      const windowId = action.getIn(['createProperties', 'windowId'])
      const bufferWindow = windows.getBufferWindow()
      if (!bufferWindow || bufferWindow.id !== windowId) {
        const welcomeScreenProperties = {
          url: 'about:welcome',
          windowId
        }
        const shouldShowWelcomeScreen = state.getIn(['about', 'welcome', 'showOnLoad'])
        if (shouldShowWelcomeScreen) {
          setImmediate(() => tabs.create(welcomeScreenProperties))
          // We only need to run welcome screen once
          state = state.setIn(['about', 'welcome', 'showOnLoad'], false)
        }

        // Show promotion
        const page = updateState.getUpdateProp(state, 'referralPage') || null
        if (page) {
          setImmediate(() => tabs.create({
            url: page,
            windowId
          }))
          state = updateState.setUpdateProp(state, 'referralPage', null)
        }
      }
      state = state.set('windowReady', true)
      break
    }
    case appConstants.APP_ENABLE_PEPPER_MENU: {
      flash.onFlashContextMenu(state, action.get('tabId'))
      break
    }
    case appConstants.APP_DRAG_ENDED: {
      const dragData = state.get('dragData')
      if (dragData && dragData.get('type') === dragTypes.TAB) {
        const frame = dragData.get('data')
        let frameOpts = frameOptsFromFrame(frame)
        const draggingTabId = frameOpts.get('tabId')
        const browserOpts = { positionByMouseCursor: true, checkMaximized: true }
        const tabIdForIndex = dragData.getIn(['dragOverData', 'draggingOverKey'])
        const tabForIndex = tabIdForIndex !== draggingTabId && tabState.getByTabId(state, tabIdForIndex)
        const dropWindowId = dragData.get('dropWindowId')
        let newIndex = -1
        // Set new index for new window if last dragged-over tab is in new window.
        // Otherwise, could be over another tab's tab strip, but most recently dragged-over a tab in another window.
        if (dropWindowId != null && dropWindowId !== -1 && tabForIndex && tabForIndex.get('windowId') === dropWindowId) {
          const prependIndexByTabId = dragData.getIn(['dragOverData', 'draggingOverLeftHalf'])
          newIndex = tabForIndex.get('index') + (prependIndexByTabId ? 0 : 1)
        }
        // ensure the tab never moves window with its original index
        frameOpts = frameOpts.set('index', newIndex)
        tabs.moveTo(state, draggingTabId, frameOpts, browserOpts, dragData.get('dropWindowId'))
      }
      break
    }
  }
  return state
}

module.exports = tabsReducer
