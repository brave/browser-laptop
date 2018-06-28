/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const Immutable = require('immutable')
const electron = require('electron')
const remote = electron.remote
const Menu = remote.Menu

// Constants
const config = require('../../../js/constants/config')
const windowConstants = require('../../../js/constants/windowConstants')
const settings = require('../../../js/constants/settings')
const dragTypes = require('../../../js/constants/dragTypes')
const siteTags = require('../../../js/constants/siteTags')

// Store
const appStoreRenderer = require('../../../js/stores/appStoreRenderer')

// State
const contextMenuState = require('../../common/state/contextMenuState')
const bookmarksState = require('../../common/state/bookmarksState')

// Actions
const appActions = require('../../../js/actions/appActions')
const windowActions = require('../../../js/actions/windowActions')
const bookmarkActions = require('../../../js/actions/bookmarkActions')

// Utils
const eventUtil = require('../../../js/lib/eventUtil')
const CommonMenu = require('../../common/commonMenu')
const locale = require('../../../js/l10n')
const bookmarkUtil = require('../../common/lib/bookmarkUtil')
const dnd = require('../../../js/dnd')
const menuUtil = require('../../common/lib/menuUtil')
const urlUtil = require('../../../js/lib/urlutil')
const frameStateUtil = require('../../../js/state/frameStateUtil')
const dndData = require('../../../js/dndData')
const bookmarkFoldersUtil = require('../../common/lib/bookmarkFoldersUtil')
const historyState = require('../../common/state/historyState')
const {makeImmutable, isMap} = require('../../common/state/immutableUtil')
const {getCurrentWindow, getCurrentWindowId} = require('../../renderer/currentWindow')
const {getSetting} = require('../../../js/settings')

const validateAction = function (action) {
  action = makeImmutable(action)
  assert.ok(isMap(action), 'action must be an Immutable.Map')
  return action
}

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  return state
}

function generateMuteFrameActions (framePropsList, mute) {
  return framePropsList.filter(frame => {
    if (mute) {
      // only frames which are playing audio and haven't been asked to be muted
      return frame.get('audioPlaybackActive') && !frame.get('audioMuted')
    }
    // only frames which are not playing audio or have been asked to be muted
    return frame.get('audioMuted')
  })
  .map(frame => ({
    tabId: frame.get('tabId'),
    frameKey: frame.get('key'),
    muted: mute
  }))
}

const onTabPageMenu = function (state, action) {
  action = validateAction(action)
  state = validateState(state)

  const index = action.get('index')
  if (index == null || index < 0) {
    return
  }

  const frames = frameStateUtil.getNonPinnedFrames(state) || Immutable.List()
  const tabsPerPage = Number(getSetting(settings.TABS_PER_PAGE))
  const tabPageFrames = frames.slice(index * tabsPerPage, (index * tabsPerPage) + tabsPerPage)

  if (tabPageFrames.isEmpty()) {
    return
  }

  const template = [{
    label: locale.translation('unmuteTabs'),
    click: () => {
      windowActions.muteAllAudio(generateMuteFrameActions(tabPageFrames, false))
    }
  }, {
    label: locale.translation('muteTabs'),
    click: () => {
      windowActions.muteAllAudio(generateMuteFrameActions(tabPageFrames, true))
    }
  }, {
    label: locale.translation('closeTabPage'),
    click: () => {
      appActions.tabPageCloseMenuItemClicked(getCurrentWindowId(), index)
    }
  }]

  const tabPageMenu = Menu.buildFromTemplate(template)
  tabPageMenu.popup(getCurrentWindow())
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

const openInNewSessionTabMenuItem = (url, openerTabId) => {
  const active = getSetting(settings.SWITCH_TO_NEW_TABS) === true
  if (Array.isArray(url)) {
    return {
      label: locale.translation('openInNewSessionTabs'),
      click: () => {
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
      click: () => {
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

const openInNewWindowMenuItem = (location, partitionNumber) => {
  return {
    label: locale.translation('openInNewWindow'),
    click: () => {
      appActions.newWindow({ location, partitionNumber })
    }
  }
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

const copyAddressMenuItem = (label, location) => {
  return {
    label: locale.translation(label),
    click: () => {
      if (location) {
        appActions.clipboardTextCopied(location)
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

const getLabel = (siteDetail, activeFrame, type) => {
  let label = ''

  if (type === siteTags.BOOKMARK && activeFrame) {
    label = 'deleteBookmark'
  } else if (type === siteTags.BOOKMARK_FOLDER) {
    label = 'deleteFolder'
  } else if (type === siteTags.HISTORY) {
    label = 'deleteHistoryEntry'
  }

  return label
}

const siteDetailTemplateInit = (state, siteKey, type) => {
  const template = []
  let isFolder = type === siteTags.BOOKMARK_FOLDER
  let siteDetail = bookmarksState.findBookmark(appStoreRenderer.state, siteKey)
  if (siteDetail.isEmpty()) {
    siteDetail = historyState.getSite(state, siteKey)
  }

  if (siteDetail.isEmpty()) {
    return []
  }

  const activeFrame = frameStateUtil.getActiveFrame(state) || Immutable.Map()
  const label = getLabel(siteDetail, activeFrame, type)

  if (type !== siteTags.BOOKMARK_FOLDER) {
    const location = siteDetail.get('location')

    template.push(
      openInNewTabMenuItem(location, siteDetail.get('partitionNumber')),
      openInNewPrivateTabMenuItem(location),
      openInNewPrivateTabMenuItem(location, undefined, true),
      openInNewWindowMenuItem(location, siteDetail.get('partitionNumber')),
      openInNewSessionTabMenuItem(location),
      copyAddressMenuItem('copyLinkAddress', location),
      CommonMenu.separatorMenuItem
    )
  } else {
    template.push(openAllInNewTabsMenuItem(siteDetail), CommonMenu.separatorMenuItem)
  }

  if (siteDetail.get('folderId') !== 0 && siteDetail.get('folderId') !== -1) {
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

    template.push(
      {
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

  return menuUtil.sanitizeTemplateItems(template)
}

const onSiteDetailMenu = (state, siteKey, type) => {
  state = validateState(state)

  const template = siteDetailTemplateInit(state, siteKey, type)
  const menu = Menu.buildFromTemplate(template)
  menu.popup(getCurrentWindow())

  return state
}

const showBookmarkFolderInit = (state, parentBookmarkFolderKey) => {
  const appState = appStoreRenderer.state
  const items = bookmarksState.getBookmarksWithFolders(appState, parentBookmarkFolderKey)
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
          if (bookmark.get('type') === siteTags.BOOKMARK_FOLDER) {
            appActions.moveBookmarkFolder(bookmark.get('key'), parentBookmarkFolderKey, false, true)
          } else {
            appActions.moveBookmark(bookmark.get('key'), parentBookmarkFolderKey, false, true)
          }
        }
      }
    }]
  }
  return bookmarkItemsInit(appState, state, items)
}

const bookmarkItemsInit = (appState, state, items) => {
  const activeFrame = frameStateUtil.getActiveFrame(state) || Immutable.Map()
  const showFavicon = bookmarkUtil.showFavicon(appState)
  const template = []
  for (let site of items) {
    const siteKey = site.get('key')
    const isFolder = bookmarkFoldersUtil.isFolder(site)
    let faIcon
    if (showFavicon && !site.get('favicon')) {
      faIcon = isFolder ? 'fa-folder-o' : 'fa-file-o'
    }
    const templateItem = {
      bookmark: site,
      draggable: true,
      label: site.get('title') || site.get('location'),
      icon: showFavicon ? site.get('favicon') : undefined,
      faIcon,
      contextMenu: function () {
        windowActions.onSiteDetailMenu(siteKey, isFolder ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK)
      },
      dragEnd: function () {
        dnd.onDragEnd()
      },
      dragStart: function (e) {
        dnd.onDragStart(dragTypes.BOOKMARK, Immutable.fromJS({
          location: site.get('location'),
          title: site.get('title'),
          key: siteKey,
          type: isFolder ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK
        }), e)
      },
      dragOver: function (e) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      },
      drop: function (e) {
        e.preventDefault()
        const bookmarkItem = dnd.prepareBookmarkDataFromCompatible(e.dataTransfer)
        if (bookmarkItem) {
          if (bookmarkItem.get('type') === siteTags.BOOKMARK_FOLDER) {
            appActions.moveBookmarkFolder(
              bookmarkItem.get('key'),
              siteKey,
              dndData.shouldPrependVerticalItem(e.target, e.clientY)
            )
          } else {
            appActions.moveBookmark(
              bookmarkItem.get('key'),
              siteKey,
              dndData.shouldPrependVerticalItem(e.target, e.clientY)
            )
          }
        }
      },
      click: function (e) {
        bookmarkActions.clickBookmarkItem(siteKey, activeFrame.get('tabId'), isFolder, e)
      }
    }
    if (isFolder) {
      templateItem.folderKey = siteKey
    }
    template.push(templateItem)
  }

  return menuUtil.sanitizeTemplateItems(template)
}

const onMoreBookmarksMenu = (state, action) => {
  action = validateAction(action)
  state = validateState(state)

  const appState = appStoreRenderer.state
  let newSites = Immutable.List()

  for (let key of action.get('bookmarks')) {
    newSites = newSites.push(bookmarksState.findBookmark(appState, key))
  }

  const menuTemplate = bookmarkItemsInit(appState, state, newSites)

  menuTemplate.push({
    l10nLabelId: 'moreBookmarks',
    click: function () {
      appActions.createTabRequested({
        url: 'about:bookmarks'
      })
      windowActions.setContextMenuDetail()
    }
  })

  state = contextMenuState.setContextMenu(state, makeImmutable({
    right: 0,
    top: action.get('top'),
    template: menuTemplate
  }))

  return state
}

const onShowBookmarkFolderMenu = (state, action) => {
  action = validateAction(action)
  state = validateState(state)

  const menuTemplate = showBookmarkFolderInit(state, action.get('bookmarkKey'))
  if (action.get('submenuIndex') != null) {
    let contextMenu = contextMenuState.getContextMenu(state)
    let openedSubmenuDetails = contextMenu.get('openedSubmenuDetails', Immutable.List())

    openedSubmenuDetails = openedSubmenuDetails
      .splice(action.get('submenuIndex'), openedSubmenuDetails.size)
      .push(makeImmutable({
        y: action.get('left'),
        template: menuTemplate
      }))
    state = contextMenuState.setContextMenu(state, contextMenu.set('openedSubmenuDetails', openedSubmenuDetails))
  } else {
    state = contextMenuState.setContextMenu(state, makeImmutable({
      left: action.get('left'),
      top: action.get('top'),
      template: menuTemplate
    }))
  }

  return state
}

const onLongBackHistory = (state, action) => {
  action = validateAction(action)
  state = validateState(state)
  const history = action.get('history')

  const menuTemplate = []

  if (action.get('tabId') > -1 && history && history.get('entries').size > 0) {
    const stopIndex = Math.max(((history.get('currentIndex') - config.navigationBar.maxHistorySites) - 1), -1)
    for (let index = (history.get('currentIndex') - 1); index > stopIndex; index--) {
      const entry = history.getIn(['entries', index])
      const url = entry.get('url')

      menuTemplate.push({
        label: entry.get('display'),
        icon: entry.get('icon'),
        click: function (e) {
          if (eventUtil.isForSecondaryAction(e)) {
            appActions.createTabRequested({
              url,
              partitionNumber: action.get('partitionNumber'),
              active: !!e.shiftKey
            })
          } else {
            appActions.onGoToIndex(action.get('tabId'), index)
          }
        }
      })
    }

    // Always display "Show History" link
    menuTemplate.push(
      CommonMenu.separatorMenuItem,
      {
        label: locale.translation('showAllHistory'),
        click: function () {
          appActions.createTabRequested({
            url: 'about:history'
          })
          windowActions.setContextMenuDetail()
        }
      })

    state = contextMenuState.setContextMenu(state, makeImmutable({
      left: action.get('left'),
      top: action.get('top'),
      template: menuTemplate
    }))
  }

  return state
}

const onLongForwardHistory = (state, action) => {
  action = validateAction(action)
  state = validateState(state)
  const history = action.get('history')

  const menuTemplate = []

  if (action.get('tabId') > -1 && history && history.get('entries').size > 0) {
    const stopIndex = Math.min(((history.get('currentIndex') + config.navigationBar.maxHistorySites) + 1), history.get('entries').size)
    for (let index = (history.get('currentIndex') + 1); index < stopIndex; index++) {
      const entry = history.getIn(['entries', index])
      const url = entry.get('url')

      menuTemplate.push({
        label: entry.get('display'),
        icon: entry.get('icon'),
        click: function (e) {
          if (eventUtil.isForSecondaryAction(e)) {
            appActions.createTabRequested({
              url,
              partitionNumber: action.get('partitionNumber'),
              active: !!e.shiftKey
            })
          } else {
            appActions.onGoToIndex(action.get('tabId'), index)
          }
        }
      })
    }

    // Always display "Show History" link
    menuTemplate.push(
      CommonMenu.separatorMenuItem,
      {
        label: locale.translation('showAllHistory'),
        click: function () {
          appActions.createTabRequested({
            url: 'about:history'
          })
          windowActions.setContextMenuDetail()
        }
      })

    state = contextMenuState.setContextMenu(state, makeImmutable({
      left: action.get('left'),
      top: action.get('top'),
      template: menuTemplate
    }))
  }

  return state
}

const contextMenuReducer = (windowState, action) => {
  switch (action.actionType) {
    case windowConstants.WINDOW_ON_GO_BACK_LONG:
      windowState = onLongBackHistory(windowState, action)
      break
    case windowConstants.WINDOW_ON_GO_FORWARD_LONG:
      windowState = onLongForwardHistory(windowState, action)
      break
    case windowConstants.WINDOW_ON_TAB_PAGE_CONTEXT_MENU:
      onTabPageMenu(windowState, action)
      break
    case windowConstants.WINDOW_ON_MORE_BOOKMARKS_MENU:
      windowState = onMoreBookmarksMenu(windowState, action)
      break
    case windowConstants.WINDOW_ON_SHOW_BOOKMARK_FOLDER_MENU:
      windowState = onShowBookmarkFolderMenu(windowState, action)
      break
    case windowConstants.WINDOW_ON_SITE_DETAIL_MENU:
      windowState = onSiteDetailMenu(windowState, action.bookmarkKey, action.type)
      break
  }
  return windowState
}

module.exports = contextMenuReducer
