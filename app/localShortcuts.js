/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const electronLocalshortcut = require('electron-localshortcut')
const messages = require('../js/constants/messages')
const appActions = require('../js/actions/appActions')
const isDarwin = process.platform === 'darwin'

module.exports.register = (win) => {
  // Most of these events will simply be listened to by the app store and acted
  // upon.  However sometimes there are no state changes, for example with focusing
  // the URL bar.  In those cases it's acceptable for the individual components to
  // listen to the events.
  const simpleWebContentEvents = [
    ['F6', messages.SHORTCUT_FOCUS_URL],
    ['CmdOrCtrl+Shift+]', messages.SHORTCUT_NEXT_TAB],
    ['CmdOrCtrl+Shift+[', messages.SHORTCUT_PREV_TAB],
    ['CmdOrCtrl+Alt+Right', messages.SHORTCUT_NEXT_TAB],
    ['CmdOrCtrl+Alt+Left', messages.SHORTCUT_PREV_TAB],
    ['Ctrl+PageDown', messages.SHORTCUT_NEXT_TAB],
    ['Ctrl+PageUp', messages.SHORTCUT_PREV_TAB],
    ['CmdOrCtrl+9', messages.SHORTCUT_SET_ACTIVE_FRAME_TO_LAST],
    ['CmdOrCtrl+G', messages.SHORTCUT_ACTIVE_FRAME_FIND_NEXT],
    ['CmdOrCtrl+Shift+G', messages.SHORTCUT_ACTIVE_FRAME_FIND_PREV],
    ['CmdOrCtrl+Alt+J', messages.SHORTCUT_ACTIVE_FRAME_TOGGLE_DEV_TOOLS],
    ['CmdOrCtrl+Shift+=', messages.SHORTCUT_ACTIVE_FRAME_ZOOM_IN],
    ['CmdOrCtrl+Shift+-', messages.SHORTCUT_ACTIVE_FRAME_ZOOM_OUT]
  ]

  if (!isDarwin) {
    simpleWebContentEvents.push(
      ['F5', messages.SHORTCUT_ACTIVE_FRAME_RELOAD],
      ['Ctrl+F5', messages.SHORTCUT_ACTIVE_FRAME_CLEAN_RELOAD],
      ['Ctrl+F4', messages.SHORTCUT_CLOSE_FRAME],
      ['Ctrl+U', messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE],
      ['Alt+D', messages.SHORTCUT_FOCUS_URL],
      ['Alt+Left', messages.SHORTCUT_ACTIVE_FRAME_BACK],
      ['Alt+Right', messages.SHORTCUT_ACTIVE_FRAME_FORWARD])
  } else {
    // Different shorcut for View Source as is common for Chrome/Safari on macOS
    // See #7702
    simpleWebContentEvents.push(
      ['Cmd+Alt+U', messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE]
    )

    if (process.env.NODE_ENV !== 'development') {
      // We're in Darwin and release or test mode...
      // We disable for development mode because Browser level dev tools copy doesn't work.
      // Workaround for #1060
      simpleWebContentEvents.push(
        ['Cmd+C', messages.SHORTCUT_ACTIVE_FRAME_COPY]
      )
    }
  }

  // Tab ordering shortcuts
  Array.from(new Array(8), (x, i) => i).reduce((list, i) => {
    list.push([`CmdOrCtrl+${String(i + 1)}`, messages.SHORTCUT_SET_ACTIVE_FRAME_BY_INDEX, i])
    return list
  }, simpleWebContentEvents)

  simpleWebContentEvents.forEach((shortcutEventName) =>
    electronLocalshortcut.register(win, shortcutEventName[0], () => {
      let win = BrowserWindow.getFocusedWindow()
      if (win) {
        win.webContents.send(shortcutEventName[1], shortcutEventName[2], shortcutEventName[3])
      }
    }))

  electronLocalshortcut.register(win, 'Shift+F8', () => {
    let win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.toggleDevTools()
    }
  })

  electronLocalshortcut.register(win, 'CmdOrCtrl+Shift+S', () => {
    appActions.createTabRequested({
      isPartitioned: true
    })
  })
}

module.exports.unregister = (win) => {
  electronLocalshortcut.unregisterAll(win)
}
