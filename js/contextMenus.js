/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const remote = electron.remote
const Menu = remote.Menu
const Immutable = require('immutable')
const clipboard = remote.clipboard
const messages = require('./constants/messages')
const windowStore = require('./stores/windowStore')
const windowActions = require('./actions/windowActions')
const webviewActions = require('./actions/webviewActions')
const bookmarkActions = require('./actions/bookmarkActions')
const appActions = require('./actions/appActions')
const siteTags = require('./constants/siteTags')
const electronDownloadItemActions = require('../app/common/constants/electronDownloadItemActions')
const dragTypes = require('./constants/dragTypes')
const siteUtil = require('./state/siteUtil')
const downloadUtil = require('./state/downloadUtil')
const menuUtil = require('../app/common/lib/menuUtil')
const urlUtil = require('./lib/urlutil')
const CommonMenu = require('../app/common/commonMenu')
const dnd = require('./dnd')
const dndData = require('./dndData')
const appStoreRenderer = require('./stores/appStoreRenderer')
const ipc = require('electron').ipcRenderer
const locale = require('../js/l10n')
const {getSetting} = require('./settings')
const settings = require('./constants/settings')
const textUtils = require('./lib/text')
const {getPartitionFromNumber, getActiveFrame} = require('./state/frameStateUtil')
const {isIntermediateAboutPage, isUrl, aboutUrls} = require('./lib/appUrlUtil')
const {getBase64FromImageUrl} = require('./lib/imageUtil')
const urlParse = require('../app/common/urlParse')
const {getCurrentWindow} = require('../app/renderer/currentWindow')
const {bookmarksToolbarMode} = require('../app/common/constants/settingsEnums')
const extensionState = require('../app/common/state/extensionState')
const extensionActions = require('../app/common/actions/extensionActions')
const appStore = require('./stores/appStoreRenderer')
const {makeImmutable} = require('../app/common/state/immutableUtil')

const isDarwin = process.platform === 'darwin'
const isLinux = process.platform === 'linux'

/**
 * Obtains an add bookmark menu item
 * @param {object} Detail of the bookmark to initialize with
 */
const addBookmarkMenuItem = (label, siteDetail, closestDestinationDetail, isParent) => {
  return {
    label: locale.translation(label),
    accelerator: 'CmdOrCtrl+D',
    click: () => {
      if (isParent) {
        siteDetail = siteDetail.set('parentFolderId', closestDestinationDetail && (closestDestinationDetail.get('folderId') || closestDestinationDetail.get('parentFolderId')))
      }
      if (siteDetail.constructor !== Immutable.Map) {
        siteDetail = Immutable.fromJS(siteDetail)
      }
      siteDetail = siteDetail.set('location', urlUtil.getLocationIfPDF(siteDetail.get('location')))
      windowActions.setBookmarkDetail(siteDetail, siteDetail, closestDestinationDetail, true)
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
      windowActions.setBookmarkDetail(emptyFolder, undefined, closestDestinationDetail, false)
    }
  }
}

function tabPageTemplateInit (framePropsList) {
  return [{
    label: locale.translation('unmuteTabs'),
    click: () => {
      windowActions.muteAllAudio(generateMuteFrameList(framePropsList, false))
    }
  }, {
    label: locale.translation('muteTabs'),
    click: () => {
      windowActions.muteAllAudio(generateMuteFrameList(framePropsList, true))
    }
  }, {
    label: locale.translation('closeTabPage'),
    click: () => {
      windowActions.closeFrames(framePropsList)
    }
  }]
}

function generateMuteFrameList (framePropsList, muted) {
  return framePropsList.map((frameProp) => {
    return {
      frameKey: frameProp.get('key'),
      tabId: frameProp.get('tabId'),
      muted: muted && frameProp.get('audioPlaybackActive') && !frameProp.get('audioMuted')
    }
  })
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
      click: (item) => {
        appActions.loadURLRequested(activeFrame.get('tabId'), clipboardText)
      }
    })
  } else {
    let searchUrl = searchDetail.get('searchURL').replace('{searchTerms}', encodeURIComponent(clipboardText))

    items.push({
      label: locale.translation('pasteAndSearch'),
      enabled: hasClipboard,
      click: (item) => {
        appActions.loadURLRequested(activeFrame.get('tabId'), searchUrl)
      }
    })
  }

  return items
}

function findBarTemplateInit () {
  return getEditableItems(window.getSelection().toString())
}

function tabsToolbarTemplateInit (bookmarkTitle, bookmarkLink, closestDestinationDetail, isParent) {
  const template = [
    CommonMenu.bookmarksManagerMenuItem(),
    CommonMenu.bookmarksToolbarMenuItem(),
    CommonMenu.separatorMenuItem
  ]

  if (!isDarwin) {
    template.push(CommonMenu.autoHideMenuBarMenuItem(),
      CommonMenu.separatorMenuItem)
  }

  template.push(addBookmarkMenuItem('addBookmark', {
    title: bookmarkTitle,
    location: bookmarkLink,
    tags: [siteTags.BOOKMARK]
  }, closestDestinationDetail, isParent))
  template.push(addFolderMenuItem(closestDestinationDetail, isParent))

  return menuUtil.sanitizeTemplateItems(template)
}

function downloadsToolbarTemplateInit (downloadId, downloadItem) {
  const template = []

  if (downloadItem) {
    if (downloadUtil.shouldAllowPause(downloadItem)) {
      template.push({
        label: locale.translation('downloadItemPause'),
        click: appActions.downloadActionPerformed.bind(null, downloadId, electronDownloadItemActions.PAUSE)
      })
    }

    if (downloadUtil.shouldAllowResume(downloadItem)) {
      template.push({
        label: locale.translation('downloadItemResume'),
        click: appActions.downloadActionPerformed.bind(null, downloadId, electronDownloadItemActions.RESUME)
      })
    }

    if (downloadUtil.shouldAllowCancel(downloadItem)) {
      template.push({
        label: locale.translation('downloadItemCancel'),
        click: appActions.downloadActionPerformed.bind(null, downloadId, electronDownloadItemActions.CANCEL)
      })
    }

    if (downloadUtil.shouldAllowRedownload(downloadItem)) {
      template.push({
        label: locale.translation('downloadItemRedownload'),
        click: appActions.downloadRedownloaded.bind(null, downloadId)
      })
    }

    if (downloadUtil.shouldAllowCopyLink(downloadItem)) {
      template.push({
        label: locale.translation('downloadItemCopyLink'),
        click: appActions.downloadCopiedToClipboard.bind(null, downloadId)
      })
    }

    if (downloadUtil.shouldAllowOpenDownloadLocation(downloadItem)) {
      template.push({
        label: locale.translation('downloadItemPath'),
        click: appActions.downloadRevealed.bind(null, downloadId)
      })
    }

    if (downloadUtil.shouldAllowDelete(downloadItem)) {
      template.push({
        label: locale.translation('downloadItemDelete'),
        click: appActions.downloadDeleted.bind(null, downloadId)
      })
    }

    if (downloadUtil.shouldAllowRemoveFromList(downloadItem)) {
      template.push({
        label: locale.translation('downloadItemClear'),
        click: appActions.downloadCleared.bind(null, downloadId)
      })
    }
  }

  if (windowStore.getState().getIn(['ui', 'downloadsToolbar', 'isVisible'])) {
    if (template.length) {
      template.push(CommonMenu.separatorMenuItem)
    }
    template.push({
      label: locale.translation('downloadToolbarHide'),
      click: () => {
        windowActions.setDownloadsToolbarVisible(false)
      }
    })
  }
  if (template.length) {
    template.push(CommonMenu.separatorMenuItem)
  }
  template.push({
    label: locale.translation('downloadItemClearCompleted'),
    click: () => {
      appActions.clearCompletedDownloads()
    }
  })
  return menuUtil.sanitizeTemplateItems(template)
}

function siteDetailTemplateInit (siteDetail, activeFrame) {
  let isHistoryEntry = false
  let multipleHistoryEntries = false
  let multipleBookmarks = false
  let isFolder = false
  let isSystemFolder = false
  let deleteLabel
  let deleteTag

  // TODO(bsclifton): pull this out to a method
  if (siteUtil.isBookmark(siteDetail) && activeFrame) {
    deleteLabel = 'deleteBookmark'
    deleteTag = siteTags.BOOKMARK
  } else if (siteUtil.isFolder(siteDetail)) {
    isFolder = true
    isSystemFolder = siteDetail.get('folderId') === 0 ||
      siteDetail.get('folderId') === -1
    deleteLabel = 'deleteFolder'
    deleteTag = siteTags.BOOKMARK_FOLDER
  } else if (siteUtil.isHistoryEntry(siteDetail)) {
    isHistoryEntry = true
    deleteLabel = 'deleteHistoryEntry'
  } else if (Immutable.List.isList(siteDetail)) {
    // Multiple bookmarks OR history entries selected
    multipleHistoryEntries = true
    multipleBookmarks = true
    siteDetail.forEach((site) => {
      if (!siteUtil.isBookmark(site)) multipleBookmarks = false
      if (!siteUtil.isHistoryEntry(site)) multipleHistoryEntries = false
    })
    if (multipleBookmarks) {
      deleteLabel = 'deleteBookmarks'
      deleteTag = siteTags.BOOKMARK
    } else if (multipleHistoryEntries) {
      deleteLabel = 'deleteHistoryEntries'
    }
  } else {
    deleteLabel = ''
  }

  const template = []

  if (!isFolder) {
    if (!Immutable.List.isList(siteDetail)) {
      const location = siteDetail.get('location')

      template.push(openInNewTabMenuItem(location, undefined, siteDetail.get('partitionNumber')),
        openInNewPrivateTabMenuItem(location),
        openInNewWindowMenuItem(location, undefined, siteDetail.get('partitionNumber')),
        openInNewSessionTabMenuItem(location),
        copyAddressMenuItem('copyLinkAddress', location),
        CommonMenu.separatorMenuItem)
    } else {
      let locations = []
      let partitionNumbers = []
      siteDetail.forEach((site) => {
        locations.push(site.get('location'))
        partitionNumbers.push(site.get('partitionNumber'))
      })

      template.push(openInNewTabMenuItem(locations, undefined, partitionNumbers),
        openInNewPrivateTabMenuItem(locations),
        openInNewSessionTabMenuItem(locations),
        CommonMenu.separatorMenuItem)
    }
  } else {
    template.push(openAllInNewTabsMenuItem(appStoreRenderer.state.get('sites'), siteDetail),
      CommonMenu.separatorMenuItem)
  }

  if (!isSystemFolder) {
    // Picking this menu item pops up the AddEditBookmark modal
    // - History can be deleted but not edited
    // - Multiple bookmarks cannot be edited at once
    // - "Bookmarks Toolbar" and "Other Bookmarks" folders cannot be deleted
    if (!isHistoryEntry && !multipleHistoryEntries && !multipleBookmarks) {
      template.push(
        {
          label: locale.translation(isFolder ? 'editFolder' : 'editBookmark'),
          click: () => windowActions.setBookmarkDetail(siteDetail, siteDetail, null, true)
        },
        CommonMenu.separatorMenuItem)
    }

    template.push(
      {
        label: locale.translation(deleteLabel),
        click: () => {
          if (Immutable.List.isList(siteDetail)) {
            siteDetail.forEach((site) => appActions.removeSite(site, deleteTag))
          } else {
            appActions.removeSite(siteDetail, deleteTag)
          }
        }
      })
  }

  if (!isHistoryEntry && !multipleHistoryEntries) {
    if (template[template.length - 1] !== CommonMenu.separatorMenuItem) {
      template.push(CommonMenu.separatorMenuItem)
    }
    template.push(
      addBookmarkMenuItem('addBookmark', siteUtil.getDetailFromFrame(activeFrame, siteTags.BOOKMARK), siteDetail, true),
      addFolderMenuItem(siteDetail, true))
  }

  return menuUtil.sanitizeTemplateItems(template)
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
          const bookmarkSiteKey = siteUtil.getSiteKey(bookmark)
          const parentBookmarkFolderKey = siteUtil.getSiteKey(parentBookmarkFolder)
          appActions.moveSite(bookmarkSiteKey, parentBookmarkFolderKey, false, true)
        }
      }
    }]
  }
  return bookmarkItemsInit(allBookmarkItems, items, activeFrame)
}

function bookmarkItemsInit (allBookmarkItems, items, activeFrame) {
  const btbMode = getSetting(settings.BOOKMARKS_TOOLBAR_MODE)
  const showFavicon = (btbMode === bookmarksToolbarMode.TEXT_AND_FAVICONS || btbMode === bookmarksToolbarMode.FAVICONS_ONLY)
  const itemsList = items.toList()
  const template = itemsList.map((site) => {
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
        onSiteDetailContextMenu(site, activeFrame, e)
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
          const bookmarkItemSiteKey = siteUtil.getSiteKey(bookmarkItem)
          const siteKey = siteUtil.getSiteKey(site)

          appActions.moveSite(bookmarkItemSiteKey, siteKey, dndData.shouldPrependVerticalItem(e.target, e.clientY))
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
  return menuUtil.sanitizeTemplateItems(template)
}

function moreBookmarksTemplateInit (allBookmarkItems, bookmarks, activeFrame) {
  const template = bookmarkItemsInit(allBookmarkItems, bookmarks, activeFrame)
  template.push({
    l10nLabelId: 'moreBookmarks',
    click: function () {
      appActions.createTabRequested({
        url: 'about:bookmarks'
      })
      windowActions.setContextMenuDetail()
    }
  })
  return menuUtil.sanitizeTemplateItems(template)
}

function autofillTemplateInit (suggestions, frame) {
  const template = []
  for (let i = 0; i < suggestions.length; ++i) {
    let value
    const frontendId = suggestions[i].frontend_id
    if (frontendId >= 0) { //  POPUP_ITEM_ID_AUTOCOMPLETE_ENTRY and Autofill Entry
      value = suggestions[i].value
    } else if (frontendId === -1) { // POPUP_ITEM_ID_WARNING_MESSAGE
      value = 'Disabled due to unsecure connection.'
    } else if (frontendId === -2) { // POPUP_ITEM_ID_PASSWORD_ENTRY
      value = suggestions[i].value
    } else if (frontendId === -4) { // POPUP_ITEM_ID_CLEAR_FORM
      value = 'Clear Form'
    } else if (frontendId === -5) { // POPUP_ITEM_ID_AUTOFILL_OPTIONS
      value = 'Autofill Settings'
    } else if (frontendId === -6) { // POPUP_ITEM_ID_DATALIST_ENTRY
      value = suggestions[i].value
    } else if (frontendId === -11) { // POPUP_ITEM_ID_USERNAME_ENTRY
      value = suggestions[i].value
    }
    if (frontendId === -2) {
      template.push({
        label: 'Use password for:',
        enabled: false
      })
    }
    if (frontendId === -3) { // POPUP_ITEM_ID_SEPARATOR
      template.push(CommonMenu.separatorMenuItem)
    } else {
      template.push({
        label: value,
        click: (item) => {
          windowActions.autofillSelectionClicked(frame.get('tabId'), value, frontendId, i)
        }
      })
    }
  }
  return menuUtil.sanitizeTemplateItems(template)
}

function flashTemplateInit (frameProps) {
  const canRunFlash = appStoreRenderer.state.getIn(['flash', 'enabled']) && getSetting(settings.FLASH_INSTALLED)
  const template = []
  if (!canRunFlash) {
    template.push({
      label: locale.translation('openFlashPreferences'),
      click: () => {
        appActions.createTabRequested({
          url: 'about:preferences#plugins',
          windowId: frameProps.get('windowId'),
          active: true
        })
      }
    })
  } else {
    template.push({
      label: locale.translation('allowFlashOnce'),
      click: () => {
        appActions.allowFlashOnce(frameProps.get('tabId'), frameProps.get('location'), frameProps.get('isPrivate'))
      }
    })
    if (!frameProps.get('isPrivate')) {
      template.push({
        label: locale.translation('allowFlashAlways'),
        click: () => {
          appActions.allowFlashAlways(frameProps.get('tabId'), frameProps.get('location'))
        }
      })
    }
  }
  return template
}

function tabTemplateInit (frameProps) {
  const frameKey = frameProps.get('key')
  const tabId = frameProps.get('tabId')
  const template = [CommonMenu.newTabMenuItem(frameProps.get('tabId'))]
  const location = frameProps.get('location')
  const store = windowStore.getState()

  if (location !== 'about:newtab') {
    template.push(
      CommonMenu.separatorMenuItem,
      {
        label: locale.translation('reloadTab'),
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            focusedWindow.webContents.send(messages.SHORTCUT_FRAME_RELOAD, frameKey)
          }
        }
      }, {
        label: locale.translation('clone'),
        click: (item) => {
          appActions.tabCloned(tabId)
        }
      })
  }

  if (windowStore.getState().get('frames').size > 1 &&
      !frameProps.get('pinnedLocation')) {
    template.push({
      label: locale.translation('detach'),
      click: (item) => {
        const browserOpts = { positionByMouseCursor: true }
        appActions.tabDetachMenuItemClicked(tabId, frameProps.toJS(), browserOpts, -1)
      }
    })
  }

  if (!frameProps.get('isPrivate')) {
    const isPinned = frameProps.get('pinnedLocation')
    if (!(location === 'about:blank' || location === 'about:newtab' || isIntermediateAboutPage(location))) {
      template.push({
        label: locale.translation(isPinned ? 'unpinTab' : 'pinTab'),
        click: (item) => {
          // Handle converting the current tab window into a pinned site
          appActions.tabPinned(tabId, !isPinned)
        }
      })
    }
  }

  // template.push({
  //   label: locale.translation('moveTabToNewWindow'),
  //   enabled: false,
  //   click: (item, focusedWindow) => {
  //     // TODO: actually move tab to new window
  //   }
  // })

  const frames = windowStore.getState().get('frames')
  const frameToSkip = frameProps.get('key')
  const frameList = frames.map((frame) => {
    return {
      frameKey: frame.get('key'),
      tabId: frame.get('tabId'),
      muted: frame.get('key') !== frameToSkip && frame.get('audioPlaybackActive')
    }
  })

  template.push(CommonMenu.separatorMenuItem,
    {
      label: locale.translation('muteOtherTabs'),
      click: () => {
        windowActions.muteAllAudio(frameList)
      }
    })

  if (frameProps.get('audioPlaybackActive')) {
    const isMuted = frameProps.get('audioMuted')

    template.push({
      label: locale.translation(isMuted ? 'unmuteTab' : 'muteTab'),
      click: (item) => {
        windowActions.setAudioMuted(frameKey, tabId, !isMuted)
      }
    })
  }

  template.push(CommonMenu.separatorMenuItem)

  if (!frameProps.get('pinnedLocation')) {
    template.push({
      label: locale.translation('closeTab'),
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          // TODO: Don't switch active tabs when this is called
          focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_FRAME, frameKey)
        }
      }
    })
  }

  template.push({
    label: locale.translation('closeOtherTabs'),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_OTHER_FRAMES, frameKey, true, true)
      }
    }
  }, {
    label: locale.translation('closeTabsToRight'),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_OTHER_FRAMES, frameKey, true, false)
      }
    }
  }, {
    label: locale.translation('closeTabsToLeft'),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_OTHER_FRAMES, frameKey, false, true)
      }
    }
  }, CommonMenu.separatorMenuItem)

  template.push(Object.assign({},
    CommonMenu.reopenLastClosedTabItem(),
    { enabled: store.get('closedFrames').size > 0 }
  ))

  return menuUtil.sanitizeTemplateItems(template)
}

function getMisspelledSuggestions (selection, isMisspelled, suggestions, tabId) {
  const hasSelection = selection.length > 0
  const template = []
  if (hasSelection) {
    if (suggestions.length > 0) {
      // Map the first 3 suggestions to menu items that allows click
      // to replace the text.
      template.push(...suggestions.slice(0, 3).map((suggestion) => {
        return {
          label: suggestion,
          click: () => {
            appActions.spellingSuggested(suggestion, tabId)
          }
        }
      }), CommonMenu.separatorMenuItem)
    }
    if (isMisspelled) {
      template.push({
        label: locale.translation('learnSpelling'),
        click: () => {
          appActions.learnSpelling(selection, tabId)
        }
      }, CommonMenu.separatorMenuItem)
    } else {
      template.push({
        label: locale.translation('forgetLearnedSpelling'),
        click: () => {
          appActions.forgetLearnedSpelling(selection, tabId)
        }
      }, CommonMenu.separatorMenuItem)
    }
  }
  return menuUtil.sanitizeTemplateItems(template)
}

function getEditableItems (selection, editFlags, hasFormat) {
  const hasSelection = selection && selection.length > 0
  const hasClipboard = clipboard.readText().length > 0
  const template = []

  if (!editFlags || editFlags.canCut) {
    template.push({
      label: locale.translation('cut'),
      enabled: hasSelection,
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    })
  }
  if (!editFlags || editFlags.canCopy) {
    template.push({
      label: locale.translation('copy'),
      enabled: hasSelection,
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    })
  }
  if (!editFlags || editFlags.canPaste) {
    template.push({
      label: locale.translation('paste'),
      accelerator: 'CmdOrCtrl+V',
      enabled: hasClipboard,
      role: 'paste'
    })
    if (hasFormat) {
      template.push({
        label: locale.translation('pasteWithoutFormatting'),
        accelerator: 'Shift+CmdOrCtrl+V',
        enabled: hasClipboard,
        click: function (item, focusedWindow) {
          focusedWindow.webContents.pasteAndMatchStyle()
        }
      })
    }
  }
  return menuUtil.sanitizeTemplateItems(template)
}

function hamburgerTemplateInit (location, e) {
  const helpSubmenu = [
    CommonMenu.aboutBraveMenuItem(),
    CommonMenu.separatorMenuItem
  ]

  if (!isLinux) {
    helpSubmenu.push(
      CommonMenu.checkForUpdateMenuItem(),
      CommonMenu.separatorMenuItem)
  }

  helpSubmenu.push(CommonMenu.submitFeedbackMenuItem())

  const template = [
    CommonMenu.newTabMenuItem(),
    CommonMenu.newPrivateTabMenuItem(),
    CommonMenu.newPartitionedTabMenuItem(),
    CommonMenu.newWindowMenuItem(),
    CommonMenu.separatorMenuItem,
    {
      l10nLabelId: 'zoom',
      items: [{
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
    {
      label: locale.translation('bookmarks'),
      submenu: [
        CommonMenu.bookmarksManagerMenuItem(),
        CommonMenu.bookmarksToolbarMenuItem(),
        CommonMenu.separatorMenuItem,
        CommonMenu.importBrowserDataMenuItem(),
        CommonMenu.exportBookmarksMenuItem()
      ]
    }, {
      label: locale.translation('bravery'),
      submenu: [
        // CommonMenu.braveryGlobalMenuItem(),
        CommonMenu.braverySiteMenuItem(),
        CommonMenu.braveryPaymentsMenuItem()
      ]
    },
    CommonMenu.downloadsMenuItem(),
    CommonMenu.findOnPageMenuItem(),
    CommonMenu.printMenuItem(),
    CommonMenu.separatorMenuItem,
    CommonMenu.preferencesMenuItem(),
    CommonMenu.separatorMenuItem,
    {
      label: locale.translation('help'),
      submenu: helpSubmenu
    },
    CommonMenu.quitMenuItem()
  ]
  return menuUtil.sanitizeTemplateItems(template)
}

const openInNewTabMenuItem = (url, isPrivate, partitionNumber, openerTabId) => {
  const active = getSetting(settings.SWITCH_TO_NEW_TABS) === true
  if (Array.isArray(url) && Array.isArray(partitionNumber)) {
    return {
      label: locale.translation('openInNewTabs'),
      click: () => {
        for (let i = 0; i < url.length; ++i) {
          appActions.createTabRequested({
            url: url[i],
            isPrivate,
            partitionNumber: partitionNumber[i],
            openerTabId,
            active
          })
        }
      }
    }
  } else {
    return {
      label: locale.translation('openInNewTab'),
      click: () => {
        appActions.createTabRequested({
          url,
          isPrivate,
          partitionNumber,
          openerTabId,
          active
        })
      }
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

const openInNewPrivateTabMenuItem = (url, openerTabId) => {
  const active = getSetting(settings.SWITCH_TO_NEW_TABS) === true
  if (Array.isArray(url)) {
    return {
      label: locale.translation('openInNewPrivateTabs'),
      click: () => {
        for (let i = 0; i < url.length; ++i) {
          appActions.createTabRequested({
            url: url[i],
            isPrivate: true,
            openerTabId,
            active
          })
        }
      }
    }
  } else {
    return {
      label: locale.translation('openInNewPrivateTab'),
      click: () => {
        appActions.createTabRequested({
          url,
          isPrivate: true,
          openerTabId,
          active
        })
      }
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

const openInNewSessionTabMenuItem = (url, openerTabId) => {
  const active = getSetting(settings.SWITCH_TO_NEW_TABS) === true
  if (Array.isArray(url)) {
    return {
      label: locale.translation('openInNewSessionTabs'),
      click: (item) => {
        for (let i = 0; i < url.length; ++i) {
          appActions.createTabRequested({
            url: url[i],
            isPartitioned: true,
            openerTabId,
            active
          })
        }
      }
    }
  } else {
    return {
      label: locale.translation('openInNewSessionTab'),
      click: (item) => {
        appActions.createTabRequested({
          url,
          isPartitioned: true,
          openerTabId,
          active
        })
      }
    }
  }
}

const saveAsMenuItem = (label, location) => {
  return {
    label: locale.translation(label),
    click: (item, focusedWindow) => {
      if (focusedWindow && location) {
        focusedWindow.webContents.downloadURL(location, true)
      }
    }
  }
}

const copyAddressMenuItem = (label, location) => {
  return {
    label: locale.translation(label),
    click: (item) => {
      if (location) {
        appActions.clipboardTextCopied(location)
      }
    }
  }
}

const copyEmailAddressMenuItem = (location) => {
  return {
    label: locale.translation('copyEmailAddress'),
    click: () => {
      appActions.clipboardTextCopied(location.substring('mailto:'.length, location.length))
    }
  }
}

const searchSelectionMenuItem = (location) => {
  var searchText = textUtils.ellipse(location)
  return {
    label: locale.translation('openSearch').replace(/{{\s*selectedVariable\s*}}/, searchText),
    click: (item) => {
      if (location) {
        let activeFrame = windowStore.getState().get('activeFrameKey')
        let frame = windowStore.getFrame(activeFrame)
        let searchUrl = appStoreRenderer.state.getIn(['searchDetail', 'searchURL']).replace('{searchTerms}', encodeURIComponent(location))
        appActions.createTabRequested({
          url: searchUrl,
          isPrivate: frame.get('isPrivate'),
          partitionNumber: frame.get('partitionNumber'),
          windowId: frame.get('windowId')
        })
      }
    }
  }
}

const showDefinitionMenuItem = (selectionText) => {
  let lookupText = textUtils.ellipse(selectionText, 3)
  return {
    label: locale.translation('lookupSelection').replace(/{{\s*selectedVariable\s*}}/, lookupText),
    click: (item) => {
      webviewActions.showDefinitionForSelection()
    }
  }
}

function addLinkMenu (link, frame) {
  const template = []
  if (!frame.get('isPrivate')) {
    template.push(openInNewTabMenuItem(link, frame.get('isPrivate'), frame.get('partitionNumber'), frame.get('tabId')))
  }
  template.push(
    openInNewPrivateTabMenuItem(link, frame.get('tabId')),
    openInNewWindowMenuItem(link, frame.get('isPrivate'), frame.get('partitionNumber')),
    CommonMenu.separatorMenuItem,
    openInNewSessionTabMenuItem(link, frame.get('tabId')),
    CommonMenu.separatorMenuItem)

  if (link.toLowerCase().startsWith('mailto:')) {
    template.push(copyEmailAddressMenuItem(link))
  } else {
    template.push(
        saveAsMenuItem('saveLinkAs', link),
        copyAddressMenuItem('copyLinkAddress', link),
        CommonMenu.separatorMenuItem)
  }

  return template
}

function mainTemplateInit (nodeProps, frame, tab) {
  let template = []

  nodeProps = nodeProps || {}
  frame = makeImmutable(frame || {})

  const isLink = nodeProps.linkURL && nodeProps.linkURL !== ''
  const isImage = nodeProps.mediaType === 'image'
  const isVideo = nodeProps.mediaType === 'video'
  const isAudio = nodeProps.mediaType === 'audio'
  const isInputField = nodeProps.isEditable || nodeProps.inputFieldType !== 'none'
  const isTextSelected = nodeProps.selectionText && nodeProps.selectionText.length > 0
  const isAboutPage = aboutUrls.has(frame.get('location'))
  const isPrivate = frame.get('isPrivate')

  if (isLink) {
    template = addLinkMenu(nodeProps.linkURL, frame)
  } else if (isTextSelected && urlUtil.isURL(nodeProps.selectionText)) {
    template = addLinkMenu(nodeProps.selectionText, frame)
  }

  if (isImage) {
    const active = getSetting(settings.SWITCH_TO_NEW_TABS) === true
    template.push(
      {
        label: locale.translation('openImageInNewTab'),
        click: (item) => {
          if (nodeProps.srcURL) {
            appActions.createTabRequested({
              url: nodeProps.srcURL,
              openerTabId: frame.get('tabId'),
              partition: getPartitionFromNumber(frame.get('partitionNumber'), isPrivate),
              active: active
            })
          }
        }
      },
      saveAsMenuItem('saveImage', nodeProps.srcURL),
      {
        label: locale.translation('copyImage'),
        click: (item) => {
          if (nodeProps.srcURL) {
            if (urlParse(nodeProps.srcURL).protocol === 'data:') {
              appActions.dataURLCopied(nodeProps.srcURL, `<img src='${nodeProps.srcURL}>`, nodeProps.srcURL)
            } else {
              getBase64FromImageUrl(nodeProps.srcURL).then((dataURL) =>
                appActions.dataURLCopied(dataURL, `<img src='${nodeProps.srcURL}>`, nodeProps.srcURL))
            }
          }
        }
      },
      copyAddressMenuItem('copyImageAddress', nodeProps.srcURL)
    )
    if (getSetting(settings.DEFAULT_SEARCH_ENGINE) === 'Google' &&
      nodeProps.srcURL && urlParse(nodeProps.srcURL).protocol !== 'data:') {
      template.push(
        {
          label: locale.translation('searchImage'),
          click: () => {
            let activeFrame = windowStore.getState().get('activeFrameKey')
            let frame = windowStore.getFrame(activeFrame)
            let searchUrl = appStoreRenderer.state.getIn(['searchDetail', 'searchURL'])
              .replace('{searchTerms}', encodeURIComponent(nodeProps.srcURL))
              .replace('?q', 'byimage?image_url')
            appActions.createTabRequested({
              url: searchUrl,
              isPrivate,
              partitionNumber: frame.get('partitionNumber')
            })
          }
        }
      )
    }
    template.push(CommonMenu.separatorMenuItem)
  }

  if (isInputField) {
    let misspelledSuggestions = []
    if (nodeProps.misspelledWord) {
      misspelledSuggestions =
        getMisspelledSuggestions(nodeProps.selectionText,
                                 true, nodeProps.dictionarySuggestions,
                                 frame.get('tabId'))
    } else if (nodeProps.properties &&
               nodeProps.properties.hasOwnProperty('customDictionaryWord') &&
               nodeProps.properties['customDictionaryWord'] === nodeProps.selectionText) {
      misspelledSuggestions =
        getMisspelledSuggestions(nodeProps.selectionText,
                                 false, nodeProps.dictionarySuggestions,
                                  frame.get('tabId'))
    }

    const editableItems = getEditableItems(nodeProps.selectionText, nodeProps.editFlags, true)
    template.push(...misspelledSuggestions, {
      label: locale.translation('undo'),
      accelerator: 'CmdOrCtrl+Z',
      role: 'undo'
    }, {
      label: locale.translation('redo'),
      accelerator: 'Shift+CmdOrCtrl+Z',
      role: 'redo'
    }, CommonMenu.separatorMenuItem)

    if (editableItems.length > 0) {
      template.push(...editableItems, CommonMenu.separatorMenuItem)
    }

    if (isTextSelected) {
      if (isDarwin) {
        template.push(showDefinitionMenuItem(nodeProps.selectionText), CommonMenu.separatorMenuItem)
      }
      template.push(searchSelectionMenuItem(nodeProps.selectionText), CommonMenu.separatorMenuItem)
    }
  } else if (isTextSelected) {
    if (isDarwin) {
      template.push(showDefinitionMenuItem(nodeProps.selectionText),
        CommonMenu.separatorMenuItem
      )
      if (isLink) {
        template.push(addBookmarkMenuItem('bookmarkLink', {
          location: nodeProps.linkURL,
          tags: [siteTags.BOOKMARK]
        }, false))
      }
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
            enabled: tab.get('canGoBack'),
            click: (item, focusedWindow) => {
              if (focusedWindow) {
                focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_BACK)
              }
            }
          }, {
            label: locale.translation('forward'),
            enabled: tab.get('canGoForward'),
            click: (item, focusedWindow) => {
              if (focusedWindow) {
                focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_FORWARD)
              }
            }
          }, {
            label: locale.translation('reloadPage'),
            accelerator: 'CmdOrCtrl+R',
            click: (item, focusedWindow) => {
              if (focusedWindow) {
                focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_RELOAD)
              }
            }
          },
          CommonMenu.separatorMenuItem,
          addBookmarkMenuItem('bookmarkPage', siteUtil.getDetailFromFrame(frame, siteTags.BOOKMARK), false))

        if (!isAboutPage) {
          template.push({
            label: locale.translation('savePageAs'),
            accelerator: 'CmdOrCtrl+S',
            click: function (item, focusedWindow) {
              CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_SAVE])
            }
          })
        }

        template.push({
          label: locale.translation('find'),
          accelerator: 'CmdOrCtrl+F',
          click: function (item, focusedWindow) {
            focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_SHOW_FINDBAR)
          }
        })

        if (!isAboutPage) {
          template.push({
            label: locale.translation('print'),
            accelerator: 'CmdOrCtrl+P',
            click: function (item, focusedWindow) {
              focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_PRINT)
            }
          })
        }

        // CommonMenu.separatorMenuItem
        // TODO: bravery menu goes here
      }

      template.push(CommonMenu.separatorMenuItem)
    }

    if (!isLink && !isImage && !isAboutPage) {
      template.push({
        label: locale.translation('viewPageSource'),
        accelerator: 'CmdOrCtrl+Alt+U',
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE)
          }
        }
      })
    }
  }

  if (!isAboutPage) {
    template.push({
      label: locale.translation('inspectElement'),
      click: (item) => {
        webviewActions.inspectElement(nodeProps.x, nodeProps.y)
      }
    })
  }

  const extensionContextMenus = isPrivate
    ? undefined
    : extensionState.getContextMenusProperties(appStore.state)
  if (extensionContextMenus !== undefined &&
    extensionContextMenus.length) {
    template.push(CommonMenu.separatorMenuItem)
    let templateMap = {}
    extensionContextMenus.forEach((extensionContextMenu) => {
      let info = {}
      let contextsPassed = false
      if (extensionContextMenu.properties.contexts !== undefined &&
        extensionContextMenu.properties.contexts.length) {
        extensionContextMenu.properties.contexts.forEach((context) => {
          if (isTextSelected && (context === 'selection' || context === 'all')) {
            info['selectionText'] = nodeProps.selectionText
            contextsPassed = true
          } else if (isLink && (context === 'link' || context === 'all')) {
            info['linkUrl'] = nodeProps.linkURL
            contextsPassed = true
          } else if (isImage && (context === 'image' || context === 'all')) {
            info['mediaType'] = 'image'
            contextsPassed = true
          } else if (isInputField && (context === 'editable' || context === 'all')) {
            info['editable'] = true
            contextsPassed = true
          } else if (nodeProps.pageURL && (context === 'page' || context === 'all')) {
            info['pageUrl'] = nodeProps.pageURL
            contextsPassed = true
          } else if (isVideo && (context === 'video' || context === 'all')) {
            info['mediaType'] = 'video'
            contextsPassed = true
          } else if (isAudio && (context === 'audio' || context === 'all')) {
            info['mediaType'] = 'audio'
            contextsPassed = true
          } else if (nodeProps.frameURL && (context === 'frame' || context === 'all')) {
            info['frameURL'] = nodeProps.frameURL
            contextsPassed = true
          }
        })
      }
      if (nodeProps.srcURL) {
        info['srcURL'] = nodeProps.srcURL
      }
      // TODO (Anthony): Browser Action context menu
      if (extensionContextMenu.properties.contexts !== undefined &&
        extensionContextMenu.properties.contexts.length === 1 &&
        extensionContextMenu.properties.contexts[0] === 'browser_action') {
        contextsPassed = false
      }
      if (contextsPassed) {
        info['menuItemId'] = extensionContextMenu.menuItemId
        if (extensionContextMenu.properties.parentId) {
          info['parentMenuItemId'] = extensionContextMenu.properties.parentId
          if (templateMap[extensionContextMenu.properties.parentId].submenu === undefined) {
            templateMap[extensionContextMenu.properties.parentId].submenu = []
          }
          templateMap[extensionContextMenu.properties.parentId].submenu.push(
            {
              label: extensionContextMenu.properties.title,
              click: (item, focusedWindow) => {
                if (focusedWindow) {
                  extensionActions.contextMenuClicked(
                    extensionContextMenu.extensionId, frame.get('tabId'), info)
                }
              }
            })
          const submenuLength = templateMap[extensionContextMenu.properties.parentId].submenu.length
          templateMap[extensionContextMenu.menuItemId] =
            templateMap[extensionContextMenu.properties.parentId].submenu[submenuLength - 1]
        } else {
          template.push(
            {
              label: extensionContextMenu.properties.title,
              click: (item, focusedWindow) => {
                if (focusedWindow) {
                  extensionActions.contextMenuClicked(
                    extensionContextMenu.extensionId, frame.get('tabId'), info)
                }
              },
              icon: extensionContextMenu.icon
            })
          templateMap[extensionContextMenu.menuItemId] = template[template.length - 1]
        }
      }
    })
  }

  if (frame.get('location') === 'about:bookmarks') {
    template.push(
      CommonMenu.separatorMenuItem,
      addBookmarkMenuItem('addBookmark', {
        location: nodeProps.linkURL,
        tags: [siteTags.BOOKMARK]
      }),
      addFolderMenuItem()
    )
  }

  return menuUtil.sanitizeTemplateItems(template)
}

function onHamburgerMenu (location, e) {
  const menuTemplate = hamburgerTemplateInit(location, e)
  const rect = e.target.parentNode.getBoundingClientRect()
  windowActions.setContextMenuDetail(Immutable.fromJS({
    right: 0,
    top: rect.bottom,
    template: menuTemplate,
    type: 'hamburgerMenu'
  }))
}

function onMainContextMenu (nodeProps, frame, tab, contextMenuType) {
  if (contextMenuType === 'bookmark' || contextMenuType === 'bookmark-folder') {
    const activeFrame = Immutable.fromJS({ location: '', title: '', partitionNumber: frame.get('partitionNumber') })
    onSiteDetailContextMenu(Immutable.fromJS(nodeProps), activeFrame)
  } else if (contextMenuType === 'history') {
    onSiteDetailContextMenu(Immutable.fromJS(nodeProps))
  } else if (contextMenuType === 'synopsis') {
    onLedgerContextMenu(nodeProps.location, nodeProps.hostPattern)
  } else if (contextMenuType === 'download') {
    onDownloadsToolbarContextMenu(nodeProps.downloadId, Immutable.fromJS(nodeProps))
  } else {
    const mainMenu = Menu.buildFromTemplate(mainTemplateInit(nodeProps, frame, tab))
    mainMenu.popup(getCurrentWindow())
  }
}

function onFlashContextMenu (nodeProps, frameProps) {
  const flashMenu = Menu.buildFromTemplate(flashTemplateInit(frameProps))
  flashMenu.popup(getCurrentWindow())
}

function onTabContextMenu (frameProps, e) {
  e.stopPropagation()
  const tabMenu = Menu.buildFromTemplate(tabTemplateInit(frameProps))
  tabMenu.popup(getCurrentWindow())
}

function onNewTabContextMenu (target) {
  const menuTemplate = [
    CommonMenu.newTabMenuItem(),
    CommonMenu.newPrivateTabMenuItem(),
    CommonMenu.newPartitionedTabMenuItem(),
    CommonMenu.newWindowMenuItem()
  ]
  const menu = Menu.buildFromTemplate(menuTemplate)
  menu.popup(getCurrentWindow())
}

function onTabsToolbarContextMenu (bookmarkTitle, bookmarkLink, closestDestinationDetail, isParent, e) {
  e.stopPropagation()
  const tabsToolbarMenu = Menu.buildFromTemplate(tabsToolbarTemplateInit(bookmarkTitle, bookmarkLink, closestDestinationDetail, isParent))
  tabsToolbarMenu.popup(getCurrentWindow())
}

function onDownloadsToolbarContextMenu (downloadId, downloadItem, e) {
  if (e) {
    e.stopPropagation()
  }
  const downloadsToolbarMenu = Menu.buildFromTemplate(downloadsToolbarTemplateInit(downloadId, downloadItem))
  downloadsToolbarMenu.popup(getCurrentWindow())
}

function onTabPageContextMenu (framePropsList, e) {
  e.stopPropagation()
  const tabPageMenu = Menu.buildFromTemplate(tabPageTemplateInit(framePropsList))
  tabPageMenu.popup(getCurrentWindow())
}

function onUrlBarContextMenu (e) {
  e.stopPropagation()
  const searchDetail = appStoreRenderer.state.get('searchDetail')
  const windowState = windowStore.getState()
  const activeFrame = getActiveFrame(windowState)
  const inputMenu = Menu.buildFromTemplate(urlBarTemplateInit(searchDetail, activeFrame, e))
  inputMenu.popup(getCurrentWindow())
}

function onFindBarContextMenu (e) {
  e.stopPropagation()
  const findBarMenu = Menu.buildFromTemplate(findBarTemplateInit(e))
  findBarMenu.popup(getCurrentWindow())
}

function onSiteDetailContextMenu (siteDetail, activeFrame, e) {
  if (e) {
    e.stopPropagation()
  }
  const menu = Menu.buildFromTemplate(siteDetailTemplateInit(siteDetail, activeFrame))
  menu.popup(getCurrentWindow())
}

function onLedgerContextMenu (location, hostPattern) {
  const template = [openInNewTabMenuItem(location),
    openInNewPrivateTabMenuItem(location),
    openInNewSessionTabMenuItem(location),
    copyAddressMenuItem('copyLinkAddress', location),
    CommonMenu.separatorMenuItem,
    {
      label: locale.translation('deleteLedgerEntry'),
      click: () => appActions.changeSiteSetting(hostPattern, 'ledgerPaymentsShown', false)
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  menu.popup(getCurrentWindow())
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

function onShowAutofillMenu (suggestions, targetRect, frame, boundingClientRect) {
  const menuTemplate = autofillTemplateInit(suggestions, frame)
  // toolbar UI scale ratio
  const xRatio = window.innerWidth / window.outerWidth
  const yRatio = window.innerHeight / window.outerHeight
  const tabId = frame.get('tabId')
  windowActions.setContextMenuDetail(Immutable.fromJS({
    type: 'autofill',
    tabId,
    left: boundingClientRect.left + (targetRect.x * xRatio),
    top: boundingClientRect.top + ((targetRect.y + targetRect.height) * yRatio),
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

function onReloadContextMenu (target) {
  const rect = target.getBoundingClientRect()
  const menuTemplate = [
    CommonMenu.reloadPageMenuItem(),
    CommonMenu.cleanReloadMenuItem()
  ]

  windowActions.setContextMenuDetail(Immutable.fromJS({
    left: rect.left,
    top: rect.bottom + 2,
    template: menuTemplate
  }))
}

module.exports = {
  onHamburgerMenu,
  onFlashContextMenu,
  onMainContextMenu,
  onTabContextMenu,
  onNewTabContextMenu,
  onTabsToolbarContextMenu,
  onDownloadsToolbarContextMenu,
  onTabPageContextMenu,
  onUrlBarContextMenu,
  onFindBarContextMenu,
  onSiteDetailContextMenu,
  onShowBookmarkFolderMenu,
  onShowAutofillMenu,
  onMoreBookmarksMenu,
  onReloadContextMenu
}
