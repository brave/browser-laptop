/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const CommonMenu = require('../../common/commonMenu')
const messages = require('../../../js/constants/messages')
const siteTags = require('../../../js/constants/siteTags')
const eventUtil = require('../../../js/lib/eventUtil')
const siteUtil = require('../../../js/state/siteUtil')
const locale = require('../../locale')

/**
 * Get the an electron MenuItem object from a Menu based on its label
 *
 * @param {Object} appMenu - the electron Menu object
 * @param {string} label - text to search each menu item for
 * NOTE: label is a localized string
 */
module.exports.getMenuItem = (appMenu, label) => {
  if (appMenu && appMenu.items && appMenu.items.length > 0) {
    for (let i = 0; i < appMenu.items.length; i++) {
      const item = appMenu.items[i]
      if (item && item.label === label) return item
      if (item.submenu) {
        const nestedItem = module.exports.getMenuItem(item.submenu, label)
        if (nestedItem) return nestedItem
      }
    }
  }
  return null
}

/**
 * Similar to getMenuItem (above) but with a menu template. The menu template
 * is used by our tests and also with the custom rendered Windows titlebar.
 *
 * @param {Object} template - object in the format which gets passed to Menu.buildFromTemplate()
 * @param {string} label - text to search each menu item for
 * NOTE: label is a localized string
 */
const getTemplateItem = (template, label) => {
  if (template && template.length && template.length > 0) {
    for (let i = 0; i < template.length; i++) {
      const item = template[i]
      if (item && item.label === label) return item
      if (item.submenu) {
        const nestedItem = getTemplateItem(item.submenu, label)
        if (nestedItem) return nestedItem
      }
    }
  }
  return null
}

/**
 * Search a menu template and update the checked status
 *
 * @return the new template OR null if no change was made (no update needed)
 */
module.exports.setTemplateItemChecked = (template, label, checked) => {
  const menu = template.toJS()
  const menuItem = getTemplateItem(menu, label)
  if (menuItem.checked !== checked) {
    menuItem.checked = checked
    return Immutable.fromJS(menu)
  }
  return null
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
        label: site.get('customTitle') || site.get('title') || site.get('location'),
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

/**
 * Add bookmarks / folders to "Bookmarks" menu
 *
 * @param sites The application state's Immutable sites list
 */
module.exports.createBookmarkMenuItems = (sites) => {
  return createBookmarkMenuItems(siteUtil.getBookmarks(sites))
}

module.exports.createRecentlyClosedMenuItems = (lastClosedFrames) => {
  const payload = []
  if (lastClosedFrames && lastClosedFrames.size > 0) {
    payload.push(
      CommonMenu.separatorMenuItem,
      {
        label: locale.translation('recentlyClosed'),
        enabled: false
      })

    const lastTen = (lastClosedFrames.size < 10) ? lastClosedFrames : lastClosedFrames.slice(-10)
    lastTen.forEach((closedFrame) => {
      payload.push({
        label: closedFrame.get('title') || closedFrame.get('location'),
        click: (item, focusedWindow, e) => {
          if (eventUtil.isForSecondaryAction(e)) {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, closedFrame.get('location'), { openInForeground: !!e.shiftKey }])
          } else {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL, closedFrame.get('location')])
          }
        }
      })
    })
  }
  return payload
}
