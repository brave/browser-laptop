/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = global.require('electron')
const remote = electron.remote
const Menu = remote.require('menu')
const clipboard = electron.clipboard
const messages = require('./constants/messages')
const WindowActions = require('./actions/windowActions')
const AppActions = require('./actions/appActions')
const SiteTags = require('./constants/siteTags')
const settings = require('./constants/settings')
const CommonMenu = require('./commonMenu')
const ipc = global.require('electron').ipcRenderer
const getSetting = require('./settings').getSetting

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

function tabsToolbarTemplateInit (settingsState) {
  const showBookmarksToolbar = getSetting(settingsState, settings.SHOW_BOOKMARKS_TOOLBAR)
  return [{
    label: 'Bookmarks Toolbar',
    type: 'checkbox',
    checked: showBookmarksToolbar,
    click: (item, focusedWindow) => {
      AppActions.changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, !showBookmarksToolbar)
    }
  }]
}

function bookmarkTemplateInit (location) {
  return [openInNewTabMenuItem(location),
    openInNewPrivateTabMenuItem(location),
    openInNewSessionTabMenuItem(location),
    copyLinkLocationMenuItem(location)]
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
    if (frameProps.get('isPinned')) {
      items.push({
        label: 'Unpin tab',
        click: (item) => {
          // Handle converting the current tab window into a pinned site
          WindowActions.setPinned(frameProps, false)
          // Handle setting it in app storage for the other windows
          AppActions.removeSite(frameProps, SiteTags.PINNED)
        }
      })
    } else {
      items.push({
        label: 'Pin tab',
        click: (item) => {
          // Handle converting the current tab window into a pinned site
          WindowActions.setPinned(frameProps, true)
          // Handle setting it in app storage for the other windows
          AppActions.addSite(frameProps, SiteTags.PINNED)
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

  if (!frameProps.get('isPinned')) {
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

function hamburgerTemplateInit (settings) {
  const template = [
    CommonMenu.newTabMenuItem,
    CommonMenu.newPrivateTabMenuItem,
    CommonMenu.newPartitionedTabMenuItem,
    CommonMenu.newWindowMenuItem,
    CommonMenu.separatorMenuItem,
    CommonMenu.findOnPageMenuItem,
    CommonMenu.printMenuItem,
    CommonMenu.separatorMenuItem,
    CommonMenu.buildBraveryMenu(settings, function () {
      ipc.send(messages.UPDATE_APP_MENU, {bookmarked: settings.bookmarked})
    }),
    CommonMenu.separatorMenuItem,
    CommonMenu.preferencesMenuItem,
    CommonMenu.bookmarksMenuItem,
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

function mainTemplateInit (nodeProps) {
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
  }, {
    label: 'Add bookmark',
    enabled: false
  }, {
    label: 'Add to reading list',
    enabled: false
  })

  return template
}

export function onHamburgerMenu (settings) {
  const hamburgerMenu = Menu.buildFromTemplate(hamburgerTemplateInit(settings))
  hamburgerMenu.popup(remote.getCurrentWindow())
}

export function onMainContextMenu (nodeProps, contextMenuType) {
  if (contextMenuType === 'bookmark') {
    onBookmarkContextMenu(nodeProps.location, nodeProps.title)
  } else {
    const mainMenu = Menu.buildFromTemplate(mainTemplateInit(nodeProps))
    mainMenu.popup(remote.getCurrentWindow())
  }
}

export function onTabContextMenu (frameProps, e) {
  e.preventDefault()
  const tabMenu = Menu.buildFromTemplate(tabTemplateInit(frameProps))
  tabMenu.popup(remote.getCurrentWindow())
}

export function onTabsToolbarContextMenu (settings, e) {
  e.preventDefault()
  const tabsToolbarMenu = Menu.buildFromTemplate(tabsToolbarTemplateInit(settings))
  tabsToolbarMenu.popup(remote.getCurrentWindow())
}

export function onTabPageContextMenu (framePropsList, e) {
  e.preventDefault()
  const tabPageMenu = Menu.buildFromTemplate(tabPageTemplateInit(framePropsList))
  tabPageMenu.popup(remote.getCurrentWindow())
}

export function onUrlBarContextMenu (e) {
  e.preventDefault()
  const inputMenu = Menu.buildFromTemplate(inputTemplateInit(e))
  inputMenu.popup(remote.getCurrentWindow())
}

export function onBookmarkContextMenu (location, title, e) {
  if (e) {
    e.preventDefault()
    e.stopPropagation()
  }
  const menu = Menu.buildFromTemplate(bookmarkTemplateInit(location, title))
  menu.popup(remote.getCurrentWindow())
}
