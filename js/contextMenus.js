/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = global.require('electron')
const remote = electron.remote
const Menu = remote.Menu
const Immutable = require('immutable')
const clipboard = electron.clipboard
const messages = require('./constants/messages')
const windowStore = require('./stores/windowStore')
const windowActions = require('./actions/windowActions')
const webviewActions = require('./actions/webviewActions')
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
const textUtils = require('./lib/text')
const {isIntermediateAboutPage, isUrl} = require('./lib/appUrlUtil')

const isDarwin = process.platform === 'darwin'

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

function urlBarTemplateInit (searchDetail, activeFrame, e) {
  const items = getEditableItems(window.getSelection().toString())
  const clipboardText = clipboard.readText()
  const hasClipboard = clipboardText && clipboardText.length > 0
  const isLocationUrl = hasClipboard && isUrl(clipboardText)

  if (isLocationUrl) {
    items.push({
      label: locale.translation('pasteAndGo'),
      enabled: hasClipboard,
      click: (item, focusedWindow) => {
        windowActions.loadUrl(activeFrame, clipboardText)
      }
    })
  } else {
    let searchUrl = searchDetail.get('searchURL').replace('{searchTerms}', encodeURIComponent(clipboardText))

    items.push({
      label: locale.translation('pasteAndSearch'),
      enabled: hasClipboard,
      click: (item, focusedWindow) => {
        windowActions.loadUrl(activeFrame, searchUrl)
      }
    })
  }

  return items
}

function tabsToolbarTemplateInit (activeFrame, closestDestinationDetail, isParent) {
  const menu = [
    CommonMenu.bookmarksMenuItem(),
    CommonMenu.bookmarksToolbarMenuItem(),
    CommonMenu.separatorMenuItem
  ]

  if (!isDarwin) {
    menu.push(CommonMenu.autoHideMenuBarMenuItem(),
      CommonMenu.separatorMenuItem)
  }

  menu.push(addBookmarkMenuItem('addBookmark', siteUtil.getDetailFromFrame(activeFrame, siteTags.BOOKMARK), closestDestinationDetail, isParent),
    addFolderMenuItem(closestDestinationDetail, isParent))

  return menu
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
  }

  if (windowStore.getState().getIn(['ui', 'downloadsToolbar', 'isVisible'])) {
    menu.push(CommonMenu.separatorMenuItem, {
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
      copyAddressMenuItem('copyLinkAddress', location),
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
  const showFavicon = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON) === true
  return items.map((site) => {
    const isFolder = siteUtil.isFolder(site)
    let faIcon
    if (showFavicon && !site.get('favicon')) {
      faIcon = isFolder ? 'fa-folder-o' : 'fa-file-o'
    }
    const templateItem = {
      bookmark: site,
      draggable: true,
      label: site.get('customTitle') || site.get('title') || site.get('location'),
      icon: showFavicon ? site.get('favicon') : undefined,
      faIcon,
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
    const location = frameProps.get('location')
    if (!(location === 'about:blank' || location === 'about:newtab' || isIntermediateAboutPage(location))) {
      items.push({
        label: locale.translation(isPinned ? 'unpinTab' : 'pinTab'),
        click: (item) => {
          // Handle converting the current tab window into a pinned site
          windowActions.setPinned(frameProps, !isPinned)
        }
      })
    }
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
  }, {
    label: locale.translation('closeTabsToRight'),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_OTHER_FRAMES, tabKey, true, false)
      }
    }
  }, {
    label: locale.translation('closeTabsToLeft'),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_OTHER_FRAMES, tabKey, false, true)
      }
    }
  }, CommonMenu.separatorMenuItem)

  items.push(Object.assign({},
    CommonMenu.reopenLastClosedTabItem(),
    { enabled: windowStore.getState().get('closedFrames').size > 0 }
  ))

  return items
}

function getMisspelledSuggestions (selection, isMisspelled, suggestions) {
  const hasSelection = selection.length > 0
  const items = []
  if (hasSelection) {
    if (suggestions.length > 0) {
      // Map the first 3 suggestions to menu items that allows click
      // to replace the text.
      items.push(...suggestions.slice(0, 3).map((suggestion) => {
        return {
          label: suggestion,
          click: () => {
            webviewActions.replace(suggestion)
          }
        }
      }), CommonMenu.separatorMenuItem)
    }
    if (isMisspelled) {
      items.push({
        label: locale.translation('learnSpelling'),
        click: () => {
          appActions.addWord(selection, true)
          // This is needed so the underline goes away
          webviewActions.replace(selection)
        }
      }, {
        label: locale.translation('ignoreSpelling'),
        click: () => {
          appActions.addWord(selection, false)
          // This is needed so the underline goes away
          webviewActions.replace(selection)
        }
      }, CommonMenu.separatorMenuItem)
    }
  }
  return items
}

function getEditableItems (selection, editFlags) {
  const hasSelection = selection.length > 0
  const hasClipboard = clipboard.readText().length > 0
  const items = []

  if (!editFlags || editFlags.canCut) {
    items.push({
      label: locale.translation('cut'),
      enabled: hasSelection,
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    })
  }
  if (!editFlags || editFlags.canCopy) {
    items.push({
      label: locale.translation('copy'),
      enabled: hasSelection,
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    })
  }
  if (!editFlags || editFlags.canPaste) {
    items.push({
      label: locale.translation('paste'),
      accelerator: 'CmdOrCtrl+V',
      enabled: hasClipboard,
      role: 'paste'
    })
  }
  return items
}

function hamburgerTemplateInit (location, e) {
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

const openInNewTabMenuItem = (location, isPrivate, partitionNumber, parentFrameKey) => {
  let openInForeground = getSetting(settings.SWITCH_TO_NEW_TABS) === true
  return {
    label: locale.translation('openInNewTab'),
    click: () => {
      windowActions.newFrame({ location, isPrivate, partitionNumber, parentFrameKey }, openInForeground)
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

const openInNewPrivateTabMenuItem = (location, parentFrameKey) => {
  let openInForeground = getSetting(settings.SWITCH_TO_NEW_TABS) === true
  return {
    label: locale.translation('openInNewPrivateTab'),
    click: () => {
      windowActions.newFrame({
        location,
        isPrivate: true,
        parentFrameKey
      }, openInForeground)
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

const openInNewSessionTabMenuItem = (location, parentFrameKey) => {
  let openInForeground = getSetting(settings.SWITCH_TO_NEW_TABS) === true
  return {
    label: locale.translation('openInNewSessionTab'),
    click: (item, focusedWindow) => {
      windowActions.newFrame({
        location,
        isPartitioned: true,
        parentFrameKey
      }, openInForeground)
    }
  }
}

const saveAsMenuItem = (label, location) => {
  return {
    label: locale.translation(label),
    click: (item, focusedWindow) => {
      if (focusedWindow && location) {
        focusedWindow.webContents.downloadURL(location)
      }
    }
  }
}

const copyAddressMenuItem = (label, location) => {
  return {
    label: locale.translation(label),
    click: (item, focusedWindow) => {
      if (focusedWindow && location) {
        clipboard.writeText(location)
      }
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

const searchSelectionMenuItem = (location) => {
  var searchText = textUtils.ellipse(location)
  return {
    label: locale.translation('openSearch').replace(/{{\s*selectedVariable\s*}}/, searchText),
    click: (item, focusedWindow) => {
      if (focusedWindow && location) {
        let searchUrl = windowStore.getState().getIn(['searchDetail', 'searchURL']).replace('{searchTerms}', encodeURIComponent(location))
        windowActions.newFrame({ location: searchUrl }, true)
      }
    }
  }
}

const showDefinitionMenuItem = (selectionText) => {
  let lookupText = textUtils.ellipse(selectionText, 3)
  return {
    label: locale.translation('lookupSelection').replace(/{{\s*selectedVariable\s*}}/, lookupText),
    click: (item, focusedWindow) => {
      webviewActions.showDefinitionForSelection()
    }
  }
}

function mainTemplateInit (nodeProps, frame) {
  const template = []

  if (nodeProps.frameURL && nodeProps.frameURL.startsWith('chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/about-flash.html')) {
    const pageOrigin = siteUtil.getOrigin(nodeProps.pageURL)
    template.push({
      label: locale.translation('allowFlashOnce'),
      click: () => {
        appActions.changeSiteSetting(pageOrigin, 'flash', 1)
      }
    }, {
      label: locale.translation('allowFlashAlways'),
      click: () => {
        const expirationTime = Date.now() + 7 * 24 * 3600 * 1000
        appActions.changeSiteSetting(pageOrigin, 'flash', expirationTime)
      }
    })
    return template
  }

  const isLink = nodeProps.linkURL && nodeProps.linkURL !== ''
  const isImage = nodeProps.mediaType === 'image'
  const isInputField = nodeProps.isEditable || nodeProps.inputFieldType !== 'none'
  const isTextSelected = nodeProps.selectionText.length > 0

  if (isLink) {
    template.push(openInNewTabMenuItem(nodeProps.linkURL, frame.get('isPrivate'), frame.get('partitionNumber'), frame.get('key')),
      openInNewPrivateTabMenuItem(nodeProps.linkURL, frame.get('key')),
      openInNewWindowMenuItem(nodeProps.linkURL, frame.get('isPrivate'), frame.get('partitionNumber')),
      CommonMenu.separatorMenuItem,
      openInNewSessionTabMenuItem(nodeProps.linkURL, frame.get('key')),
      CommonMenu.separatorMenuItem)

    if (nodeProps.linkURL.toLowerCase().startsWith('mailto:')) {
      template.push(copyEmailAddressMenuItem(nodeProps.linkURL))
    } else {
      template.push(
        saveAsMenuItem('saveLinkAs', nodeProps.linkURL),
        copyAddressMenuItem('copyLinkAddress', nodeProps.linkURL),
        CommonMenu.separatorMenuItem)
    }
  }

  if (isImage) {
    template.push({
      label: locale.translation('openImageInNewTab'),
      click: (item, focusedWindow) => {
        if (focusedWindow && nodeProps.srcURL) {
          // TODO: open this in the next tab instead of last tab
          focusedWindow.webContents.send(messages.SHORTCUT_NEW_FRAME, nodeProps.srcURL)
        }
      }
    },
    saveAsMenuItem('saveImage', nodeProps.srcURL),
    copyAddressMenuItem('copyImageAddress', nodeProps.srcURL),
    CommonMenu.separatorMenuItem)
  }

  if (isInputField) {
    let misspelledSuggestions = []
    if (nodeProps.misspelledWord) {
      const info = ipc.sendSync(messages.GET_MISSPELLING_INFO, nodeProps.selectionText)
      if (info) {
        misspelledSuggestions = getMisspelledSuggestions(nodeProps.selectionText, info.isMisspelled, info.suggestions)
      }
    }

    const editableItems = getEditableItems(nodeProps.selectionText, nodeProps.editFlags)
    template.push(...misspelledSuggestions, {
      label: locale.translation('undo'),
      accelerator: 'CmdOrCtrl+Z',
      role: 'undo'
    }, {
      label: locale.translation('redo'),
      accelerator: 'Shift+CmdOrCtrl+Z',
      role: 'redo'
    }, CommonMenu.separatorMenuItem, ...editableItems, CommonMenu.separatorMenuItem)
  } else if (isTextSelected) {
    if (isDarwin) {
      template.push(showDefinitionMenuItem(nodeProps.selectionText),
        CommonMenu.separatorMenuItem
      )
    }

    template.push(searchSelectionMenuItem(nodeProps.selectionText), {
      label: locale.translation('copy'),
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    }, CommonMenu.separatorMenuItem)
  } else {
    if (!isImage) {
      if (isLink) {
        template.push(addBookmarkMenuItem('bookmarkLink', {
          location: nodeProps.linkURL,
          tags: [siteTags.BOOKMARK]
        }, false))
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
          }, {
            label: locale.translation('reloadPage'),
            click: (item, focusedWindow) => {
              if (focusedWindow) {
                focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_RELOAD)
              }
            }
          },
          CommonMenu.separatorMenuItem,
          addBookmarkMenuItem('bookmarkPage', siteUtil.getDetailFromFrame(frame, siteTags.BOOKMARK), false), {
            label: locale.translation('find'),
            accelerator: 'CmdOrCtrl+F',
            click: function (item, focusedWindow) {
              focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_SHOW_FINDBAR)
            }
          }, {
            label: locale.translation('print'),
            accelerator: 'CmdOrCtrl+P',
            click: function (item, focusedWindow) {
              focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_PRINT)
            }
          }
          // CommonMenu.separatorMenuItem
          // TODO: bravery menu goes here
          )
      }

      template.push(CommonMenu.separatorMenuItem)
    }

    if (!isLink && !isImage) {
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
      webviewActions.inspectElement(nodeProps.x, nodeProps.y)
    }
  })

  if (getSetting(settings.LAST_PASS_ENABLED)) {
    template.push(
      CommonMenu.separatorMenuItem,
      {
        label: 'LastPass',
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            nodeProps.height = 448
            nodeProps.width = 350
            ipc.send('chrome-browser-action-clicked', 'hdokiejnpimakedhajhdlcegeplioahd', frame.get('tabId'), 'LastPass', nodeProps)
          }
        }
      })
  }
  if (getSetting(settings.ONE_PASSWORD_ENABLED)) {
    template.push(
      CommonMenu.separatorMenuItem,
      {
        label: '1Password',
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            ipc.send('chrome-browser-action-clicked', 'aomjjhallfgjeglblehebfpbcfeobpgk', frame.get('tabId'), '1Password', nodeProps)
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
            ipc.send('chrome-browser-action-clicked', 'fdjamakpfbbddfjaooikfcpapjohcfmg', frame.get('tabId'), 'Dashlane', nodeProps)
          }
        }
      })
  }

  return template
}

function onHamburgerMenu (location, e) {
  const menuTemplate = hamburgerTemplateInit(location, e)
  const rect = e.target.getBoundingClientRect()
  windowActions.setContextMenuDetail(Immutable.fromJS({
    right: 0,
    top: rect.bottom + 2,
    template: menuTemplate
  }))
}

function onMainContextMenu (nodeProps, frame, contextMenuType) {
  if (contextMenuType === 'bookmark' || contextMenuType === 'bookmark-folder') {
    onBookmarkContextMenu(Immutable.fromJS(nodeProps), Immutable.fromJS({ location: '', title: '', partitionNumber: frame.get('partitionNumber') }))
  } else if (contextMenuType === 'download') {
    onDownloadsToolbarContextMenu(nodeProps.downloadId, Immutable.fromJS(nodeProps))
  } else {
    const mainMenu = Menu.buildFromTemplate(mainTemplateInit(nodeProps, frame))
    mainMenu.popup(remote.getCurrentWindow())
  }
}

function onTabContextMenu (frameProps, e) {
  e.stopPropagation()
  const tabMenu = Menu.buildFromTemplate(tabTemplateInit(frameProps))
  tabMenu.popup(remote.getCurrentWindow())
}

function onTabsToolbarContextMenu (activeFrame, closestDestinationDetail, isParent, e) {
  e.stopPropagation()
  const tabsToolbarMenu = Menu.buildFromTemplate(tabsToolbarTemplateInit(activeFrame, closestDestinationDetail, isParent))
  tabsToolbarMenu.popup(remote.getCurrentWindow())
}

function onDownloadsToolbarContextMenu (downloadId, downloadItem, e) {
  if (e) {
    e.stopPropagation()
  }
  const downloadsToolbarMenu = Menu.buildFromTemplate(downloadsToolbarTemplateInit(downloadId, downloadItem))
  downloadsToolbarMenu.popup(remote.getCurrentWindow())
}

function onTabPageContextMenu (framePropsList, e) {
  e.stopPropagation()
  const tabPageMenu = Menu.buildFromTemplate(tabPageTemplateInit(framePropsList))
  tabPageMenu.popup(remote.getCurrentWindow())
}

function onUrlBarContextMenu (searchDetail, activeFrame, e) {
  e.stopPropagation()
  const inputMenu = Menu.buildFromTemplate(urlBarTemplateInit(searchDetail, activeFrame, e))
  inputMenu.popup(remote.getCurrentWindow())
}

function onBookmarkContextMenu (siteDetail, activeFrame, e) {
  if (e) {
    e.stopPropagation()
  }
  const menu = Menu.buildFromTemplate(bookmarkTemplateInit(siteDetail, activeFrame))
  menu.popup(remote.getCurrentWindow())
}

function onShowBookmarkFolderMenu (bookmarks, bookmark, activeFrame, e) {
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
function onShowUsernameMenu (usernames, origin, action, boundingRect,
                                    topOffset) {
  const menuTemplate = usernameTemplateInit(usernames, origin, action)
  windowActions.setContextMenuDetail(Immutable.fromJS({
    left: boundingRect.left,
    top: boundingRect.bottom + topOffset,
    template: menuTemplate
  }))
}

function onMoreBookmarksMenu (activeFrame, allBookmarkItems, overflowItems, e) {
  const menuTemplate = moreBookmarksTemplateInit(allBookmarkItems, overflowItems, activeFrame)
  const rect = e.target.getBoundingClientRect()
  windowActions.setContextMenuDetail(Immutable.fromJS({
    right: 0,
    top: rect.bottom,
    template: menuTemplate
  }))
}

module.exports = {
  onHamburgerMenu,
  onMainContextMenu,
  onTabContextMenu,
  onTabsToolbarContextMenu,
  onDownloadsToolbarContextMenu,
  onTabPageContextMenu,
  onUrlBarContextMenu,
  onBookmarkContextMenu,
  onShowBookmarkFolderMenu,
  onShowUsernameMenu,
  onMoreBookmarksMenu
}
