/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appActions = require('../../js/actions/appActions')
const messages = require('../../js/constants/messages')
const locale = require('../../js/l10n')
const settings = require('../../js/constants/settings')
const {tabs} = require('../../js/constants/config')
const {getSetting} = require('../../js/settings')
const communityURL = 'https://community.brave.com/'
const isDarwin = process.platform === 'darwin'
const electron = require('electron')
const menuUtil = require('./lib/menuUtil')

const ensureAtLeastOneWindow = (frameOpts) => {
  // Handle no new tab requested, but need a window
  // and possibly there is no window.
  if (!frameOpts && process.type === 'browser') {
    // focus active window, or create a new one if there are none
    appActions.focusOrCreateWindow()
    return
  }
  // If this action is dispatched from a renderer window (Windows OS),
  // it will create the tab in the current window since the action originates from it.
  // If it was dispatched by the browser (macOS / Linux),
  // then it will create the tab in the active window
  // or a new window if there is no active window.
  appActions.createTabRequested(frameOpts, false, false, true)
}

/**
 * Sends a message to the web contents of the focused window.
 * @param {Object} focusedWindow the focusedWindow if any
 * @param {Array} message message and arguments to send
 * @return {boolean} whether the message was sent
 */
module.exports.sendToFocusedWindow = (focusedWindow, message) => {
  if (process.type === 'browser') {
    if (focusedWindow) {
      focusedWindow.webContents.send.apply(focusedWindow.webContents, message)
      return true
    } else {
      return false
    }
  } else {
    const ipcRenderer = require('electron').ipcRenderer
    // The spliced in arg is the empty event arg
    message.splice(1, 0, {})
    ipcRenderer.emit.apply(ipcRenderer, message)
    return true
  }
}

module.exports.quitMenuItem = () => ({
  label: locale.translation('quitApp'),
  accelerator: 'CmdOrCtrl+Q',
  click: function () {
    appActions.shuttingDown()
  }
})

module.exports.newTabMenuItem = (openerTabId) => {
  return {
    label: locale.translation('newTab'),
    accelerator: 'CmdOrCtrl+T',
    click: function (item, focusedWindow) {
      ensureAtLeastOneWindow({ openerTabId })
    }
  }
}

module.exports.newPrivateTabMenuItem = () => {
  return {
    label: locale.translation('newPrivateTab'),
    accelerator: 'Shift+CmdOrCtrl+P',
    click: function (item, focusedWindow) {
      ensureAtLeastOneWindow({
        url: 'about:newtab',
        isPrivate: true
      })
    }
  }
}

module.exports.newTorTabMenuItem = () => {
  return {
    label: locale.translation('newTorTab'),
    click: function (item, focusedWindow) {
      ensureAtLeastOneWindow({
        url: 'about:newtab',
        isPrivate: true,
        isTor: true
      })
    }
  }
}

module.exports.newPartitionedTabMenuItem = () => {
  const newPartitionedMenuItem = (partitionNumber) => ({
    label: `${locale.translation('newSessionTab')} ${partitionNumber}`,
    click: (item, focusedWindow) => {
      ensureAtLeastOneWindow({
        partitionNumber
      })
    }
  })

  const maxNewSessions = Array(tabs.maxAllowedNewSessions)
  const newPartitionedSubmenu = Array.from(maxNewSessions, (_, i) => newPartitionedMenuItem(i + 1))

  return {
    label: locale.translation('newSessionTab'),
    submenu: newPartitionedSubmenu
  }
}

module.exports.newWindowMenuItem = () => {
  return {
    label: locale.translation('newWindow'),
    accelerator: 'CmdOrCtrl+N',
    click: () => appActions.newWindow()
  }
}

module.exports.reopenLastClosedTabItem = () => {
  return {
    label: locale.translation('reopenLastClosedTab'),
    accelerator: 'Shift+CmdOrCtrl+T',
    click: function (item, focusedWindow) {
      module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_UNDO_CLOSED_FRAME])
    }
  }
}

module.exports.separatorMenuItem = {
  type: 'separator'
}

module.exports.printMenuItem = () => {
  return {
    label: locale.translation('print'),
    accelerator: 'CmdOrCtrl+P',
    click: function (item, focusedWindow) {
      module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_PRINT])
    }
  }
}

module.exports.simpleShareActiveTabMenuItem = (l10nId, type, accelerator) => {
  const siteName = menuUtil.extractSiteName(type)

  return {
    label: locale.translation(l10nId, {siteName: siteName}),
    accelerator,
    click: function (item, focusedWindow) {
      appActions.simpleShareActiveTabRequested(type)
    }
  }
}

module.exports.findOnPageMenuItem = () => {
  return {
    label: locale.translation('findOnPage'),
    accelerator: 'CmdOrCtrl+F',
    click: function (item, focusedWindow) {
      module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_SHOW_FINDBAR])
    }
  }
}

module.exports.checkForUpdateMenuItem = () => {
  return {
    label: locale.translation('checkForUpdates'),
    click: function (item, focusedWindow) {
      if (process.type === 'browser') {
        ensureAtLeastOneWindow()
        process.emit(messages.CHECK_FOR_UPDATE)
      } else {
        electron.ipcRenderer.send(messages.CHECK_FOR_UPDATE)
      }
    }
  }
}

module.exports.preferencesMenuItem = () => {
  return {
    label: locale.translation(isDarwin ? 'preferences' : 'settings'),
    accelerator: 'CmdOrCtrl+,',
    click: (item, focusedWindow) => {
      ensureAtLeastOneWindow({
        url: 'about:preferences'
      })
    }
  }
}

module.exports.bookmarksManagerMenuItem = () => {
  return {
    label: locale.translation('bookmarksManager'),
    accelerator: isDarwin ? 'CmdOrCtrl+Alt+B' : 'Ctrl+Shift+O',
    click: (item, focusedWindow) => {
      ensureAtLeastOneWindow({
        url: 'about:bookmarks'
      })
    }
  }
}

module.exports.historyMenuItem = () => {
  return {
    label: locale.translation('showAllHistory'),
    accelerator: 'CmdOrCtrl+Y',
    click: function (item, focusedWindow) {
      ensureAtLeastOneWindow({
        url: 'about:history'
      })
    }
  }
}

module.exports.downloadsMenuItem = () => {
  return {
    label: locale.translation('downloadsManager'),
    accelerator: isDarwin ? 'CmdOrCtrl+Shift+J' : 'Ctrl+J',
    click: (item, focusedWindow) => {
      module.exports.sendToFocusedWindow(focusedWindow, [messages.HIDE_DOWNLOADS_TOOLBAR])
      ensureAtLeastOneWindow({
        url: 'about:downloads'
      })
    }
  }
}

module.exports.extensionsMenuItem = () => {
  return {
    label: locale.translation('extensionsManager'),
    click: (item, focusedWindow) => {
      ensureAtLeastOneWindow({
        url: 'about:preferences#extensions'
      })
    }
  }
}

module.exports.passwordsMenuItem = () => {
  return {
    label: locale.translation('passwordsManager'),
    click: (item, focusedWindow) => {
      ensureAtLeastOneWindow({
        url: 'about:passwords'
      })
    }
  }
}

module.exports.importBrowserDataMenuItem = () => {
  return {
    label: locale.translation('importBrowserData'),
    click: function (item, focusedWindow) {
      if (process.type === 'browser') {
        process.emit(messages.IMPORT_BROWSER_DATA_NOW)
      } else {
        electron.ipcRenderer.send(messages.IMPORT_BROWSER_DATA_NOW)
      }
    }
  }
}

module.exports.exportBookmarksMenuItem = () => {
  return {
    label: locale.translation('exportBookmarks'),
    click: function (item, focusedWindow) {
      if (process.type === 'browser') {
        process.emit(messages.EXPORT_BOOKMARKS)
      } else {
        electron.ipcRenderer.send(messages.EXPORT_BOOKMARKS)
      }
    }
  }
}

module.exports.submitFeedbackMenuItem = () => {
  return {
    label: locale.translation('submitFeedback'),
    click: function (item, focusedWindow) {
      ensureAtLeastOneWindow({
        url: communityURL
      })
    }
  }
}

module.exports.bookmarksToolbarMenuItem = () => {
  return {
    label: locale.translation('bookmarksToolbar'),
    accelerator: 'CmdOrCtrl+Shift+B',
    type: 'checkbox',
    checked: getSetting(settings.SHOW_BOOKMARKS_TOOLBAR),
    click: (item, focusedWindow) => {
      appActions.changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, !getSetting(settings.SHOW_BOOKMARKS_TOOLBAR))
    }
  }
}

module.exports.autoHideMenuBarMenuItem = () => {
  const autoHideMenuBar = getSetting(settings.AUTO_HIDE_MENU)
  return {
    label: locale.translation('autoHideMenuBar'),
    type: 'checkbox',
    checked: !autoHideMenuBar,
    click: (item, focusedWindow) => {
      appActions.changeSetting(settings.AUTO_HIDE_MENU, !autoHideMenuBar)
    }
  }
}

module.exports.aboutBraveMenuItem = () => {
  return {
    label: locale.translation('aboutApp'),
    click: (item, focusedWindow) => {
      ensureAtLeastOneWindow({
        url: 'about:brave'
      })
    }
  }
}

module.exports.braverySiteMenuItem = () => {
  return {
    label: locale.translation('braverySite'),
    click: (item, focusedWindow) => {
      module.exports.sendToFocusedWindow(focusedWindow, [messages.OPEN_BRAVERY_PANEL])
    }
  }
}

module.exports.braveryGlobalMenuItem = () => {
  return {
    label: locale.translation('braveryGlobal'),
    click: (item, focusedWindow) => {
      ensureAtLeastOneWindow({
        url: 'about:preferences#shields'
      })
    }
  }
}

module.exports.braveryPaymentsMenuItem = () => {
  const label =
    getSetting(settings.PAYMENTS_ENABLED)
      ? locale.translation('braveryPayments')
      : locale.translation('braveryStartUsingPayments')
  return {
    label: label,
    click: (item, focusedWindow) => {
      ensureAtLeastOneWindow({
        url: 'about:preferences#payments'
      })
    }
  }
}

module.exports.reloadPageMenuItem = () => {
  return {
    label: locale.translation('reloadPage'),
    accelerator: 'CmdOrCtrl+R',
    click: function (item, focusedWindow) {
      module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_RELOAD])
    }
  }
}

module.exports.cleanReloadMenuItem = () => {
  return {
    label: locale.translation('cleanReload'),
    accelerator: 'CmdOrCtrl+Shift+R',
    click: function (item, focusedWindow) {
      module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_CLEAN_RELOAD])
    }
  }
}
