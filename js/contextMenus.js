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
const locale = require('../js/l10n')
const getSetting = require('./settings').getSetting
const settings = require('./constants/settings')

/**
 * Obtains an add bookmark menu item
 * @param {object} Detail of the bookmark to initialize with
 */
const addBookmarkMenuItem = (label, siteDetail, closestDestinationDetail, isParent) => {
  return {
    label: locale.translation(label),
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
    label: locale.translation('addFolder'),
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
  return [{
    label: locale.translation('unmuteTabs'),
    click: (item, focusedWindow) => {
      windowActions.muteAllAudio(framePropsList, false)
    }
  }, {
    label: locale.translation('muteTabs'),
    click: (item, focusedWindow) => {
      windowActions.muteAllAudio(framePropsList, true)
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
    CommonMenu.bookmarksMenuItem(),
    CommonMenu.bookmarksToolbarMenuItem(),
    CommonMenu.separatorMenuItem,
    addBookmarkMenuItem('addBookmark', siteUtil.getDetailFromFrame(activeFrame, siteTags.BOOKMARK), closestDestinationDetail, isParent),
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
        label: isFolder ? locale.translation('editFolder') : locale.translation('editBookmark'),
        click: () => {
          // originalLocation is undefined signifies add mode
          windowActions.setBookmarkDetail(siteDetail, siteDetail)
        }
      })

    template.push(
      CommonMenu.separatorMenuItem, {
        label: isFolder ? locale.translation('deleteFolder') : locale.translation('deleteBookmark'),
        click: () => {
          appActions.removeSite(siteDetail, siteDetail.get('tags').includes(siteTags.BOOKMARK_FOLDER) ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK)
        }
      }, CommonMenu.separatorMenuItem)
  }

  template.push(addBookmarkMenuItem('addBookmark', siteUtil.getDetailFromFrame(activeFrame, siteTags.BOOKMARK), siteDetail, true),
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
  let showFavicon = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON) === true
  return items.map((site) => {
    const isFolder = siteUtil.isFolder(site)
    const templateItem = {
      bookmark: site,
      draggable: true,
      label: site.get('customTitle') || site.get('title') || site.get('location'),
      icon: showFavicon ? site.get('favicon') : undefined,
      faIcon: showFavicon && !site.get('favicon') ? 'fa-file-o' : undefined,
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
  items.push(
    CommonMenu.newTabMenuItem(),
    CommonMenu.separatorMenuItem,
    {
      label: locale.translation('reloadTab'),
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          focusedWindow.webContents.send(messages.SHORTCUT_FRAME_RELOAD, tabKey)
        }
      }
    })

  if (!frameProps.get('isPrivate')) {
    const isPinned = frameProps.get('pinnedLocation')

    items.push({
      label: locale.translation(isPinned ? 'unpinTab' : 'pinTab'),
      click: (item) => {
        // Handle converting the current tab window into a pinned site
        windowActions.setPinned(frameProps, !isPinned)
      }
    })
  }

  // items.push({
  //   label: locale.translation('moveTabToNewWindow'),
  //   enabled: false,
  //   click: (item, focusedWindow) => {
  //     // TODO: actually move tab to new window
  //   }
  // })

  items.push(CommonMenu.separatorMenuItem,
    {
      label: locale.translation('muteOtherTabs'),
      click: (item, focusedWindow) => {
        windowActions.muteAllAudioExcept(frameProps)
      }
    })

  if (frameProps.get('audioPlaybackActive')) {
    const isMuted = frameProps.get('audioMuted')

    items.push({
      label: locale.translation(isMuted ? 'unmuteTab' : 'muteTab'),
      click: (item) => {
        windowActions.setAudioMuted(frameProps, !isMuted)
      }
    })
  }

  items.push(CommonMenu.separatorMenuItem)

  if (!frameProps.get('pinnedLocation')) {
    items.push({
      label: locale.translation('closeTab'),
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          // TODO: Don't switch active tabs when this is called
          focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_FRAME, tabKey)
        }
      }
    })
  }

  items.push({
    label: locale.translation('closeOtherTabs'),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_OTHER_FRAMES, tabKey, true, true)
      }
    }
  },
  CommonMenu.separatorMenuItem)

  items.push(Object.assign({},
    CommonMenu.reopenLastClosedTabItem(),
    { enabled: WindowStore.getState().get('closedFrames').size > 0 }
  ))

  return items
}

function getEditableItems (hasSelection) {
  const items = []
  if (hasSelection) {
    items.push({
      label: locale.translation('cut'),
      enabled: hasSelection,
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    }, {
      label: locale.translation('copy'),
      enabled: hasSelection,
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    })
  }
  items.push({
    label: locale.translation('paste'),
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  })
  return items
}

function hamburgerTemplateInit (braverySettings, location, e) {
  const template = [
    {
      l10nLabelId: 'new',
      submenu: [
        CommonMenu.newTabMenuItem(),
        CommonMenu.newPrivateTabMenuItem(),
        CommonMenu.newPartitionedTabMenuItem(),
        CommonMenu.separatorMenuItem,
        CommonMenu.newWindowMenuItem()
      ]
    },
    CommonMenu.separatorMenuItem,
    CommonMenu.findOnPageMenuItem(),
    CommonMenu.printMenuItem(),
    CommonMenu.separatorMenuItem,
    {
      l10nLabelId: 'zoom',
      type: 'multi',
      submenu: [{
        label: '-',
        click: () => {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_ZOOM_OUT)
        }
      }, {
        labelDataBind: 'zoomLevel',
        dataBindParam: location,
        click: () => {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_ZOOM_RESET)
        }
      }, {
        label: '+',
        click: () => {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_ZOOM_IN)
        }
      }]
    },
    CommonMenu.separatorMenuItem,
    CommonMenu.buildBraveryMenu(braverySettings, function () {
      ipc.send(messages.UPDATE_APP_MENU, {bookmarked: braverySettings.bookmarked})
    }),
    CommonMenu.separatorMenuItem,
    CommonMenu.preferencesMenuItem(),
    {
      label: locale.translation('bookmarks'),
      submenu: [
        CommonMenu.bookmarksMenuItem(),
        CommonMenu.bookmarksToolbarMenuItem(),
        CommonMenu.separatorMenuItem,
        CommonMenu.importBookmarksMenuItem()
      ]
    },
    CommonMenu.downloadsMenuItem(),
    CommonMenu.separatorMenuItem,
    {
      label: locale.translation('help'),
      submenu: [
        CommonMenu.aboutBraveMenuItem(),
        CommonMenu.separatorMenuItem,
        CommonMenu.checkForUpdateMenuItem(),
        CommonMenu.separatorMenuItem,
        CommonMenu.reportAnIssueMenuItem(),
        CommonMenu.submitFeedbackMenuItem()
      ]
    }
  ]
  return template
}

const openInNewTabMenuItem = (location, isPrivate, partitionNumber) => {
  return {
    label: locale.translation('openInNewTab'),
    click: () => {
      windowActions.newFrame({ location, isPrivate, partitionNumber }, false)
    }
  }
}

const openAllInNewTabsMenuItem = (allSites, folderDetail) => {
  return {
    label: locale.translation('openAllInTabs'),
    click: () => {
      bookmarkActions.openBookmarksInFolder(allSites, folderDetail)
    }
  }
}

const openInNewPrivateTabMenuItem = (location) => {
  return {
    label: locale.translation('openInNewPrivateTab'),
    click: () => {
      windowActions.newFrame({
        location,
        isPrivate: true
      }, false)
    }
  }
}

const openInNewWindowMenuItem = (location, isPrivate, partitionNumber) => {
  return {
    label: locale.translation('openInNewWindow'),
    click: () => {
      appActions.newWindow({ location, isPrivate, partitionNumber })
    }
  }
}

const openInNewSessionTabMenuItem = (location) => {
  return {
    label: locale.translation('openInNewSessionTab'),
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
    label: locale.translation('copyLinkAddress'),
    click: () => {
      clipboard.writeText(location)
    }
  }
}

const copyEmailAddressMenuItem = (location) => {
  return {
    label: locale.translation('copyEmailAddress'),
    click: () => {
      clipboard.writeText(location.substring('mailto:'.length, location.length))
    }
  }
}

function mainTemplateInit (nodeProps, frame) {
  const template = []
  const nodeName = nodeProps.name

  if (nodeProps.href) {
    template.push(openInNewTabMenuItem(nodeProps.href, frame.get('isPrivate'), frame.get('partitionNumber')),
      openInNewPrivateTabMenuItem(nodeProps.href),
      openInNewWindowMenuItem(nodeProps.href, frame.get('isPrivate'), frame.get('partitionNumber')),
      CommonMenu.separatorMenuItem,
      openInNewSessionTabMenuItem(nodeProps.href),
      CommonMenu.separatorMenuItem)

    if (nodeProps.href.toLowerCase().startsWith('mailto:')) {
      template.push(copyEmailAddressMenuItem(nodeProps.href))
    } else {
      template.push(copyLinkLocationMenuItem(nodeProps.href), {
        label: locale.translation('saveLinkAs'),
        click: (item, focusedWindow) => {
          if (focusedWindow && nodeProps.href) {
            focusedWindow.webContents.downloadURL(nodeProps.href)
          }
        }
      },
      CommonMenu.separatorMenuItem)
    }
  }

  if (nodeName === 'IMG') {
    template.push({
      label: locale.translation('saveImage'),
      click: (item, focusedWindow) => {
        if (focusedWindow && nodeProps.src) {
          focusedWindow.webContents.downloadURL(nodeProps.src)
        }
      }
    })
    template.push({
      label: locale.translation('openImageInNewTab'),
      click: (item, focusedWindow) => {
        if (focusedWindow && nodeProps.src) {
          // TODO: open this in the next tab instead of last tab
          focusedWindow.webContents.send(messages.SHORTCUT_NEW_FRAME, nodeProps.src)
        }
      }
    })
    template.push({
      label: locale.translation('copyImageAddress'),
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
      label: locale.translation('undo'),
      accelerator: 'CmdOrCtrl+Z',
      role: 'undo'
    }, {
      label: locale.translation('redo'),
      accelerator: 'Shift+CmdOrCtrl+Z',
      role: 'redo'
    }, CommonMenu.separatorMenuItem, ...editableItems, CommonMenu.separatorMenuItem)
  } else if (nodeProps.hasSelection) {
    template.push(
    // {
    //   label: locale.translation('openSearch'),
    //   enabled: false,
    //   click: (item, focusedWindow) => {
    //     // TODO: ..
    //   }
    // },
      {
        label: locale.translation('copy'),
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
      }, CommonMenu.separatorMenuItem)
  } else {
    if (nodeProps.href) {
      template.push(addBookmarkMenuItem('bookmarkLink', {
        location: nodeProps.href,
        tags: [siteTags.BOOKMARK]
      }, false)
      // ,{
      //   label: locale.translation('openSearch'),
      //   enabled: false,
      //   click: (item, focusedWindow) => {
      //     // TODO: ..
      //   }
      // }
      )
    } else {
      template.push(
        {
          label: locale.translation('back'),
          enabled: frame.get('canGoBack'),
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_BACK)
            }
          }
        }, {
          label: locale.translation('forward'),
          enabled: frame.get('canGoForward'),
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_FORWARD)
            }
          }
        },
        CommonMenu.separatorMenuItem, {
          label: locale.translation('reloadPage'),
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_RELOAD)
            }
          }
        },
        addBookmarkMenuItem('bookmarkPage', siteUtil.getDetailFromFrame(frame, siteTags.BOOKMARK), false), {
          label: locale.translation('find'),
          accelerator: 'CmdOrCtrl+F',
          click: function (item, focusedWindow) {
            focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_SHOW_FINDBAR)
          }
        }
        // CommonMenu.separatorMenuItem
        // TODO: bravery menu goes here
        )
    }

    template.push(CommonMenu.separatorMenuItem)

    if (!nodeProps.href) {
      template.push({
        label: locale.translation('viewPageSource'),
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE)
          }
        }
      })
    }
  }

  template.push({
    label: locale.translation('inspectElement'),
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
            ipc.send('chrome-browser-action-clicked', 'aomjjhallfgjeglblehebfpbcfeobpgk', '1Password', nodeProps)
          }
        }
      })
  }
  if (getSetting(settings.DASHLANE_ENABLED)) {
    template.push(
      CommonMenu.separatorMenuItem,
      {
        label: 'Dashlane',
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            ipc.send('chrome-browser-action-clicked', 'fdjamakpfbbddfjaooikfcpapjohcfmg', 'Dashlane', nodeProps)
          }
        }
      })
  }

  return template
}

export function onHamburgerMenu (braverySettings, location, e) {
  const menuTemplate = hamburgerTemplateInit(braverySettings, location, e)
  const rect = e.target.getBoundingClientRect()
  windowActions.setContextMenuDetail(Immutable.fromJS({
    right: 0,
    top: rect.bottom + 2,
    template: menuTemplate
  }))
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
 * @param {number} topOffset - distance from webview to the top of window
 */
export function onShowUsernameMenu (usernames, origin, action, boundingRect,
                                    topOffset) {
  const menuTemplate = usernameTemplateInit(usernames, origin, action)
  windowActions.setContextMenuDetail(Immutable.fromJS({
    left: boundingRect.left,
    top: boundingRect.bottom + topOffset,
    template: menuTemplate
  }))
}

export function onMoreBookmarksMenu (activeFrame, allBookmarkItems, overflowItems, e) {
  const menuTemplate = moreBookmarksTemplateInit(allBookmarkItems, overflowItems, activeFrame)
  const rect = e.target.getBoundingClientRect()
  windowActions.setContextMenuDetail(Immutable.fromJS({
    right: 0,
    top: rect.bottom,
    template: menuTemplate
  }))
}
