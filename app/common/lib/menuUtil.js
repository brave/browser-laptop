/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const MenuItem = require('electron').MenuItem

// Constants
const config = require('../../../js/constants/config')

// State
const bookmarksState = require('../state/bookmarksState')

// Actions
const appActions = require('../../../js/actions/appActions')
const windowActions = require('../../../js/actions/windowActions')

// Utils
const {makeImmutable} = require('../../common/state/immutableUtil')
const CommonMenu = require('../../common/commonMenu')
const eventUtil = require('../../../js/lib/eventUtil')
const locale = require('../../locale')
const {separatorMenuItem} = require('../../common/commonMenu')
const bookmarkUtil = require('./bookmarkUtil')
const bookmarkFoldersUtil = require('./bookmarkFoldersUtil')
const {isSourceAboutUrl} = require('../../../js/lib/appUrlUtil')

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

module.exports.extractSiteName = (type) => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

/**
 * Searches a menu template and updates a passed item key
 *
 * @return the new template OR null if no change was made (no update needed)
 */
module.exports.setTemplateItemAttribute = (template, label, key, value) => {
  const menu = template.toJS()
  const menuItem = getTemplateItem(menu, label)
  if (menuItem[key] !== value) {
    menuItem[key] = value
    return makeImmutable(menu)
  }
  return null
}

const createBookmarkTemplateItems = (state, parentFolderId) => {
  const bookmarks = bookmarksState.getBookmarksWithFolders(state, parentFolderId)

  const payload = []
  for (let bookmark of bookmarks) {
    if (bookmarkUtil.isBookmark(bookmark) && bookmark.get('location')) {
      payload.push({
        // TODO include label made from favicon. It needs to be of type NativeImage
        // which can be made using a Buffer / DataURL / local image
        // the image will likely need to be included in the site data
        // there was potentially concern about the size of the app state
        // and as such there may need to be another mechanism or cache
        //
        // see: https://github.com/brave/browser-laptop/issues/3050
        label: bookmark.get('title') || bookmark.get('location'),
        click: (item, focusedWindow, e) => {
          if (eventUtil.isForSecondaryAction(e)) {
            appActions.createTabRequested({
              url: bookmark.get('location'),
              windowId: focusedWindow.id,
              active: !!e.shiftKey
            })
          } else {
            appActions.loadURLInActiveTabRequested(focusedWindow.id, bookmark.get('location'))
          }
        }
      })
    } else if (bookmarkFoldersUtil.isFolder(bookmark)) {
      payload.push({
        label: bookmark.get('title'),
        submenu: createBookmarkTemplateItems(state, bookmark.get('folderId'))
      })
    }
  }

  return payload
}

/**
 * Used to create bookmarks and bookmark folder entries for the "Bookmarks" menu
 *
 * @param state The application state
 */
module.exports.createBookmarkTemplateItems = (state) => {
  return createBookmarkTemplateItems(state)
}

/**
 * Used to create bookmarks and bookmark folder entries for "Other Bookamrks" in the "Bookmarks" menu
 *
 * @param state The application state
 */
module.exports.createOtherBookmarkTemplateItems = (state) => {
  return createBookmarkTemplateItems(state, -1)
}

/**
 * @param {string} key within closedFrames, i.e. a URL
 * @return {string}
 */
const getRecentlyClosedMenuId = function (key) {
  return `recentlyClosedFrame|${key}`
}
module.exports.getRecentlyClosedMenuId = getRecentlyClosedMenuId

/**
 * @param {string} menuId
 * @return {string} key within closedFrames, i.e. a URL
 */
const getRecentlyClosedMenuKey = function (menuId) {
  if (typeof menuId !== 'string' || menuId.indexOf('recentlyClosedFrame|') === -1) {
    return undefined
  }
  return menuId.split('|')[1]
}

const recentlyClosedClickHandler = (frame) => {
  return (item, focusedWindow, e) => {
    const location = frame.get('location')
    if (eventUtil.isForSecondaryAction(e)) {
      appActions.createTabRequested({
        url: location,
        windowId: focusedWindow.id,
        active: !!e.shiftKey
      })
    } else {
      appActions.loadURLInActiveTabRequested(focusedWindow.id, location)
    }
  }
}

const getFrameMenuLabel = (frame) => {
  return frame.get('title') || frame.get('location')
}

const recentlyClosedTemplate = (key, frame) => {
  return {
    id: getRecentlyClosedMenuId(key),
    click: recentlyClosedClickHandler(frame),
    label: getFrameMenuLabel(frame)
  }
}

module.exports.recentlyClosedHeadingTemplates = () => {
  return [
    {
      id: 'recentlyClosedSeparator',
      type: 'separator'
    },
    {
      id: 'recentlyClosedHeading',
      label: locale.translation('recentlyClosed'),
      enabled: false
    }
  ]
}

/**
 * Create "recently closed" history entries for the "History" menu.
 * Labels and visibility change dynamically in updateRecentlyClosedMenuItems.
 * @param {Immutable.OrderedMap} closedFrames
 */
module.exports.createRecentlyClosedTemplateItems = (closedFrames) => {
  let payload = module.exports.recentlyClosedHeadingTemplates()
  if (!closedFrames || !closedFrames.size) {
    return payload.map((item) => {
      item.visible = false
      return item
    })
  }
  let n = 0
  closedFrames.reverse().forEach((frame) => {
    payload.push(recentlyClosedTemplate(n, frame))
    n = n + 1
    if (n >= config.menu.maxClosedFrames) {
      return false
    }
  })
  return payload
}

/**
 * Update display of History menu "Recently closed" menu items by
 * inserting MenuItems or hiding existing MenuItems.
 * @param {electron.Menu} appMenu
 * @param {Immutable.OrderedMap} closedFrames
 */
module.exports.updateRecentlyClosedMenuItems = (appMenu, closedFrames) => {
  const headingVisible = closedFrames.size > 0
  const maxMenuItems = config.menu.maxClosedFrames
  const historyLabel = locale.translation('history')
  const historyMenu = module.exports.getMenuItem(appMenu, historyLabel).submenu
  let insertPosition = 0

  const historyMenuIndicesByOrder = {}
  for (let i = 0; i < historyMenu.items.length; i++) {
    const item = historyMenu.items[i]
    // New items go after "Recently closed"
    if (!insertPosition && item.id === 'recentlyClosedHeading') {
      insertPosition = i + 1
      item.visible = headingVisible
      continue
    } else if (item.id === 'recentlyClosedSeparator') {
      item.visible = headingVisible
      continue
    }

    // Find existing items
    const key = getRecentlyClosedMenuKey(item.id)
    if (typeof key !== 'string') {
      continue
    }
    // Undo close tab removes closed frames.
    if (!closedFrames.get(key)) {
      item.visible = false
      continue
    }
    historyMenuIndicesByOrder[key] = i
  }

  let visibleItems = 0
  closedFrames.reverse().forEach((frame, url) => {
    // About pages should not be displayed in recently closed items
    const isAboutUrl = isSourceAboutUrl(frame.get('location'))
    if (isAboutUrl) {
      return
    }
    const menuIndex = historyMenuIndicesByOrder[url]
    if (visibleItems >= maxMenuItems) {
      if (menuIndex) {
        historyMenu.items[menuIndex].visible = false
      }
      return
    }
    if (menuIndex) {
      historyMenu.items[menuIndex].visible = true
      visibleItems += 1
    } else {
      const template = recentlyClosedTemplate(url, frame)
      const item = new MenuItem(template)
      // XXX: Can't set this with MenuItem constructor
      item.id = template.id
      historyMenu.insert(insertPosition, item)
      visibleItems += 1
      insertPosition = insertPosition + 1
    }
  })
  return appMenu
}

const isItemValid = (currentItem, previousItem) => {
  if (previousItem && previousItem === CommonMenu.separatorMenuItem) {
    if (currentItem === CommonMenu.separatorMenuItem) {
      return false
    }
  }

  return currentItem && (typeof currentItem.l10nLabelId === 'string' || typeof currentItem.label === 'string' ||
    currentItem.type === 'separator' || typeof currentItem.slice === 'function' || typeof currentItem.labelDataBind === 'string')
}

const sanitizeTemplateItems = (template) => {
  const reduced = template.reduce((result, currentValue, currentIndex, array) => {
    const previousItem = result.length > 0
      ? result[result.length - 1]
      : undefined
    if (currentValue && currentValue.submenu) {
      currentValue.submenu = sanitizeTemplateItems(currentValue.submenu)
    }
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

/**
 * Remove invalid entries from a menu template:
 * - null or falsey entries
 * - extra menu separators
 * - entries which don't have a label (or l10nLabelId) if their type is not 'separator'
 */
module.exports.sanitizeTemplateItems = sanitizeTemplateItems

const bindClickHandler = (contextMenu, lastFocusedSelector) => {
  if (contextMenu.type === separatorMenuItem.type) {
    return contextMenu
  }
  contextMenu.click = function (e) {
    e.preventDefault()
    if (lastFocusedSelector) {
      // Send focus back to the active web frame
      const results = document.querySelectorAll(lastFocusedSelector)
      if (results.length === 1) results[0].focus()
    }
    windowActions.clickMenubarSubmenu(contextMenu.label)
  }
  if (contextMenu.submenu) {
    contextMenu.submenu = contextMenu.submenu.map((submenuItem) => {
      return bindClickHandler(submenuItem, lastFocusedSelector)
    })
  }
  return contextMenu
}

module.exports.showContextMenu = (rect, submenu, lastFocusedSelector) => {
  windowActions.setContextMenuDetail(makeImmutable({
    left: rect.left,
    top: rect.bottom,
    template: submenu.map((submenuItem) => {
      return bindClickHandler(submenuItem, lastFocusedSelector)
    })
  }))
}
