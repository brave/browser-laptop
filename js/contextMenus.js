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
const windowActions = require('./actions/windowActions')
const bookmarkActions = require('./actions/bookmarkActions')
const downloadActions = require('./actions/downloadActions')
const appActions = require('./actions/appActions')
const siteTags = require('./constants/siteTags')
const dragTypes = require('./constants/dragTypes')
const siteUtil = require('./state/siteUtil')
const downloadUtil = require('./state/downloadUtil')
const CommonMenu = require('./commonMenu')
const dnd = require('./dnd')
const dndData = require('./dndData')
const appStoreRenderer = require('./stores/appStoreRenderer')
const ipc = global.require('electron').ipcRenderer
const getSetting = require('./settings').getSetting
const settings = require('./constants/settings')

/**
 * Obtains an add bookmark menu item
 * @param {object} Detail of the bookmark to initialize with
 */
const addBookmarkMenuItem = (siteDetail, closestDestinationDetail, isParent) => {
  return {
    label: 'Add Bookmark...',
    click: () => {
      if (isParent) {
        siteDetail = siteDetail.set('parentFolderId', closestDestinationDetail && (closestDestinationDetail.get('folderId') || closestDestinationDetail.get('parentFolderId')))
      }
      windowActions.setBookmarkDetail(siteDetail, undefined, closestDestinationDetail)
    }
  }
}

const addFolderMenuItem = (closestDestinationDetail, isParent) => {
  return {
    label: 'Add Folder...',
    click: () => {
      let emptyFolder = Immutable.fromJS({ tags: [siteTags.BOOKMARK_FOLDER] })
      if (isParent) {
        emptyFolder = emptyFolder.set('parentFolderId', closestDestinationDetail && (closestDestinationDetail.get('folderId') || closestDestinationDetail.get('parentFolderId')))
      }
      windowActions.setBookmarkDetail(emptyFolder, undefined, closestDestinationDetail)
    }
  }
}

function tabPageTemplateInit (framePropsList) {
  const muteAll = (framePropsList, mute) => {
    framePropsList.forEach((frameProps) => {
      if (mute && frameProps.get('audioPlaybackActive') && !frameProps.get('audioMuted')) {
        windowActions.setAudioMuted(frameProps, true)
      } else if (!mute && frameProps.get('audioMuted')) {
        windowActions.setAudioMuted(frameProps, false)
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

function tabsToolbarTemplateInit (activeFrame, closestDestinationDetail, isParent) {
  return [
    CommonMenu.bookmarksMenuItem,
    CommonMenu.bookmarksToolbarMenuItem(),
    CommonMenu.separatorMenuItem,
    addBookmarkMenuItem(siteUtil.getDetailFromFrame(activeFrame, siteTags.BOOKMARK), closestDestinationDetail, isParent),
    addFolderMenuItem(closestDestinationDetail, isParent)
  ]
}

function downloadsToolbarTemplateInit (downloadId, downloadItem) {
  const menu = []

  if (downloadItem) {
    const downloads = appStoreRenderer.state.get('downloads')
    if (downloadUtil.shouldAllowPause(downloadItem)) {
      menu.push({
        label: 'Pause',
        click: downloadActions.pauseDownload.bind(null, downloadId)
      })
    }

    if (downloadUtil.shouldAllowResume(downloadItem)) {
      menu.push({
        label: 'Resume',
        click: downloadActions.resumeDownload.bind(null, downloadId)
      })
    }

    if (downloadUtil.shouldAllowCancel(downloadItem)) {
      menu.push({
        label: 'Cancel',
        click: downloadActions.cancelDownload.bind(null, downloadId)
      })
    }

    if (downloadUtil.shouldAllowRedownload(downloadItem)) {
      menu.push({
        label: 'Download Again',
        click: downloadActions.redownloadURL.bind(null, downloadItem, downloadId)
      })
    }

    if (downloadUtil.shouldAllowCopyLink(downloadItem)) {
      menu.push({
        label: 'Copy Link Location',
        click: downloadActions.copyLinkToClipboard.bind(null, downloadItem)
      })
    }

    if (downloadUtil.shouldAllowOpenDownloadLocation(downloadItem)) {
      menu.push({
        label: 'Open Folder Path',
        click: downloadActions.locateShellPath.bind(null, downloadItem)
      })
    }

    if (downloadUtil.shouldAllowDelete(downloadItem)) {
      menu.push({
        label: 'Delete Download',
        click: downloadActions.deleteDownload.bind(null, downloads, downloadItem, downloadId)
      })
    }

    if (downloadUtil.shouldAllowRemoveFromList(downloadItem)) {
      menu.push({
        label: 'Clear Download',
        click: downloadActions.clearDownload.bind(null, downloads, downloadId)
      })
    }
    menu.push(CommonMenu.separatorMenuItem)
  }

  if (appStoreRenderer.state.getIn(['ui', 'downloadsToolbar', 'isVisible'])) {
    menu.push({
      label: 'Hide downloads bar',
      click: () => {
        windowActions.setDownloadsToolbarVisible(false)
      }
    })
  }

  menu.push(CommonMenu.separatorMenuItem,
    {
      label: 'Clear completed downloads',
      click: () => {
        appActions.clearCompletedDownloads()
      }
    })
  return menu
}

function bookmarkTemplateInit (siteDetail, activeFrame) {
  const location = siteDetail.get('location')
  const isFolder = siteDetail.get('tags').includes(siteTags.BOOKMARK_FOLDER)
  const template = []
  if (!isFolder) {
    template.push(openInNewTabMenuItem(location, undefined, siteDetail.get('partitionNumber')),
      openInNewPrivateTabMenuItem(location),
      openInNewSessionTabMenuItem(location),
      copyLinkLocationMenuItem(location),
      CommonMenu.separatorMenuItem)
  } else {
    template.push(openAllInNewTabsMenuItem(appStoreRenderer.state.get('sites'), siteDetail),
      CommonMenu.separatorMenuItem)
  }

  // We want edit / delete items for everything except for the bookmarks toolbar item
  if (!isFolder || siteDetail.get('folderId') !== 0) {
    template.push(
      {
        label: isFolder ? 'Edit Folder...' : 'Edit Bookmark...',
        click: () => {
          // originalLocation is undefined signifies add mode
          windowActions.setBookmarkDetail(siteDetail, siteDetail)
        }
      })

    template.push(
      CommonMenu.separatorMenuItem, {
        label: isFolder ? 'Delete Folder' : 'Delete Bookmark',
        click: () => {
          appActions.removeSite(siteDetail, siteDetail.get('tags').includes(siteTags.BOOKMARK_FOLDER) ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK)
        }
      }, CommonMenu.separatorMenuItem)
  }

  template.push(addBookmarkMenuItem(siteUtil.getDetailFromFrame(activeFrame, siteTags.BOOKMARK), siteDetail, true),
    addFolderMenuItem(siteDetail, true))
  return template
}

function showBookmarkFolderInit (allBookmarkItems, parentBookmarkFolder, activeFrame) {
  const items = siteUtil.filterSitesRelativeTo(allBookmarkItems, parentBookmarkFolder)
  if (items.size === 0) {
    return [{
      l10nLabelId: 'emptyFolderItem',
      enabled: false,
      dragOver: function (e) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      },
      drop (e) {
        e.preventDefault()
        const bookmark = dnd.prepareBookmarkDataFromCompatible(e.dataTransfer)
        if (bookmark) {
          appActions.moveSite(bookmark, parentBookmarkFolder, false, true)
        }
      }
    }]
  }
  return bookmarkItemsInit(allBookmarkItems, items, activeFrame)
}

function bookmarkItemsInit (allBookmarkItems, items, activeFrame) {
  return items.map((site) => {
    const isFolder = siteUtil.isFolder(site)
    const templateItem = {
      bookmark: site,
      draggable: true,
      label: site.get('customTitle') || site.get('title') || site.get('location'),
      contextMenu: function (e) {
        onBookmarkContextMenu(site, activeFrame, e)
      },
      dragEnd: function (e) {
        dnd.onDragEnd(dragTypes.BOOKMARK, site, e)
      },
      dragStart: function (e) {
        dnd.onDragStart(dragTypes.BOOKMARK, site, e)
      },
      dragOver: function (e) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      },
      drop: function (e) {
        e.preventDefault()
        const bookmarkItem = dnd.prepareBookmarkDataFromCompatible(e.dataTransfer)
        if (bookmarkItem) {
          appActions.moveSite(bookmarkItem, site, dndData.shouldPrependVerticalItem(e.target, e.clientY))
        }
      },
      click: function (e) {
        bookmarkActions.clickBookmarkItem(allBookmarkItems, site, activeFrame, e)
      }
    }
    if (isFolder) {
      templateItem.submenu = showBookmarkFolderInit(allBookmarkItems, site, activeFrame)
    }
    return templateItem
  }).toJS()
}

function moreBookmarksTemplateInit (allBookmarkItems, bookmarks, activeFrame) {
  const template = bookmarkItemsInit(allBookmarkItems, bookmarks, activeFrame)
  template.push({
    l10nLabelId: 'moreBookmarks',
    click: function () {
      windowActions.newFrame({ location: 'about:bookmarks' })
      windowActions.setContextMenuDetail()
    }
  })
  return template
}

function usernameTemplateInit (usernames, origin, action) {
  let items = []
  for (let username in usernames) {
    let password = usernames[username]
    items.push({
      label: username,
      click: (item, focusedWindow) => {
        windowActions.setActiveFrameShortcut(null, messages.FILL_PASSWORD, {
          username,
          password,
          origin,
          action
        })
        windowActions.setContextMenuDetail()
      }
    })
  }
  return items
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
          windowActions.setPinned(frameProps, false)
        }
      })
    } else {
      items.push({
        label: 'Pin tab',
        click: (item) => {
          // Handle converting the current tab window into a pinned site
          windowActions.setPinned(frameProps, true)
        }
      })
    }
  }

  if (frameProps.get('audioPlaybackActive')) {
    if (frameProps.get('audioMuted')) {
      items.push({
        label: 'Unmute tab',
        click: (item) => {
          windowActions.setAudioMuted(frameProps, false)
        }
      })
    } else {
      items.push({
        label: 'Mute tab',
        click: (item) => {
          windowActions.setAudioMuted(frameProps, true)
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

  items.push(CommonMenu.separatorMenuItem)

  items.push({
    label: 'Close other tabs',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_OTHER_FRAMES, tabKey, true, true)
      }
    }
  }, {
    label: 'Close tabs to the right',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_OTHER_FRAMES, tabKey, true, false)
      }
    }
  }, {
    label: 'Close tabs to the left',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_OTHER_FRAMES, tabKey, false, true)
      }
    }
  },
  CommonMenu.separatorMenuItem)

  items.push(Object.assign({},
    CommonMenu.reopenLastClosedTabItem,
    { enabled: WindowStore.getState().get('closedFrames').size > 0 }
  ))

  return items
}

function getEditableItems (hasSelection) {
  const items = []
  if (hasSelection) {
    items.push({
      label: 'Cut',
      enabled: hasSelection,
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    }, {
      label: 'Copy',
      enabled: hasSelection,
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    })
  }
  items.push({
    label: 'Paste',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  })
  return items
}

function hamburgerTemplateInit (braverySettings) {
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
        CommonMenu.bookmarksToolbarMenuItem(),
        CommonMenu.separatorMenuItem,
        CommonMenu.importBookmarksMenuItem
      ]
    },
    CommonMenu.downloadsMenuItem,
    CommonMenu.separatorMenuItem,
    {
      label: 'Help',
      submenu: [
        CommonMenu.aboutBraveMenuItem,
        CommonMenu.separatorMenuItem,
        CommonMenu.checkForUpdateMenuItem,
        CommonMenu.separatorMenuItem,
        CommonMenu.reportAnIssueMenuItem,
        CommonMenu.submitFeedbackMenuItem
      ]
    }
  ]
  return template
}

const openInNewTabMenuItem = (location, isPrivate, partitionNumber) => {
  return {
    label: 'Open in new tab',
    click: () => {
      windowActions.newFrame({ location, isPrivate, partitionNumber }, false)
    }
  }
}

const openAllInNewTabsMenuItem = (allSites, folderDetail) => {
  return {
    label: 'Open all in tabs',
    click: () => {
      bookmarkActions.openBookmarksInFolder(allSites, folderDetail)
    }
  }
}

const openInNewPrivateTabMenuItem = (location) => {
  return {
    label: 'Open in new private tab',
    click: () => {
      windowActions.newFrame({
        location,
        isPrivate: true
      }, false)
    }
  }
}

const openInNewSessionTabMenuItem = (location) => {
  return {
    label: 'Open in new session tab',
    click: (item, focusedWindow) => {
      windowActions.newFrame({
        location,
        isPartitioned: true
      }, false)
    }
  }
}

const copyLinkLocationMenuItem = (location) => {
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
    template.push(openInNewTabMenuItem(nodeProps.href, frame.get('isPrivate'), frame.get('partitionNumber')),
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
    }, CommonMenu.separatorMenuItem, ...editableItems, CommonMenu.separatorMenuItem)
  } else if (nodeProps.hasSelection) {
    template.push({
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    }, CommonMenu.separatorMenuItem)
  }

  template.push({
    label: 'Back',
    enabled: frame.get('canGoBack'),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_BACK)
      }
    }
  }, {
    label: 'Forward',
    enabled: frame.get('canGoForward'),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_FORWARD)
      }
    }
  }, {
    label: 'Reload',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_RELOAD)
      }
    }
  }, CommonMenu.separatorMenuItem)

  template.push(addBookmarkMenuItem(siteUtil.getDetailFromFrame(frame, siteTags.BOOKMARK), false),
    {
      label: 'Add to reading list',
      enabled: false
    }, CommonMenu.separatorMenuItem,
    {
      label: 'View Page Source',
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE)
        }
      }
    }, {
      label: 'Inspect Element',
      click: (item, focusedWindow) => {
        windowActions.inspectElement(nodeProps.offsetX, nodeProps.offsetY)
      }
    })

  if (getSetting(settings.ONE_PASSWORD_ENABLED)) {
    template.push(
      CommonMenu.separatorMenuItem,
      {
        label: '1Password',
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            ipc.send('chrome-browser-action-clicked-aomjjhallfgjeglblehebfpbcfeobpgk', '1Password')
          }
        }
      })
  }

  return template
}

export function onHamburgerMenu (braverySettings, e) {
  const hamburgerMenu = Menu.buildFromTemplate(hamburgerTemplateInit(braverySettings))
  const rect = e.target.getBoundingClientRect()
  hamburgerMenu.popup(remote.getCurrentWindow(), rect.left, rect.bottom)
}

export function onMainContextMenu (nodeProps, frame, contextMenuType) {
  if (contextMenuType === 'bookmark' || contextMenuType === 'bookmark-folder') {
    onBookmarkContextMenu(Immutable.fromJS(nodeProps), Immutable.fromJS({ location: '', title: '', partitionNumber: frame.get('partitionNumber') }))
  } else if (contextMenuType === 'download') {
    onDownloadsToolbarContextMenu(nodeProps.downloadId, Immutable.fromJS(nodeProps))
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

export function onTabsToolbarContextMenu (activeFrame, closestDestinationDetail, isParent, e) {
  e.stopPropagation()
  const tabsToolbarMenu = Menu.buildFromTemplate(tabsToolbarTemplateInit(activeFrame, closestDestinationDetail, isParent))
  tabsToolbarMenu.popup(remote.getCurrentWindow())
}

export function onDownloadsToolbarContextMenu (downloadId, downloadItem, e) {
  if (e) {
    e.stopPropagation()
  }
  const downloadsToolbarMenu = Menu.buildFromTemplate(downloadsToolbarTemplateInit(downloadId, downloadItem))
  downloadsToolbarMenu.popup(remote.getCurrentWindow())
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

export function onBookmarkContextMenu (siteDetail, activeFrame, e) {
  if (e) {
    e.stopPropagation()
  }
  const menu = Menu.buildFromTemplate(bookmarkTemplateInit(siteDetail, activeFrame))
  menu.popup(remote.getCurrentWindow())
}

export function onShowBookmarkFolderMenu (bookmarks, bookmark, activeFrame, e) {
  if (e && e.stopPropagation) {
    e.stopPropagation()
  }
  const menuTemplate = showBookmarkFolderInit(bookmarks, bookmark, activeFrame)
  const rectLeft = e.target.getBoundingClientRect()
  const rectBottom = e.target.parentNode.getBoundingClientRect()
  windowActions.setContextMenuDetail(Immutable.fromJS({
    left: (rectLeft.left | 0) - 2,
    top: (rectBottom.bottom | 0) - 1,
    template: menuTemplate
  }))
}

/**
 * @param {Object} usernames - map of username to plaintext password
 * @param {string} origin - origin of the form
 * @param {string} action - action of the form
 * @param {Object} boundingRect - bounding rectangle of username input field
 */
export function onShowUsernameMenu (usernames, origin, action, boundingRect) {
  const menuTemplate = usernameTemplateInit(usernames, origin, action)
  windowActions.setContextMenuDetail(Immutable.fromJS({
    left: boundingRect.left,
    top: boundingRect.bottom + 62,
    template: menuTemplate
  }))
}

export function onMoreBookmarksMenu (activeFrame, allBookmarkItems, overflowItems, e) {
  const menuTemplate = moreBookmarksTemplateInit(allBookmarkItems, overflowItems, activeFrame)
  const rect = e.target.getBoundingClientRect()
  windowActions.setContextMenuDetail(Immutable.fromJS({
    right: 0,
    top: rect.bottom,
    maxHeight: window.innerHeight - 100,
    template: menuTemplate
  }))
}
