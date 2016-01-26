/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const electronLocalshortcut = require('electron-localshortcut')
const messages = require('../js/constants/messages')

module.exports.register = (win) => {
  // Most of these events will simply be listened to by the app store and acted
  // upon.  However sometimes there are no state changes, for example with focusing
  // the URL bar.  In those cases it's acceptable for the individual components to
  // listen to the events.
  const simpleWebContentEvents = [
    ['CmdOrCtrl+Shift+]', messages.SHORTCUT_NEXT_TAB],
    ['CmdOrCtrl+Shift+[', messages.SHORTCUT_PREV_TAB],
    ['CmdOrCtrl+Right', messages.SHORTCUT_ACTIVE_FRAME_FORWARD],
    ['CmdOrCtrl+Left', messages.SHORTCUT_ACTIVE_FRAME_BACK],
    ['CmdOrCtrl+9', messages.SHORTCUT_SET_ACTIVE_FRAME_TO_LAST]
  ]

  // Tab ordering shortcuts
  Array.from(new Array(8), (x, i) => i).reduce((list, i) => {
    list.push(['CmdOrCtrl+' + String(i + 1), messages.SHORTCUT_SET_ACTIVE_FRAME_BY_INDEX, i])
    return list
  }, simpleWebContentEvents)

  simpleWebContentEvents.forEach((shortcutEventName) =>
    electronLocalshortcut.register(win, shortcutEventName[0], () => {
      BrowserWindow.getFocusedWindow().webContents.send(shortcutEventName[1], shortcutEventName[2])
    }))
}

module.exports.unregister = (win) => {
  electronLocalshortcut.unregisterAll(win)
}
