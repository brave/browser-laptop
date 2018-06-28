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
const downloadUtil = require('./state/downloadUtil')
const menuUtil = require('../app/common/lib/menuUtil')
const urlUtil = require('./lib/urlutil')
const CommonMenu = require('../app/common/commonMenu')
const appStoreRenderer = require('./stores/appStoreRenderer')
const ipc = require('electron').ipcRenderer
const locale = require('../js/l10n')
const {getSetting} = require('./settings')
const settings = require('./constants/settings')
const textUtils = require('./lib/text')
const {isIntermediateAboutPage, isUrl, aboutUrls} = require('./lib/appUrlUtil')
const urlParse = require('../app/common/urlParse')
const {getCurrentWindow} = require('../app/renderer/currentWindow')
const extensionState = require('../app/common/state/extensionState')
const extensionActions = require('../app/common/actions/extensionActions')
const bookmarkUtil = require('../app/common/lib/bookmarkUtil')
const bookmarksState = require('../app/common/state/bookmarksState')
const historyState = require('../app/common/state/historyState')
const frameStateUtil = require('./state/frameStateUtil')
const platformUtil = require('../app/common/lib/platformUtil')
const bookmarkFoldersUtil = require('../app/common/lib/bookmarkFoldersUtil')
const historyUtil = require('../app/common/lib/historyUtil')
const {makeImmutable} = require('../app/common/state/immutableUtil')
const ledgerUtil = require('../app/common/lib/ledgerUtil')

const isDarwin = platformUtil.isDarwin()
const isLinux = platformUtil.isLinux()

/**
 * Gets the correct search URL for the current frame.
 * @param {Immutable.Map} activeFrame - currently active frame
 * @param {string} searchTerms - terms to search
 * @returns {string}
 */
const getSearchUrl = (activeFrame, searchTerms) => {
  const searchUrl = (
    (getSetting(settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE_TOR) && frameStateUtil.isTor(activeFrame)) ||
    (getSetting(settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE) && activeFrame.get('isPrivate'))
  )
  ? 'https://duckduckgo.com/?q={searchTerms}'
  : appStoreRenderer.state.getIn(['searchDetail', 'searchURL'])
  return searchUrl.replace('{searchTerms}', encodeURIComponent(searchTerms))
}

/**
 * Obtains an add bookmark menu item
 */
const addBookmarkMenuItem = (label, siteDetail, closestDestinationDetail, isParent) => {
  return {
    label: locale.translation(label),
    accelerator: 'CmdOrCtrl+D',
    click: () => {
      let closestKey = null

      if (closestDestinationDetail) {
        closestKey = closestDestinationDetail.get('key')

        if (isParent) {
          siteDetail = siteDetail.set('parentFolderId', (closestDestinationDetail.get('folderId') || closestDestinationDetail.get('parentFolderId')))
        }
      }

      if (siteDetail.constructor !== Immutable.Map) {
        siteDetail = Immutable.fromJS(siteDetail)
      }

      siteDetail = siteDetail.set('location', urlUtil.getLocationIfPDF(siteDetail.get('location')))
      windowActions.addBookmark(siteDetail, closestKey)
    }
  }
}

const addFolderMenuItem = (closestDestinationDetail, isParent) => {
  return {
    label: locale.translation('addFolder'),
    click: () => {
      let closestKey = null
      let folderDetails = Immutable.Map()

      if (closestDestinationDetail) {
        closestKey = closestDestinationDetail.get('key')

        if (isParent) {
          folderDetails = folderDetails.set('parentFolderId', (closestDestinationDetail.get('folderId') || closestDestinationDetail.get('parentFolderId')))
        }
      }

      windowActions.addBookmarkFolder(folderDetails, closestKey)
    }
  }
}

function urlBarTemplateInit (activeFrame, e) {
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
    const searchUrl = getSearchUrl(activeFrame, clipboardText)

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
    location: bookmarkLink
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

const getLabel = (siteDetail, type, activeFrame) => {
  let label = ''

  if (Immutable.List.isList(siteDetail)) {
    if (type === siteTags.BOOKMARK) {
      label = 'deleteBookmarks'
    } else if (type === siteTags.HISTORY) {
      label = 'deleteHistoryEntries'
    }
  } else if (type === siteTags.BOOKMARK && activeFrame) {
    label = 'deleteBookmark'
  } else if (type === siteTags.BOOKMARK_FOLDER) {
    label = 'deleteFolder'
  } else if (type === siteTags.HISTORY) {
    label = 'deleteHistoryEntry'
  }

  return label
}

const siteMultipleDetailTemplate = (data, type, activeFrame) => {
  const template = []
  const label = getLabel(data, type)

  let locations = []
  let partitionNumbers = []
  let keys = []
  data.forEach((site) => {
    locations.push(site.get('location'))
    partitionNumbers.push(site.get('partitionNumber'))
    keys.push(site.get('key'))
  })

  template.push(
    openInNewTabMenuItem(locations, partitionNumbers),
    openInNewPrivateTabMenuItem(locations),
    openInNewPrivateTabMenuItem(locations, undefined, true),
    openInNewSessionTabMenuItem(locations),
    CommonMenu.separatorMenuItem
  )

  template.push({
    label: locale.translation(label),
    click: () => {
      if (type === siteTags.BOOKMARK) {
        appActions.removeBookmark(keys)
      } else if (type === siteTags.HISTORY) {
        appActions.removeHistorySite(keys)
      }
    }
  })

  if (type !== siteTags.HISTORY) {
    if (template[template.length - 1] !== CommonMenu.separatorMenuItem) {
      template.push(CommonMenu.separatorMenuItem)
    }

    template.push(
      addBookmarkMenuItem('addBookmark', bookmarkUtil.getDetailFromFrame(activeFrame), null, true),
      addFolderMenuItem(null, true)
    )
  }

  return template
}

const siteSingleDetailTemplate = (siteKey, type, activeFrame) => {
  const template = []
  const state = appStoreRenderer.state
  const paymentsEnabled = getSetting(settings.PAYMENTS_ENABLED)
  let isFolder = type === siteTags.BOOKMARK_FOLDER
  let siteDetail

  if (type === siteTags.HISTORY) {
    siteDetail = historyState.getSite(state, siteKey)
  } else {
    siteDetail = bookmarksState.findBookmark(state, siteKey)
  }

  const label = getLabel(siteDetail, type, activeFrame)

  if (type !== siteTags.BOOKMARK_FOLDER) {
    const location = siteDetail.get('location')

    template.push(
      openInNewTabMenuItem(location, siteDetail.get('partitionNumber')),
      openInNewPrivateTabMenuItem(location),
      openInNewPrivateTabMenuItem(location, undefined, true),
      openInNewWindowMenuItem(location, undefined, siteDetail.get('partitionNumber')),
      openInNewSessionTabMenuItem(location),
      copyAddressMenuItem('copyLinkAddress', location),
      CommonMenu.separatorMenuItem
    )
  } else {
    template.push(openAllInNewTabsMenuItem(siteDetail), CommonMenu.separatorMenuItem)
  }

  if (!siteDetail.isEmpty() && siteDetail.get('folderId') !== 0 && siteDetail.get('folderId') !== -1) {
    // Picking this menu item pops up the AddEditBookmark modal
    // - History can be deleted but not edited
    // - Multiple bookmarks cannot be edited at once
    // - "Bookmarks Toolbar" and "Other Bookmarks" folders cannot be deleted
    if (type !== siteTags.HISTORY) {
      template.push(
        {
          label: locale.translation(isFolder ? 'editFolder' : 'editBookmark'),
          click: () => {
            if (isFolder) {
              windowActions.editBookmarkFolder(siteKey)
            } else {
              windowActions.editBookmark(siteKey)
            }
          }
        },
        CommonMenu.separatorMenuItem
      )
    }

    template.push({
      label: locale.translation(label),
      click: () => {
        if (type === siteTags.HISTORY) {
          appActions.removeHistorySite(siteKey)
        } else if (type === siteTags.BOOKMARK) {
          appActions.removeBookmark(siteKey)
        } else if (type === siteTags.BOOKMARK_FOLDER) {
          appActions.removeBookmarkFolder(siteKey)
        }
      }
    })

    template.push({
      label: locale.translation('deleteDomainFromHistory'),
      click: () => {
        const domain = urlParse(siteDetail.get('location')).hostname
        appActions.removeHistoryDomain(domain)
      }
    })
  }

  if (type !== siteTags.HISTORY) {
    if (template[template.length - 1] !== CommonMenu.separatorMenuItem) {
      template.push(CommonMenu.separatorMenuItem)
    }

    template.push(
      addBookmarkMenuItem('addBookmark', bookmarkUtil.getDetailFromFrame(activeFrame), siteDetail, true),
      addFolderMenuItem(siteDetail, true)
    )
  }

  if (paymentsEnabled && (type === siteTags.HISTORY || type === siteTags.BOOKMARK)) {
    let location = siteDetail.get('location')
    let enabled = ledgerUtil.shouldShowMenuOption(state, location)
    if (enabled) {
      template.push(
        CommonMenu.separatorMenuItem,
        addToPublisherListMenuItem(location)
      )
    }
  }

  return template
}

const siteDetailTemplateInit = (data, type, activeFrame) => {
  let multiple = Immutable.List.isList(data)
  let template

  if (multiple) {
    template = siteMultipleDetailTemplate(data, type, activeFrame)
  } else {
    template = siteSingleDetailTemplate(data, type, activeFrame)
  }

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

function tabTemplateInit (frameProps) {
  if (!frameProps) {
    return null
  }

  const frameKey = frameProps.get('key')
  const tabId = frameProps.get('tabId')
  const template = [CommonMenu.newTabMenuItem(frameProps.get('tabId'))]
  const location = frameProps.get('location')
  const store = windowStore.getState()
  const frames = store.get('frames')
  const closedFrames = store.get('closedFrames')

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

  if (frames && frames.size > 1 &&
      !frameProps.get('pinnedLocation')) {
    template.push({
      label: locale.translation('detach'),
      click: (item) => {
        const browserOpts = { positionByMouseCursor: true, checkMaximized: true }
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

  template.push(CommonMenu.separatorMenuItem,
    {
      label: locale.translation('muteOtherTabs'),
      click: () => {
        // only select frames which are not the current frame and are not muted
        const otherFrames = frames.filter(frame =>
          frame.get('key') !== frameProps.get('key') &&
          frame.get('audioPlaybackActive') === true
        )
        const actionCommands = otherFrames.map(frame => ({
          tabId: frame.get('tabId'),
          frameKey: frame.get('key'),
          muted: true
        }))
        windowActions.muteAllAudio(actionCommands)
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

  template.push({
    label: locale.translation('closeTab'),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        const isPinned = frameProps.get('pinnedLocation')
        // if a tab is pinned, unpin it first then close
        if (isPinned) {
          appActions.tabPinned(tabId, !isPinned)
        }
        // TODO: Don't switch active tabs when this is called
        focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_FRAME, tabId)
      }
    }
  })

  template.push({
    label: locale.translation('closeOtherTabs'),
    click: (item) => {
      appActions.closeOtherTabsMenuItemClicked(tabId)
    }
  }, {
    label: locale.translation('closeTabsToRight'),
    click: (item, focusedWindow) => {
      appActions.closeTabsToRightMenuItemClicked(tabId)
    }
  }, {
    label: locale.translation('closeTabsToLeft'),
    click: (item, focusedWindow) => {
      appActions.closeTabsToLeftMenuItemClicked(tabId)
    }
  }, CommonMenu.separatorMenuItem)

  // debug options, only in development
  if (getSetting(settings.DEBUG_ALLOW_MANUAL_TAB_DISCARD) === true) {
    template.push(
      {
        label: 'Discard',
        click: (item) => {
          appActions.discardTabRequested(tabId)
        }
      },
      CommonMenu.separatorMenuItem
    )
  }

  template.push(Object.assign({},
    CommonMenu.reopenLastClosedTabItem(),
    { enabled: closedFrames ? closedFrames.size > 0 : false }
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
    CommonMenu.newTorTabMenuItem(),
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

const openInNewTabMenuItem = (url, partitionNumber, openerTabId) => {
  const active = getSetting(settings.SWITCH_TO_NEW_TABS) === true
  if (Array.isArray(url) && Array.isArray(partitionNumber)) {
    return {
      label: locale.translation('openInNewTabs'),
      click: () => {
        for (let i = 0; i < url.length; ++i) {
          appActions.createTabRequested({
            url: url[i],
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
          partitionNumber,
          openerTabId,
          active
        })
      }
    }
  }
}

const openAllInNewTabsMenuItem = (folderDetail) => {
  return {
    label: locale.translation('openAllInTabs'),
    click: () => {
      bookmarkActions.openBookmarksInFolder(folderDetail)
    }
  }
}

const openInNewPrivateTabMenuItem = (url, openerTabId, isTor) => {
  const active = getSetting(settings.SWITCH_TO_NEW_TABS) === true
  if (Array.isArray(url)) {
    return {
      label: locale.translation(isTor ? 'openInNewTorTabs' : 'openInNewPrivateTabs'),
      click: () => {
        for (let i = 0; i < url.length; ++i) {
          appActions.createTabRequested({
            url: url[i],
            isPrivate: true,
            isTor,
            openerTabId,
            active
          })
        }
      }
    }
  } else {
    return {
      label: locale.translation(isTor ? 'openInNewTorTab' : 'openInNewPrivateTab'),
      click: () => {
        appActions.createTabRequested({
          url,
          isPrivate: true,
          isTor,
          openerTabId,
          active
        })
      }
    }
  }
}

const openInNewWindowMenuItem = (location, isPrivate, partitionNumber, isTor) => {
  return {
    label: locale.translation('openInNewWindow'),
    click: () => {
      appActions.newWindow({ location, isPrivate, isTor, partitionNumber })
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
        const searchUrl = getSearchUrl(frame, location)
        const isPrivate = frame.get('isPrivate')
        const isTor = frameStateUtil.isTor(frame)
        appActions.createTabRequested({
          url: searchUrl,
          isPrivate,
          isTor,
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

const addToPublisherListMenuItem = (location) => {
  return {
    label: locale.translation('addToPublisherList'),
    click: () => {
      appActions.addPublisherToLedger(location)
    }
  }
}

function addLinkMenu (link, frame) {
  const template = []
  if (!frame.get('isPrivate')) {
    template.push(openInNewTabMenuItem(link, frame.get('partitionNumber'), frame.get('tabId')))
  }
  const isTor = frameStateUtil.isTor(frame)
  template.push(
    openInNewPrivateTabMenuItem(link, frame.get('tabId'), isTor),
    openInNewPrivateTabMenuItem(link, frame.get('tabId'), !isTor),
    openInNewWindowMenuItem(link, frame.get('isPrivate'),
      frame.get('partitionNumber'), isTor),
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
  const isTor = isPrivate && frameStateUtil.isTor(frame)

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
              isPrivate,
              isTor,
              partitionNumber: frame.get('partitionNumber'),
              active: active
            })
          }
        }
      },
      saveAsMenuItem('saveImage', nodeProps.srcURL),
      {
        label: locale.translation('copyImage'),
        click: (item) => {
          appActions.copyImage(frame.get('tabId'), nodeProps.x, nodeProps.y)
        }
      },
      copyAddressMenuItem('copyImageAddress', nodeProps.srcURL)
    )
    const searchUrl = getSearchUrl(frame, nodeProps.srcURL || '')
    if (searchUrl.startsWith('https://www.google.com/search?q') &&
      nodeProps.srcURL &&
      urlParse(nodeProps.srcURL).protocol !== 'data:') {
      template.push(
        {
          label: locale.translation('searchImage'),
          click: () => {
            appActions.createTabRequested({
              url: searchUrl.replace('?q', 'byimage?image_url'),
              isPrivate,
              isTor,
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
          location: nodeProps.linkURL
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
          location: nodeProps.linkURL
        }, false))
      } else {
        template.push(
          {
            label: locale.translation('back'),
            enabled: tab.get('canGoBack'),
            click: (item, focusedWindow) => {
              if (focusedWindow) {
                CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_BACK])
              }
            }
          }, {
            label: locale.translation('forward'),
            enabled: tab.get('canGoForward'),
            click: (item, focusedWindow) => {
              if (focusedWindow) {
                CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_FORWARD])
              }
            }
          }, {
            label: locale.translation('reloadPage'),
            accelerator: 'CmdOrCtrl+R',
            click: (item, focusedWindow) => {
              if (focusedWindow) {
                CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_RELOAD])
              }
            }
          },
          CommonMenu.separatorMenuItem,
          addBookmarkMenuItem('bookmarkPage', bookmarkUtil.getDetailFromFrame(frame), false))

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
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_SHOW_FINDBAR])
          }
        })

        if (!isAboutPage) {
          template.push({
            label: locale.translation('print'),
            accelerator: 'CmdOrCtrl+P',
            click: function (item, focusedWindow) {
              CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_PRINT])
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
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE])
          }
        }
      })
    }
  }

  if (!isAboutPage) {
    template.push({
      label: locale.translation('inspectElement'),
      click: () => {
        appActions.inspectElement(frame.get('tabId'), nodeProps.x, nodeProps.y)
      }
    })
  }

  const extensionContextMenus = isPrivate
    ? undefined
    : extensionState.getContextMenusProperties(appStoreRenderer.state)
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
        location: nodeProps.linkURL
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
  let data = Immutable.fromJS(nodeProps)

  if (!Array.isArray(nodeProps)) {
    switch (contextMenuType) {
      case siteTags.BOOKMARK:
        data = bookmarkUtil.getKey(data)
        break

      case siteTags.BOOKMARK_FOLDER:
        data = bookmarkFoldersUtil.getKey(data)
        break

      case siteTags.HISTORY:
        data = historyUtil.getKey(data)
        break
    }
  }

  if (contextMenuType === siteTags.BOOKMARK || contextMenuType === siteTags.BOOKMARK_FOLDER) {
    const activeFrame = Immutable.fromJS({ location: '', title: '', partitionNumber: frame.get('partitionNumber') })
    onSiteDetailContextMenu(data, contextMenuType, activeFrame)
  } else if (contextMenuType === siteTags.HISTORY) {
    onSiteDetailContextMenu(data, contextMenuType)
  } else if (contextMenuType === 'synopsis') {
    onLedgerContextMenu(nodeProps.location, nodeProps.hostPattern)
  } else if (contextMenuType === 'download') {
    onDownloadsToolbarContextMenu(nodeProps.downloadId, Immutable.fromJS(nodeProps))
  } else {
    const mainMenu = Menu.buildFromTemplate(mainTemplateInit(nodeProps, frame, tab))
    mainMenu.popup(getCurrentWindow())
  }
}

function onTabContextMenu (frameProps, e) {
  e.stopPropagation()
  const template = tabTemplateInit(frameProps)
  if (template) {
    const tabMenu = Menu.buildFromTemplate(template)
    tabMenu.popup(getCurrentWindow())
  }
}

function onNewTabContextMenu (target) {
  const menuTemplate = [
    CommonMenu.newTabMenuItem(),
    CommonMenu.newPrivateTabMenuItem(),
    CommonMenu.newTorTabMenuItem(),
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

function onUrlBarContextMenu (e) {
  e.stopPropagation()
  const windowState = windowStore.getState()
  const activeFrame = frameStateUtil.getActiveFrame(windowState)
  const inputMenu = Menu.buildFromTemplate(urlBarTemplateInit(activeFrame, e))
  inputMenu.popup(getCurrentWindow())
}

function onFindBarContextMenu (e) {
  e.stopPropagation()
  const findBarMenu = Menu.buildFromTemplate(findBarTemplateInit())
  findBarMenu.popup(getCurrentWindow())
}

function onSiteDetailContextMenu (data, type, activeFrame, e) {
  if (e) {
    e.stopPropagation()
  }
  const menu = Menu.buildFromTemplate(siteDetailTemplateInit(data, type, activeFrame))
  menu.popup(getCurrentWindow())
}

function onLedgerContextMenu (location, hostPattern) {
  const template = [openInNewTabMenuItem(location),
    openInNewPrivateTabMenuItem(location),
    openInNewPrivateTabMenuItem(location, undefined, true),
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

function onShowAutofillMenu (suggestions, targetRect, frame) {
  const menuTemplate = autofillTemplateInit(suggestions, frame)
  // toolbar UI scale ratio
  const xRatio = window.innerWidth / window.outerWidth
  const yRatio = window.innerHeight / window.outerHeight
  const tabId = frame.get('tabId')
  windowActions.setContextMenuDetail(Immutable.fromJS({
    type: 'autofill',
    tabId,
    left: targetRect.x * xRatio,
    top: (targetRect.y + targetRect.height) * yRatio,
    template: menuTemplate
  }))
}

function onReloadContextMenu () {
  const menuTemplate = [
    CommonMenu.reloadPageMenuItem(),
    CommonMenu.cleanReloadMenuItem()
  ]
  const menu = Menu.buildFromTemplate(menuTemplate)
  menu.popup(getCurrentWindow())
}

module.exports = {
  onHamburgerMenu,
  onMainContextMenu,
  onTabContextMenu,
  onNewTabContextMenu,
  onTabsToolbarContextMenu,
  onDownloadsToolbarContextMenu,
  onUrlBarContextMenu,
  onFindBarContextMenu,
  onSiteDetailContextMenu,
  onShowAutofillMenu,
  onReloadContextMenu
}
