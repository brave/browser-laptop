/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const AppConfig = require('./constants/appConfig')
const AppActions = require('../js/actions/appActions')
const messages = require('../js/constants/messages')
const electron = require('electron')
let app
if (process.type === 'browser') {
  app = electron.app
} else {
  app = electron.remote.app
}

/**
 * Sends a message to the web contents of the focused window.
 * @param {Object} focusedWindow the focusedWindow if any
 * @param {Array} message message and arguments to send
 * @return {boolean} whether the message was sent
 */
module.exports.sendToFocusedWindow = (focusedWindow, message) => {
  if (focusedWindow) {
    focusedWindow.webContents.send.apply(focusedWindow.webContents, message)
    return true
  } else {
    return false
  }
}

module.exports.quitMenuItem = {
  label: 'Quit ' + AppConfig.name,
  accelerator: 'Command+Q',
  click: app.quit
}

module.exports.newTabMenuItem = {
  label: 'New Tab',
  accelerator: 'CmdOrCtrl+T',
  click: function (item, focusedWindow) {
    if (!module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME])) {
      // no active windows
      AppActions.newWindow()
    }
  }
}

module.exports.newPrivateTabMenuItem = {
  label: 'New Private Tab',
  accelerator: 'CmdOrCtrl+Alt+T',
  click: function (item, focusedWindow) {
    module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, undefined, { isPrivate: true }])
  }
}

module.exports.newPartitionedTabMenuItem = {
  label: 'New Partitioned Session',
  accelerator: 'CmdOrCtrl+Alt+S',
  click: function (item, focusedWindow) {
    module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, undefined, { isPartitioned: true }])
  }
}

module.exports.newWindowMenuItem = {
  label: 'New Window',
  accelerator: 'CmdOrCtrl+N',
  click: () => AppActions.newWindow()
}

module.exports.separatorMenuItem = {
  type: 'separator'
}

module.exports.printMenuItem = {
  label: 'Print...',
  accelerator: 'CmdOrCtrl+P',
  click: function (item, focusedWindow) {
    module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_PRINT])
  }
}

module.exports.findOnPageMenuItem = {
  label: 'Find on page...',
  accelerator: 'CmdOrCtrl+F',
  click: function (item, focusedWindow) {
    module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_SHOW_FINDBAR])
  }
}
