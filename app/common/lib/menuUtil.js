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

const createBookmarkTemplateItems = (bookmarks, parentFolderId) => {
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
        submenu: submenuItems.count() > 0 ? createBookmarkTemplateItems(bookmarks, folderId) : null
      })
    }
  })
  return payload
}

/**
 * Used to create bookmarks and bookmark folder entries for the "Bookmarks" menu
 *
 * @param sites The application state's Immutable sites list
 */
module.exports.createBookmarkTemplateItems = (sites) => {
  return createBookmarkTemplateItems(siteUtil.getBookmarks(sites))
}

/**
 * Create "recently closed" history entries for the "History" menu
 */
module.exports.createRecentlyClosedTemplateItems = (lastClosedFrames) => {
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

const isItemValid = (currentItem, previousItem) => {
  if (previousItem && previousItem === CommonMenu.separatorMenuItem) {
    if (currentItem === CommonMenu.separatorMenuItem) {
      return false
    }
  }
  return currentItem && (typeof currentItem.l10nLabelId === 'string' || typeof currentItem.label === 'string' || currentItem.type === 'separator')
}

/**
 * Remove invalid entries from a menu template:
 * - null or falsey entries
 * - extra menu separators
 * - entries which don't have a label (or l10nLabelId) if their type is not 'separator'
 */
module.exports.sanitizeTemplateItems = (template) => {
  const reduced = template.reduce((result, currentValue, currentIndex, array) => {
    const previousItem = result.length > 0
      ? result[result.length - 1]
      : undefined
    if (isItemValid(currentValue, previousItem)) {
      result.push(currentValue)
    }
    return result
  }, [])

  const result = Array.isArray(reduced)
    ? reduced
    : [reduced]

  if (result.length > 0 && result[0] === CommonMenu.separatorMenuItem) {
    result.shift()
  }

  if (result.length > 0 && result[result.length - 1] === CommonMenu.separatorMenuItem) {
    result.pop()
  }

  return result
}
