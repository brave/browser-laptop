/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const electronLocalshortcut = require('electron-localshortcut')
const messages = require('../js/constants/messages')
const isDarwin = process.platform === 'darwin'

module.exports.register = (win) => {
  // Most of these events will simply be listened to by the app store and acted
  // upon.  However sometimes there are no state changes, for example with focusing
  // the URL bar.  In those cases it's acceptable for the individual components to
  // listen to the events.
  const simpleWebContentEvents = [
    ['CmdOrCtrl+Shift+]', messages.SHORTCUT_NEXT_TAB],
    ['CmdOrCtrl+Shift+[', messages.SHORTCUT_PREV_TAB],
    ['CmdOrCtrl+Alt+Right', messages.SHORTCUT_NEXT_TAB],
    ['CmdOrCtrl+Alt+Left', messages.SHORTCUT_PREV_TAB],
    ['Ctrl+PageDown', messages.SHORTCUT_NEXT_TAB],
    ['Ctrl+PageUp', messages.SHORTCUT_PREV_TAB],
    ['CmdOrCtrl+9', messages.SHORTCUT_SET_ACTIVE_FRAME_TO_LAST]
  ]

  if (!isDarwin) {
    simpleWebContentEvents.push(
      ['F5', messages.SHORTCUT_ACTIVE_FRAME_RELOAD],
      ['Ctrl+F5', messages.SHORTCUT_ACTIVE_FRAME_CLEAN_RELOAD],
      ['F12', messages.SHORTCUT_ACTIVE_FRAME_TOGGLE_DEV_TOOLS],
      ['Alt+D', messages.SHORTCUT_FOCUS_URL, false],
      ['Alt+Left', messages.SHORTCUT_ACTIVE_FRAME_BACK],
      ['Alt+Right', messages.SHORTCUT_ACTIVE_FRAME_FORWARD])
  }

  // Tab ordering shortcuts
  Array.from(new Array(8), (x, i) => i).reduce((list, i) => {
    list.push([`CmdOrCtrl+${String(i + 1)}`, messages.SHORTCUT_SET_ACTIVE_FRAME_BY_INDEX, i])
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
