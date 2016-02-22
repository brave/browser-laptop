/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = global.require('electron')
const remote = electron.remote
const Menu = remote.require('menu')
const Immutable = require('immutable')
const clipboard = electron.clipboard
const messages = require('./constants/messages')
const WindowStore = require('./stores/windowStore')
const WindowActions = require('./actions/windowActions')
const AppActions = require('./actions/appActions')
const siteTags = require('./constants/siteTags')
const siteUtil = require('./state/siteUtil')
const CommonMenu = require('./commonMenu')
const ipc = global.require('electron').ipcRenderer

/**
 * Obtains an add bookmark menu item
 * @param {object} Detail of the bookmark to initialize with
 */
const addBookmarkMenuItem = (bookmarkDetail) => {
  return {
    label: 'Add Bookmark...',
    click: () => {
      WindowActions.setBookmarkDetail(bookmarkDetail)
    }
  }
}

const addFolderMenuItem = {
  label: 'Add Folder...',
  click: () => {
    const emptyFolder = Immutable.fromJS({tags: [siteTags.BOOKMARK_FOLDER]})
    WindowActions.setBookmarkDetail(emptyFolder)
  }
}

function tabPageTemplateInit (framePropsList) {
  const muteAll = (framePropsList, mute) => {
    framePropsList.forEach(frameProps => {
      if (mute && frameProps.get('audioPlaybackActive') && !frameProps.get('audioMuted')) {
        WindowActions.setAudioMuted(frameProps, true)
      } else if (!mute && frameProps.get('audioMuted')) {
        WindowActions.setAudioMuted(frameProps, false)
      }
    })
  }
  return [{
    label: 'Unmute tabs',
    click: (item, focusedWindow) => {
      muteAll(framePropsList, false)
    }
  }, {
    label: 'Mute tabs',
    click: (item, focusedWindow) => {
      muteAll(framePropsList, true)
    }
  }]
}

function inputTemplateInit (e) {
  const hasSelection = e.target.selectionStart !== undefined &&
      e.target.selectionEnd !== undefined &&
      e.target.selectionStart !== e.target.selectionEnd
  return getEditableItems(hasSelection)
}

function tabsToolbarTemplateInit (settingsState, activeFrame) {
  return [
    CommonMenu.bookmarksMenuItem,
    CommonMenu.bookmarksToolbarMenuItem(settingsState),
    CommonMenu.separatorMenuItem,
    addBookmarkMenuItem(siteUtil.getDetailFromFrame(activeFrame, siteTags.BOOKMARK)),
    addFolderMenuItem
  ]
}

function moreBookmarksTemplateInit (activeFrame, bookmarks) {
  return bookmarks.map(bookmark => {
    return {
      label: bookmark.get('title'),
      click: () => {
        WindowActions.loadUrl(activeFrame, bookmark.get('location'))
      }
    }
  }).toJS()
}

function bookmarkTemplateInit (bookmarkDetail, activeFrame) {
  const location = bookmarkDetail.get('location')
  const title = bookmarkDetail.get('title')
  const partitionNumber = bookmarkDetail.get('partitionNumber')
  const isFolder = bookmarkDetail.get('tags').includes(siteTags.BOOKMARK_FOLDER)
  const template = []
  if (!isFolder) {
    template.push(openInNewTabMenuItem(location),
      openInNewPrivateTabMenuItem(location),
      openInNewSessionTabMenuItem(location),
      copyLinkLocationMenuItem(location),
      CommonMenu.separatorMenuItem)
  }

  template.push(
    {
      label: isFolder ? 'Edit Folder...' : 'Edit Bookmark...',
      click: () => {
        // originalLocation is undefined signifies add mode
        WindowActions.setBookmarkDetail(bookmarkDetail, bookmarkDetail)
      }
    },
    CommonMenu.separatorMenuItem, {
      label: isFolder ? 'Delete Folder' : 'Delete Bookmark',
      click: () => {
        AppActions.removeSite({
          location,
          partitionNumber,
          title
        }, bookmarkDetail.get('tags').includes(siteTags.BOOKMARK_FOLDER) ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK)
      }
    },
    CommonMenu.separatorMenuItem,
    addBookmarkMenuItem(siteUtil.getDetailFromFrame(activeFrame, siteTags.BOOKMARK)),
    addFolderMenuItem)
  return template
}

function showBookmarkFolderInit (title) {
  return [{
    label: '(empty)',
    enabled: false
  }]
}

function tabTemplateInit (frameProps) {
  const tabKey = frameProps.get('key')
  const items = []
  items.push({
    label: 'Reload tab',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_FRAME_RELOAD, tabKey)
      }
    }
  })

  if (!frameProps.get('isPrivate')) {
    if (frameProps.get('pinnedLocation')) {
      items.push({
        label: 'Unpin tab',
        click: (item) => {
          // Handle converting the current tab window into a pinned site
          WindowActions.setPinned(frameProps, false)
          // Handle setting it in app storage for the other windows
          AppActions.removeSite(frameProps, siteTags.PINNED)
        }
      })
    } else {
      items.push({
        label: 'Pin tab',
        click: (item) => {
          // Handle converting the current tab window into a pinned site
          WindowActions.setPinned(frameProps, true)
          // Handle setting it in app storage for the other windows
          AppActions.addSite(frameProps, siteTags.PINNED)
        }
      })
    }
  }

  if (frameProps.get('audioPlaybackActive')) {
    if (frameProps.get('audioMuted')) {
      items.push({
        label: 'Unmute tab',
        click: item => {
          WindowActions.setAudioMuted(frameProps, false)
        }
      })
    } else {
      items.push({
        label: 'Mute tab',
        click: item => {
          WindowActions.setAudioMuted(frameProps, true)
        }
      })
    }
  }

  Array.prototype.push.apply(items, [{
    label: 'Disable tracking protection',
    enabled: false
  }, {
    label: 'Disable ad block',
    enabled: false
  }])

  if (!frameProps.get('pinnedLocation')) {
    items.push({
      label: 'Close tab',
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          // TODO: Don't switch active tabs when this is called
          focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_FRAME, tabKey)
        }
      }
    })
  }

  items.push(Object.assign({},
    CommonMenu.reopenLastClosedTabItem,
    { enabled: WindowStore.getState().get('closedFrames').size > 0 }
  ))

  return items
}

function getEditableItems (hasSelection) {
  return [{
    label: 'Cut',
    enabled: hasSelection,
    accelerator: 'CmdOrCtrl+X',
    // Enabled doesn't work when a role is used
    role: hasSelection && 'cut' || undefined
  }, {
    label: 'Copy',
    enabled: hasSelection,
    accelerator: 'CmdOrCtrl+C',
    // Enabled doesn't work when a role is used
    role: hasSelection && 'copy' || undefined
  }, {
    label: 'Paste',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }]
}

function hamburgerTemplateInit (braverySettings, settingsState) {
  const template = [
    CommonMenu.newTabMenuItem,
    CommonMenu.newPrivateTabMenuItem,
    CommonMenu.newPartitionedTabMenuItem,
    CommonMenu.newWindowMenuItem,
    CommonMenu.separatorMenuItem,
    CommonMenu.findOnPageMenuItem,
    CommonMenu.printMenuItem,
    CommonMenu.separatorMenuItem,
    CommonMenu.buildBraveryMenu(braverySettings, function () {
      ipc.send(messages.UPDATE_APP_MENU, {bookmarked: braverySettings.bookmarked})
    }),
    CommonMenu.separatorMenuItem,
    CommonMenu.preferencesMenuItem,
    {
      label: 'Bookmarks',
      submenu: [
        CommonMenu.bookmarksMenuItem,
        CommonMenu.bookmarksToolbarMenuItem(settingsState)
      ]
    },
    CommonMenu.separatorMenuItem,
    CommonMenu.quitMenuItem
  ]
  return template
}

const openInNewTabMenuItem = location => {
  return {
    label: 'Open in new tab',
    click: () => {
      WindowActions.newFrame({ location }, false)
    }
  }
}

const openInNewPrivateTabMenuItem = location => {
  return {
    label: 'Open in new private tab',
    click: () => {
      WindowActions.newFrame({
        location,
        isPrivate: true
      }, false)
    }
  }
}

const openInNewSessionTabMenuItem = location => {
  return {
    label: 'Open in new session tab',
    click: (item, focusedWindow) => {
      WindowActions.newFrame({
        location,
        isPartitioned: true
      }, false)
    }
  }
}

const copyLinkLocationMenuItem = location => {
  return {
    label: 'Copy link address',
    click: () => {
      clipboard.writeText(location)
    }
  }
}

function mainTemplateInit (nodeProps, frame) {
  const template = []
  const nodeName = nodeProps.name

  if (nodeProps.href) {
    template.push(openInNewTabMenuItem(nodeProps.href),
      openInNewPrivateTabMenuItem(nodeProps.href),
      openInNewSessionTabMenuItem(nodeProps.href),
      copyLinkLocationMenuItem(nodeProps.href),
      CommonMenu.separatorMenuItem)
  }

  if (nodeName === 'IMG') {
    template.push({
      label: 'Save image...',
      click: (item, focusedWindow) => {
        if (focusedWindow && nodeProps.src) {
          focusedWindow.webContents.downloadURL(nodeProps.src)
        }
      }
    })
    template.push({
      label: 'Open image in new tab',
      click: (item, focusedWindow) => {
        if (focusedWindow && nodeProps.src) {
          // TODO: open this in the next tab instead of last tab
          focusedWindow.webContents.send(messages.SHORTCUT_NEW_FRAME, nodeProps.src)
        }
      }
    })
    template.push({
      label: 'Copy image address',
      click: (item, focusedWindow) => {
        if (focusedWindow && nodeProps.src) {
          clipboard.writeText(nodeProps.src)
        }
      }
    })
    template.push(CommonMenu.separatorMenuItem)
  }

  if (nodeName === 'TEXTAREA' || nodeName === 'INPUT' || nodeProps.isContentEditable) {
    const editableItems = getEditableItems(nodeProps.hasSelection)
    template.push({
      label: 'Undo',
      accelerator: 'CmdOrCtrl+Z',
      role: 'undo'
    }, {
      label: 'Redo',
      accelerator: 'Shift+CmdOrCtrl+Z',
      role: 'redo'
    }, CommonMenu.separatorMenuItem, ...editableItems)
  } else if (nodeProps.hasSelection) {
    template.push({
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    })
  }

  if (template.length > 0) {
    template.push(CommonMenu.separatorMenuItem)
  }

  template.push({
    label: 'Reload',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_RELOAD)
      }
    }
  }, {
    label: 'View Page Source',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE)
      }
    }
  },
  addBookmarkMenuItem(siteUtil.getDetailFromFrame(frame, siteTags.BOOKMARK)),
    {
      label: 'Add to reading list',
      enabled: false
    })
  return template
}

export function onHamburgerMenu (braverySettings, settingsState, e) {
  const hamburgerMenu = Menu.buildFromTemplate(hamburgerTemplateInit(braverySettings, settingsState))
  const rect = e.target.getBoundingClientRect()
  hamburgerMenu.popup(remote.getCurrentWindow(), rect.left, rect.bottom)
}

export function onMainContextMenu (nodeProps, frame, contextMenuType) {
  if (contextMenuType === 'bookmark') {
    // TODO: Should get the active frame here and use whatever partition they are in ideally
    onBookmarkContextMenu(nodeProps.location, 0, nodeProps.title, Immutable.fromJS({ location: '', title: '' }))
  } else {
    const mainMenu = Menu.buildFromTemplate(mainTemplateInit(nodeProps, frame))
    mainMenu.popup(remote.getCurrentWindow())
  }
}

export function onTabContextMenu (frameProps, e) {
  e.stopPropagation()
  const tabMenu = Menu.buildFromTemplate(tabTemplateInit(frameProps))
  tabMenu.popup(remote.getCurrentWindow())
}

export function onTabsToolbarContextMenu (settings, activeFrame, e) {
  e.stopPropagation()
  const tabsToolbarMenu = Menu.buildFromTemplate(tabsToolbarTemplateInit(settings, activeFrame))
  tabsToolbarMenu.popup(remote.getCurrentWindow())
}

export function onTabPageContextMenu (framePropsList, e) {
  e.stopPropagation()
  const tabPageMenu = Menu.buildFromTemplate(tabPageTemplateInit(framePropsList))
  tabPageMenu.popup(remote.getCurrentWindow())
}

export function onUrlBarContextMenu (e) {
  e.stopPropagation()
  const inputMenu = Menu.buildFromTemplate(inputTemplateInit(e))
  inputMenu.popup(remote.getCurrentWindow())
}

export function onBookmarkContextMenu (bookmarkDetail, activeFrame, e) {
  if (e) {
    e.stopPropagation()
  }
  const menu = Menu.buildFromTemplate(bookmarkTemplateInit(bookmarkDetail, activeFrame))
  menu.popup(remote.getCurrentWindow())
}

export function onShowBookmarkFolderMenu (title, e) {
  const menu = Menu.buildFromTemplate(showBookmarkFolderInit(title))
  const rectLeft = e.target.getBoundingClientRect()
  const rectBottom = e.target.parentNode.getBoundingClientRect()
  menu.popup(remote.getCurrentWindow(), rectLeft.left | 0, rectBottom.bottom | 0)
}

export function onMoreBookmarksMenu (activeFrame, bookmarks) {
  const menu = Menu.buildFromTemplate(moreBookmarksTemplateInit(activeFrame, bookmarks))
  menu.popup(remote.getCurrentWindow())
}
