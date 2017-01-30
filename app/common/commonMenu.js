/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appActions = require('../../js/actions/appActions')
const messages = require('../../js/constants/messages')
const Immutable = require('immutable')
const locale = require('../../js/l10n')
const settings = require('../../js/constants/settings')
const {tabs} = require('../../js/constants/config')
const getSetting = require('../../js/settings').getSetting
const communityURL = 'https://community.brave.com/'
const isDarwin = process.platform === 'darwin'
const electron = require('electron')

let BrowserWindow
if (process.type === 'browser') {
  BrowserWindow = electron.BrowserWindow
} else {
  BrowserWindow = electron.remote.BrowserWindow
}

const ensureAtLeastOneWindow = (frameOpts) => {
  if (BrowserWindow.getAllWindows().length === 0) {
    appActions.newWindow(frameOpts)
  }
}

const getCurrentWindowId = () => {
  if (process.type === 'browser') {
    return BrowserWindow.getActiveWindow().id
  } else {
    const {currentWindowId} = require('../renderer/currentWindow')
    return currentWindowId
  }
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
      ensureAtLeastOneWindow(Immutable.fromJS({}))
      appActions.createTabRequested({
        url: 'about:newtab',
        windowId: getCurrentWindowId(),
        openerTabId
      })
    }
  }
}

module.exports.newPrivateTabMenuItem = () => {
  return {
    label: locale.translation('newPrivateTab'),
    accelerator: 'Shift+CmdOrCtrl+P',
    click: function (item, focusedWindow) {
      ensureAtLeastOneWindow(Immutable.fromJS({ isPrivate: true }))
      appActions.createTabRequested({
        url: 'about:newtab',
        windowId: getCurrentWindowId(),
        isPrivate: true
      })
    }
  }
}

module.exports.newPartitionedTabMenuItem = () => {
  const newPartitionedMenuItem = (partitionNumber) => ({
    label: `${locale.translation('newSessionTab')} ${partitionNumber}`,
    click: (item, focusedWindow) => {
      module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, undefined, {
        isPartitioned: true,
        partitionNumber: partitionNumber
      }])
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
      if (BrowserWindow.getAllWindows().length === 0) {
        appActions.newWindow(Immutable.fromJS({
          location: 'about:preferences'
        }))
      } else {
        appActions.maybeCreateTabRequested({
          url: 'about:preferences',
          windowId: getCurrentWindowId()
        })
      }
    }
  }
}

module.exports.bookmarksManagerMenuItem = () => {
  return {
    label: locale.translation('bookmarksManager'),
    accelerator: isDarwin ? 'CmdOrCtrl+Alt+B' : 'Ctrl+Shift+O',
    click: (item, focusedWindow) => {
      if (BrowserWindow.getAllWindows().length === 0) {
        appActions.newWindow(Immutable.fromJS({
          location: 'about:bookmarks'
        }))
      } else {
        appActions.maybeCreateTabRequested({
          url: 'about:bookmarks',
          windowId: getCurrentWindowId()
        })
      }
    }
  }
}

module.exports.historyMenuItem = () => {
  return {
    label: locale.translation('showAllHistory'),
    accelerator: 'CmdOrCtrl+Y',
    click: function (item, focusedWindow) {
      if (BrowserWindow.getAllWindows().length === 0) {
        appActions.newWindow(Immutable.fromJS({
          location: 'about:history'
        }))
      } else {
        appActions.maybeCreateTabRequested({
          url: 'about:history',
          windowId: getCurrentWindowId()
        })
      }
    }
  }
}

module.exports.downloadsMenuItem = () => {
  return {
    label: locale.translation('downloadsManager'),
    accelerator: isDarwin ? 'CmdOrCtrl+Shift+J' : 'Ctrl+J',
    click: (item, focusedWindow) => {
      if (BrowserWindow.getAllWindows().length === 0) {
        appActions.newWindow(Immutable.fromJS({
          location: 'about:downloads'
        }))
      } else {
        module.exports.sendToFocusedWindow(focusedWindow, [messages.HIDE_DOWNLOADS_TOOLBAR])
        appActions.maybeCreateTabRequested({
          url: 'about:downloads',
          windowId: getCurrentWindowId()
        })
      }
    }
  }
}

module.exports.passwordsMenuItem = () => {
  return {
    label: locale.translation('passwordsManager'),
    click: (item, focusedWindow) => {
      if (BrowserWindow.getAllWindows().length === 0) {
        appActions.newWindow(Immutable.fromJS({
          location: 'about:passwords'
        }))
      } else {
        appActions.maybeCreateTabRequested({
          url: 'about:passwords',
          windowId: getCurrentWindowId()
        })
      }
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
      appActions.maybeCreateTabRequested({
        url: communityURL,
        windowId: getCurrentWindowId()
      })
    }
  }
}

module.exports.bookmarksToolbarMenuItem = () => {
  return {
    label: locale.translation('bookmarksToolbar'),
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
      appActions.maybeCreateTabRequested({
        url: 'about:brave',
        windowId: getCurrentWindowId()
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
      if (BrowserWindow.getAllWindows().length === 0) {
        appActions.newWindow(Immutable.fromJS({
          location: 'about:preferences#shields'
        }))
      } else {
        appActions.maybeCreateTabRequested({
          url: 'about:preferences#shields',
          windowId: getCurrentWindowId()
        })
      }
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
      if (BrowserWindow.getAllWindows().length === 0) {
        appActions.newWindow(Immutable.fromJS({
          location: 'about:preferences#payments'
        }))
      } else {
        appActions.maybeCreateTabRequested({
          url: 'about:preferences#payments',
          windowId: getCurrentWindowId()
        })
      }
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
