/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const CommonMenu = require('../commonMenu')
const messages = require('../constants/messages')
const siteTags = require('../constants/siteTags')
const eventUtil = require('./eventUtil')
const siteUtil = require('../state/siteUtil')
const locale = require('../../app/locale')

// States which can trigger dynamic menus to change
let lastSettingsState, lastSites, lastClosedFrames

/**
 * Get an electron MenuItem object for the PARENT menu (File, Edit, etc) based on its label
 * @param {string} label - the text associated with the menu
 * NOTE: label may be a localized string
 */
module.exports.getParentMenuDetails = (appMenu, label) => {
  let menuIndex = -1
  let menuItem = null

  if (label && appMenu && appMenu.items && appMenu.items.length > 0) {
    menuIndex = appMenu.items.findIndex(function (item, index) {
      return item && item.label === label
    })

    if (menuIndex !== -1) {
      menuItem = appMenu.items[menuIndex]
    }
  }

  return {
    menu: menuItem,
    index: menuIndex
  }
}

/**
 * Get the an electron MenuItem object from a Menu based on its label
 * @param {string} label - the text associated with the menu
 * NOTE: label may be a localized string
 */
module.exports.getMenuItem = (appMenu, label) => {
  if (appMenu && appMenu.items && appMenu.items.length > 0) {
    for (let i = 0; i < appMenu.items.length; i++) {
      const menuItem = appMenu.items[i].submenu && appMenu.items[i].submenu.items.find(function (item) {
        return item && item.label === label
      })
      if (menuItem) return menuItem
    }
  }
  return null
}

/**
 * Check for uneeded updates.
 * Updating the menu when it is not needed causes the menu to close if expanded
 * and also causes menu clicks to not work.  So we don't want to update it a lot.
 * Should only be updated when appState or windowState change (for history or bookmarks)
 * NOTE: settingsState is not used directly; it gets used indirectly via getSetting()
 * @param {Object} appState - Application state
 * @param {Object} windowState - Current window state
 */
module.exports.checkForUpdate = (appState, windowState) => {
  const updated = {
    nothing: true,
    settings: false,
    sites: false,
    closedFrames: false
  }

  if (appState && appState.get('settings') !== lastSettingsState) {
    // Currently only used for the HOMEPAGE value (bound to history menu)
    lastSettingsState = appState.get('settings')
    updated.nothing = false
    updated.settings = true
  }

  if (appState && appState.get('sites') !== lastSites) {
    lastSites = appState.get('sites')
    updated.nothing = false
    updated.sites = true
  }

  if (windowState && windowState.closedFrames !== lastClosedFrames) {
    lastClosedFrames = windowState.closedFrames
    updated.nothing = false
    updated.closedFrames = true
  }

  return updated
}

const createBookmarkMenuItems = (bookmarks, parentFolderId) => {
  const filteredBookmarks = parentFolderId
    ? bookmarks.filter((bookmark) => bookmark.get('parentFolderId') === parentFolderId)
    : bookmarks.filter((bookmark) => !bookmark.get('parentFolderId'))

  const payload = []
  filteredBookmarks.forEach((site) => {
    if (site.get('tags').includes(siteTags.BOOKMARK) && site.get('location')) {
      payload.push({
        // TODO include label made from favicon. It needs to be of type NativeImage
        // which can be made using a Buffer / DataURL / local image
        // the image will likely need to be included in the site data
        // there was potentially concern about the size of the app state
        // and as such there may need to be another mechanism or cache
        //
        // see: https://github.com/brave/browser-laptop/issues/3050
        label: site.get('customTitle') || site.get('title'),
        click: (item, focusedWindow, e) => {
          if (eventUtil.isForSecondaryAction(e)) {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, site.get('location'), { openInForeground: !!e.shiftKey }])
          } else {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL, site.get('location')])
          }
        }
      })
    } else if (siteUtil.isFolder(site)) {
      const folderId = site.get('folderId')
      const submenuItems = bookmarks.filter((bookmark) => bookmark.get('parentFolderId') === folderId)
      payload.push({
        label: site.get('customTitle') || site.get('title'),
        submenu: submenuItems.count() > 0 ? createBookmarkMenuItems(bookmarks, folderId) : null
      })
    }
  })
  return payload
}

module.exports.createBookmarkMenuItems = () => {
  if (lastSites) {
    return createBookmarkMenuItems(siteUtil.getBookmarks(lastSites))
  }
  return []
}

module.exports.createRecentlyClosedMenuItems = () => {
  const payload = []
  if (lastClosedFrames && lastClosedFrames.length > 0) {
    payload.push(
      CommonMenu.separatorMenuItem,
      {
        label: locale.translation('recentlyClosed'),
        enabled: false
      })

    const lastTen = (lastClosedFrames.size < 10) ? lastClosedFrames : lastClosedFrames.slice(-10)
    lastTen.forEach((closedFrame) => {
      payload.push({
        label: closedFrame.title,
        click: (item, focusedWindow, e) => {
          if (eventUtil.isForSecondaryAction(e)) {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, closedFrame.location, { openInForeground: !!e.shiftKey }])
          } else {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL, closedFrame.location])
          }
        }
      })
    })
  }
  return payload
}
