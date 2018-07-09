/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const menu = require('../menu')

const Immutable = require('immutable')
const electron = require('electron')
const BrowserWindow = electron.BrowserWindow

// Constants
const appConstants = require('../../../js/constants/appConstants')
const windowConstants = require('../../../js/constants/windowConstants')
const settings = require('../../../js/constants/settings')

// State
const {getByTabId} = require('../../common/state/tabState')

// Util
const {makeImmutable} = require('../../common/state/immutableUtil')
const frameStateUtil = require('../../../js/state/frameStateUtil')
const menuUtil = require('../../common/lib/menuUtil')
const locale = require('../../locale')
const {getAllRendererWindows} = require('../windows')

let closedFrames = new Immutable.OrderedMap()
let lastClosedUrl = null

const menuReducer = (state, action) => {
  switch (action.actionType) {
    case appConstants.APP_SET_STATE:
      menu.init(state)
      break
    case windowConstants.WINDOW_SET_FOCUSED_FRAME:
      {
        // Update the checkbox next to "Bookmark Page" (Bookmarks menu)
        const frame = frameStateUtil.getFrameByTabId(state, action.tabId)
        if (frame) {
          menu.setCurrentLocation(frame.location)
          menu.setMenuItemAttribute(state, locale.translation('bookmarkPage'), 'checked', menu.isCurrentLocationBookmarked(state))
        }
        break
      }
    case appConstants.APP_CHANGE_SETTING:
      if (action.key === settings.SHOW_BOOKMARKS_TOOLBAR) {
        // Update the checkbox next to "Bookmarks Toolbar" (Bookmarks menu)
        menu.setMenuItemAttribute(state, locale.translation('bookmarksToolbar'), 'checked', action.value)
      }
      if (action.key === settings.DEBUG_ALLOW_MANUAL_TAB_DISCARD) {
        menu.setMenuItemAttribute(state, 'Allow manual tab discarding', 'checked', action.value)
      }
      break
    case windowConstants.WINDOW_UNDO_CLOSED_FRAME:
      {
        if (!lastClosedUrl) {
          break
        }
        closedFrames = closedFrames.delete(lastClosedUrl)
        const nextLastFrame = closedFrames.last()
        lastClosedUrl = nextLastFrame ? nextLastFrame.get('location') : null
        menu.updateRecentlyClosedMenuItems(state)
        break
      }
    case windowConstants.WINDOW_CLEAR_CLOSED_FRAMES:
      {
        if (!action.location) {
          closedFrames = new Immutable.OrderedMap()
          lastClosedUrl = null
        } else {
          closedFrames = closedFrames.delete(action.location)
          if (lastClosedUrl === action.location) {
            lastClosedUrl = null
          }
        }
        menu.updateRecentlyClosedMenuItems(state)
        break
      }
    case appConstants.APP_TAB_CLOSE_REQUESTED:
      {
        action = makeImmutable(action)
        const tabId = action.get('tabId')
        if (tabId) {
          const tab = getByTabId(state, tabId)
          const frame = tab && tab.get('frame')
          if (tab && !tab.get('incognito') && frame && frameStateUtil.isValidClosedFrame(frame)) {
            lastClosedUrl = tab.get('url')
            closedFrames = closedFrames.set(tab.get('url'), tab.get('frame'))
            menu.updateRecentlyClosedMenuItems(state)
          }
        }
        break
      }
    case appConstants.APP_ADD_BOOKMARK:
    case appConstants.APP_EDIT_BOOKMARK:
    case appConstants.APP_MOVE_BOOKMARK:
    case appConstants.APP_REMOVE_BOOKMARK:
    case appConstants.APP_ADD_BOOKMARK_FOLDER:
    case appConstants.APP_MOVE_BOOKMARK_FOLDER:
    case appConstants.APP_EDIT_BOOKMARK_FOLDER:
    case appConstants.APP_REMOVE_BOOKMARK_FOLDER:
      menu.init(state)
      break
    case appConstants.APP_ON_CLEAR_BROWSING_DATA:
      {
        const defaults = state.get('clearBrowsingDataDefaults')
        const temp = state.get('tempClearBrowsingData', Immutable.Map())
        const clearData = defaults ? defaults.merge(temp) : temp
        if (clearData.get('browserHistory')) {
          menu.init(state)
        }
        break
      }
    case windowConstants.WINDOW_CLICK_MENUBAR_SUBMENU:
      {
        const appMenu = menu.getAppMenu()
        const clickedMenuItem = menuUtil.getMenuItem(appMenu, action.label)
        if (clickedMenuItem) {
          const focusedWindow = BrowserWindow.getFocusedWindow()
          clickedMenuItem.click(clickedMenuItem, focusedWindow, focusedWindow.webContents)
        }
        break
      }
    case appConstants.APP_WINDOW_CLOSED:
    case appConstants.APP_WINDOW_CREATED:
      {
        const windowCount = getAllRendererWindows().length
        if (action.actionType === appConstants.APP_WINDOW_CLOSED && windowCount === 0) {
          menu.updateShareMenuItems(state, false)
        } else if (action.actionType === appConstants.APP_WINDOW_CREATED && windowCount === 1) {
          menu.updateShareMenuItems(state, true)
        }
        break
      }
    default:
  }

  return state
}

module.exports = menuReducer
