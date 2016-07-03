/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConfig = require('./constants/appConfig')
const appActions = require('../js/actions/appActions')
const messages = require('../js/constants/messages')
const Immutable = require('immutable')
const locale = require('../js/l10n')
const settings = require('./constants/settings')
const getSetting = require('./settings').getSetting
const issuesUrl = 'https://github.com/brave/browser-laptop/issues'
const isDarwin = process.platform === 'darwin'

let electron
try {
  electron = require('electron')
} catch (e) {
  electron = global.require('electron')
}

let app
let BrowserWindow
if (process.type === 'browser') {
  app = electron.app
  BrowserWindow = electron.BrowserWindow
} else {
  app = electron.remote.app
  BrowserWindow = electron.remote.BrowserWindow
}

const ensureAtLeastOneWindow = (frameOpts) => {
  if (BrowserWindow.getAllWindows().length === 0) {
    appActions.newWindow(frameOpts)
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

module.exports.quitMenuItem = () => {
  return {
    label: locale.translation('quitApp'),
    accelerator: 'CmdOrCtrl+Q',
    click: app.quit
  }
}

module.exports.newTabMenuItem = () => {
  return {
    label: locale.translation('newTab'),
    accelerator: 'CmdOrCtrl+T',
    click: function (item, focusedWindow) {
      if (!module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME])) {
        // no active windows
        appActions.newWindow()
      }
    }
  }
}

module.exports.newPrivateTabMenuItem = () => {
  return {
    label: locale.translation('newPrivateTab'),
    accelerator: 'Shift+CmdOrCtrl+P',
    click: function (item, focusedWindow) {
      ensureAtLeastOneWindow(Immutable.fromJS({ isPrivate: true }))
      module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, undefined, { isPrivate: true }])
    }
  }
}

module.exports.newPartitionedTabMenuItem = () => {
  return {
    label: locale.translation('newSessionTab'),
    accelerator: 'Shift+CmdOrCtrl+S',
    click: function (item, focusedWindow) {
      ensureAtLeastOneWindow(Immutable.fromJS({ isPartitioned: true }))
      module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, undefined, { isPartitioned: true }])
    }
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
        module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, 'about:preferences', { singleFrame: true }])
      }
    }
  }
}

module.exports.bookmarksMenuItem = () => {
  return {
    label: locale.translation('bookmarksManager'),
    accelerator: isDarwin ? 'CmdOrCtrl+Alt+B' : 'Ctrl+Shift+O',
    click: (item, focusedWindow) => {
      if (BrowserWindow.getAllWindows().length === 0) {
        appActions.newWindow(Immutable.fromJS({
          location: 'about:bookmarks'
        }))
      } else {
        module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, 'about:bookmarks', { singleFrame: true }])
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
        module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, 'about:downloads', { singleFrame: true }])
      }
    }
  }
}

module.exports.passwordsMenuItem = () => {
  return {
    label: 'Passwords manager...',
    click: (item, focusedWindow) => {
      if (BrowserWindow.getAllWindows().length === 0) {
        appActions.newWindow(Immutable.fromJS({
          location: 'about:passwords'
        }))
      } else {
        module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, 'about:passwords', { singleFrame: true }])
      }
    }
  }
}

module.exports.importBookmarksMenuItem = () => {
  return {
    label: locale.translation('importBookmarks'),
    click: function (item, focusedWindow) {
      if (BrowserWindow.getAllWindows().length === 0) {
        appActions.newWindow(undefined, undefined, undefined, function () {
          // The timeout here isn't necessary but giving the window a bit of time to popup
          // before the modal file picker pops up seems to work nicer.
          setTimeout(() =>
            module.exports.sendToFocusedWindow(BrowserWindow.getAllWindows()[0], [messages.IMPORT_BOOKMARKS]), 100)
        })
        return
      } else {
        setTimeout(() =>
          module.exports.sendToFocusedWindow(BrowserWindow.getAllWindows()[0], [messages.IMPORT_BOOKMARKS]), 100)
      }
    }
  }
  /*
  submenu: [
    {label: 'Google Chrome...'},
    {label: 'Firefox...'},
    {label: 'Safari...'}
  ]
  */
}

module.exports.reportAnIssueMenuItem = () => {
  return {
    label: locale.translation('reportAnIssue'),
    click: function (item, focusedWindow) {
      module.exports.sendToFocusedWindow(focusedWindow,
                                         [messages.SHORTCUT_NEW_FRAME, issuesUrl])
    }
  }
}

module.exports.submitFeedbackMenuItem = () => {
  return {
    label: locale.translation('submitFeedback'),
    click: function () {
      electron.shell.openExternal(appConfig.contactUrl)
    }
  }
}

module.exports.bookmarksToolbarMenuItem = () => {
  const showBookmarksToolbar = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)
  return {
    label: locale.translation('bookmarksToolbar'),
    type: 'checkbox',
    checked: showBookmarksToolbar,
    click: (item, focusedWindow) => {
      appActions.changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, !showBookmarksToolbar)
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
    label: locale.translation('about') + ' ' + appConfig.name,
    click: (item, focusedWindow) => {
      if (process.type === 'browser') {
        process.emit(messages.SHOW_ABOUT)
      } else {
        electron.ipcRenderer.send(messages.SHOW_ABOUT)
      }
    }
  }
}
