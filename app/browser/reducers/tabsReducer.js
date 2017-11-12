/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConfig = require('../../../js/constants/appConfig')
const appConstants = require('../../../js/constants/appConstants')
const tabs = require('../tabs')
const windows = require('../windows')
const {getWebContents} = require('../webContentsCache')
const {BrowserWindow} = require('electron')
const tabState = require('../../common/state/tabState')
const tabActions = require('../../common/actions/tabActions')
const siteSettings = require('../../../js/state/siteSettings')
const siteSettingsState = require('../../common/state/siteSettingsState')
const windowConstants = require('../../../js/constants/windowConstants')
const windowActions = require('../../../js/actions/windowActions')
const {makeImmutable} = require('../../common/state/immutableUtil')
const {getFlashResourceId} = require('../../../js/flash')
const {l10nErrorText} = require('../../common/lib/httpUtil')
const Immutable = require('immutable')
const dragTypes = require('../../../js/constants/dragTypes')
const flash = require('../../../js/flash')
const {frameOptsFromFrame} = require('../../../js/state/frameStateUtil')
const {isSourceAboutUrl, isTargetAboutUrl, isNavigatableAboutPage} = require('../../../js/lib/appUrlUtil')

const WEBRTC_DEFAULT = 'default'
const WEBRTC_DISABLE_NON_PROXY = 'disable_non_proxied_udp'

const getWebRTCPolicy = (state, tabId) => {
  const tabValue = tabState.getByTabId(state, tabId)
  if (tabValue == null) {
    return WEBRTC_DEFAULT
  }
  const allSiteSettings = siteSettingsState.getAllSiteSettings(state, tabValue.get('incognito') === true)
  const tabSiteSettings =
    siteSettings.getSiteSettingsForURL(allSiteSettings, tabValue.get('url'))
  const activeSiteSettings = siteSettings.activeSettings(tabSiteSettings, state, appConfig)

  if (!activeSiteSettings || activeSiteSettings.fingerprintingProtection !== true) {
    return WEBRTC_DEFAULT
  } else {
    return WEBRTC_DISABLE_NON_PROXY
  }
}

const tabsReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case tabActions.didStartNavigation.name:
    case tabActions.didFinishNavigation.name:
      {
        const tabId = action.get('tabId')
        state = tabState.setNavigationState(state, tabId, action.get('navigationState'))
        setImmediate(() => {
          tabs.setWebRTCIPHandlingPolicy(tabId, getWebRTCPolicy(state, tabId))
        })
        break
      }
    case tabActions.reload.name:
      {
        const tabId = tabState.resolveTabId(state, action.get('tabId'))
        setImmediate(() => {
          tabs.reload(tabId, action.get('ignoreCache'))
        })
        break
      }
    case appConstants.APP_SET_STATE:
      state = tabs.init(state, action)
      break
    case appConstants.APP_TAB_CREATED:
      state = tabState.maybeCreateTab(state, action)
      break
    case appConstants.APP_TAB_ATTACHED:
      // XXX Commented out for SCIENCE - Ayumi
      // state = tabs.updateTabsStateForAttachedTab(state, action.get('tabId'))
      break
    case appConstants.APP_TAB_WILL_ATTACH: {
      // XXX Commented out for SCIENCE - Ayumi
      // const tabId = action.get('tabId')
      // const tabValue = tabState.getByTabId(state, tabId)
      // if (!tabValue) {
      //   break
      // }
      // const oldWindowId = tabState.getWindowId(state, tabId)
      // state = tabs.updateTabsStateForWindow(state, oldWindowId)
      break
    }
    case appConstants.APP_TAB_MOVED:
      state = tabs.updateTabsStateForAttachedTab(state, action.get('tabId'))
      break
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
    case appConstants.APP_CREATE_TAB_REQUESTED:
      if (action.getIn(['createProperties', 'windowId']) == null) {
        const senderWindowId = action.getIn(['senderWindowId'])
        if (senderWindowId != null) {
          action = action.setIn(['createProperties', 'windowId'], senderWindowId)
        } else if (BrowserWindow.getActiveWindow()) {
          action = action.setIn(['createProperties', 'windowId'], BrowserWindow.getActiveWindow().id)
        }
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
    case appConstants.APP_TAB_UPDATED:
      state = tabState.maybeCreateTab(state, action)
      // tabs.debugTabs(state)
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
        const nextActiveTabId = tabs.getNextActiveTab(state, tabId)

        // Must be called before tab is removed
        // But still check for no tabId because on tab detach there's a dummy tabId
        const tabValue = tabState.getByTabId(state, tabId)
        if (tabValue) {
          const windowIdOfTabBeingRemoved = tabState.getWindowId(state, tabId)
          state = tabs.updateTabsStateForWindow(state, windowIdOfTabBeingRemoved)
        }
        state = tabState.removeTabByTabId(state, tabId)
        setImmediate(() => {
          if (nextActiveTabId !== tabState.TAB_ID_NONE) {
            tabs.setActive(nextActiveTabId)
          }
        })
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
    case appConstants.APP_FRAME_CHANGED:
      state = tabState.updateFrame(state, action)
      break
    case windowConstants.WINDOW_SET_FRAME_ERROR:
      {
        const tabId = action.getIn(['frameProps', 'tabId'])
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
      if (!action.getIn(['createProperties', 'windowId'])) {
        const senderWindowId = action.getIn(['senderWindowId'])
        if (senderWindowId) {
          action = action.setIn(['createProperties', 'windowId'], senderWindowId)
        }
      }

      const welcomeScreenProperties = {
        'url': 'about:welcome',
        'windowId': action.getIn(['createProperties', 'windowId'])
      }

      const shouldShowWelcomeScreen = state.getIn(['about', 'welcome', 'showOnLoad'])
      if (shouldShowWelcomeScreen) {
        setImmediate(() => tabs.create(welcomeScreenProperties))
        // We only need to run welcome screen once
        state = state.setIn(['about', 'welcome', 'showOnLoad'], false)
      }
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
        const browserOpts = { positionByMouseCursor: true, checkMaximized: true }
        const tabIdForIndex = dragData.getIn(['dragOverData', 'draggingOverKey'])
        const tabForIndex = tabState.getByTabId(state, tabIdForIndex)
        const dropWindowId = dragData.get('dropWindowId')
        if (dropWindowId != null && dropWindowId !== -1 && tabForIndex) {
          const prependIndexByTabId = dragData.getIn(['dragOverData', 'draggingOverLeftHalf'])
          frameOpts = frameOpts.set('index', tabForIndex.get('index') + (prependIndexByTabId ? 0 : 1))
        }
        tabs.moveTo(state, frame.get('tabId'), frameOpts, browserOpts, dragData.get('dropWindowId'))
      }
      break
    }
  }
  return state
}

module.exports = tabsReducer
