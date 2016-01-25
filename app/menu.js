/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = require('menu')
const messages = require('../js/constants/messages')
const dialog = electron.dialog
const AppActions = require('../js/actions/appActions')
const HttpsEverywhere = require('./httpsEverywhere')
const AdBlock = require('./adBlock')
const AdInsertion = require('./adInsertion')
const TrackingProtection = require('./trackingProtection')
const Filtering = require('./filtering')

const name = 'Brave'
const isWindows = process.platform === 'win32'
const isDarwin = process.platform === 'darwin'

const issuesUrl = 'https://github.com/brave/browser-laptop/issues'
const contactUrl = 'mailto:support@brave.com'
const aboutUrl = 'https://brave.com/'

/**
 * Sends a message to the web contents of the focused window.
 * @param {Object} focusedWindow the focusedWindow if any
 * @param {Array} message message and arguments to send
 * @return {boolean} whether the message was sent
 */
const sendToFocusedWindow = (focusedWindow, message) => {
  if (focusedWindow) {
    focusedWindow.webContents.send.apply(focusedWindow.webContents, message)
    return true
  } else {
    return false
  }
}

/**
 * Sets up the menu.
 * @param {Object} args - Arguments to initialize the menu with if any
 * @param {boolean} state.bookmarked - Whether the current active page is
 *   bookmarked
 */
const init = (args) => {
  args = args || {}
  // Create references to menu items that need to be updated dynamically
  const bookmarkPageMenuItem = {
    label: 'Bookmark this page',
    type: 'checkbox',
    accelerator: 'CmdOrCtrl+D',
    checked: args.bookmarked || false,
    click: function (item, focusedWindow) {
      var msg = bookmarkPageMenuItem.checked
        ? messages.SHORTCUT_ACTIVE_FRAME_REMOVE_BOOKMARK
        : messages.SHORTCUT_ACTIVE_FRAME_BOOKMARK
      sendToFocusedWindow(focusedWindow, [msg])
    }
  }

  const quitMenuItem = {
    label: 'Quit ' + name,
    accelerator: 'Command+Q',
    click: app.quit
  }

  const aboutBraveMenuItem = {
    label: 'About ' + name,
    role: 'about'
  }

  const preferencesMenuItem = {
    label: 'Preferences...',
    enabled: false,
    accelerator: 'CmdOrCtrl+,'
  }

  const fileMenu = [
    {
      label: 'Check for updates ...',
      click: function (item, focusedWindow) {
        if (BrowserWindow.getAllWindows().length === 0) {
          AppActions.newWindow()
        }
        process.emit(messages.CHECK_FOR_UPDATE)
      }
    },
// Note: we are keeping this here for testing. Calling process.crash() from the inspector does not create a crash report.
//        {
//          label: 'Crash!!!!!',
//          click: function (item, focusedWindow) {
//            process.crash()
//          }
//        },
    {
      label: 'New Tab',
      accelerator: 'CmdOrCtrl+T',
      click: function (item, focusedWindow) {
        if (!sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME])) {
          // no active windows
          AppActions.newWindow()
        }
      }
    }, {
      label: 'New Private Tab',
      accelerator: 'CmdOrCtrl+Alt+T',
      click: function (item, focusedWindow) {
        sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, undefined, { isPrivate: true }])
      }
    }, {
      label: 'New Partitioned Session',
      accelerator: 'CmdOrCtrl+Alt+S',
      click: function (item, focusedWindow) {
        sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, undefined, { isPartitioned: true }])
      }
    }, {
      label: 'New Window',
      accelerator: 'CmdOrCtrl+N',
      click: () => AppActions.newWindow()
    }, {
      type: 'separator'
    }, {
      label: 'Open File...',
      accelerator: 'CmdOrCtrl+O',
      click: (item, focusedWindow) => {
        dialog.showOpenDialog(focusedWindow, {
          properties: ['openFile', 'multiSelections']
        }, function (paths) {
          if (paths) {
            paths.forEach((path) => {
              sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, path])
            })
          }
        })
      }
    }, {
      label: 'Open Location...',
      accelerator: 'CmdOrCtrl+L',
      click: function (item, focusedWindow) {
        sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_FOCUS_URL, false])
      }
    }, {
      label: 'Open Search...',
      accelerator: 'CmdOrCtrl+K',
      click: function (item, focusedWindow) {
        sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_FOCUS_URL, true])
      }
    }, {
      type: 'separator'
    }, {
      label: 'Import from...',
      enabled: false
      /*
      submenu: [
        {label: 'Google Chrome...'},
        {label: 'Firefox...'},
        {label: 'Safari...'}
      ]
      */
    }, {
      type: 'separator'
    }, {
      // this should be disabled when
      // no windows are active
      label: 'Close Tab',
      accelerator: 'CmdOrCtrl+W',
      click: function (item, focusedWindow) {
        sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_CLOSE_FRAME])
      }
    }, {
      // this should be disabled when
      // no windows are active
      label: 'Close Window',
      accelerator: 'CmdOrCtrl+Shift+W',
      click: function (item, focusedWindow) {
        if (focusedWindow) {
          AppActions.closeWindow(focusedWindow.id)
        }
      }
    }, {
      type: 'separator'
    }, {
      label: 'Save Page As...',
      accelerator: 'CmdOrCtrl+S',
      click: function (item, focusedWindow) {
        sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_SAVE])
      }
    }, {
      label: 'Share...',
      enabled: false
      /*
      submenu: [
        {label: 'Email Page Link...'},
        {type: 'separator'},
        {label: 'Tweet Page...'},
        {label: 'Share on Facebook...'},
        {label: 'More...'}
      ]
      */
    }, {
      type: 'separator'
    }, {
      label: 'Print...',
      accelerator: 'CmdOrCtrl+P',
      click: function (item, focusedWindow) {
        sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_PRINT])
      }
    }
  ]

  const helpMenu = [
    {
      label: 'Report an issue',
      click: function (item, focusedWindow) {
        sendToFocusedWindow(focusedWindow,
          [messages.SHORTCUT_NEW_FRAME, issuesUrl])
      }
    }, {
      type: 'separator'
    }, {
      label: 'Submit Feedback...',
      click: function (item, focusedWindow) {
        sendToFocusedWindow(focusedWindow,
                            [messages.SHORTCUT_NEW_FRAME, contactUrl])
      }
    }, {
      label: 'Spread the word about Brave...',
      click: function (item, focusedWindow) {
        sendToFocusedWindow(focusedWindow,
                            [messages.SHORTCUT_NEW_FRAME, aboutUrl])
      }
    }
  ]

  if (isWindows) {
    fileMenu.push({
      type: 'separator'
    })
    fileMenu.push(quitMenuItem)
    helpMenu.push(aboutBraveMenuItem)
  }

  var template = [
    {
      label: 'File',
      submenu: fileMenu
    }, {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        }, {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        }, {
          type: 'separator'
        }, {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        }, {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        }, {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        }, {
          label: 'Paste without formatting',
          accelerator: 'Shift+CmdOrCtrl+V',
          click: function (item, focusedWindow) {
            focusedWindow.webContents.pasteAndMatchStyle()
          }
        }, {
          type: 'separator'
        }, {
          label: 'Delete',
          accelerator: 'Delete'
        }, {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        }, {
          type: 'separator'
        }, {
          label: 'Find on page...',
          accelerator: 'CmdOrCtrl+F',
          click: function (item, focusedWindow) {
            sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_SHOW_FINDBAR])
          }
        }, {
          // TODO: hook up find next/prev shortcut. low-priority since this is
          // probably not used much.
          label: 'Find Next',
          enabled: false,
          accelerator: 'CmdOrCtrl+G'
        }, {
          label: 'Find Previous',
          enabled: false,
          accelerator: 'Shift+CmdOrCtrl+G'
        }, {
          type: 'separator'
        }
        // OSX inserts "start dictation" and "emoji and symbols" automatically
      ]
    }, {
      label: 'View',
      submenu: [
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: function (item, focusedWindow) {
            sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_ZOOM_RESET])
          }
        }, {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: function (item, focusedWindow) {
            sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_ZOOM_IN])
          }
        }, {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: function (item, focusedWindow) {
            sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_ZOOM_OUT])
          }
        }, {
          type: 'separator'
        }, {
          label: 'Toolbars',
          enabled: false
          /*
          submenu: [
            {label: 'Favorites Bar', accelerator: 'Alt+CmdOrCtrl+B'},
            {label: 'Tab Bar'},
            {label: 'Address Bar', accelerator: 'Alt+CmdOrCtrl+A'},
            {label: 'Tab Previews', accelerator: 'Alt+CmdOrCtrl+P'}
          ]
          */
        }, {
          type: 'separator'
        }, {
          label: 'Reload Page',
          accelerator: 'CmdOrCtrl+R',
          click: function (item, focusedWindow) {
            sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_RELOAD])
          }
        }, {
          label: 'Clean Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: function (item, focusedWindow) {
            sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_CLEAN_RELOAD])
          }
        }, {
          type: 'separator'
        }, {
          label: 'Reading View',
          enabled: false,
          accelerator: 'Alt+CmdOrCtrl+R'
        }, {
          label: 'Tab Manager',
          enabled: false,
          accelerator: 'Alt+CmdOrCtrl+M'
        }, {
          type: 'separator'
        }, {
          label: 'Text Encoding',
          enabled: false
          /*
          submenu: [
            {label: 'Autodetect', submenu: []},
            {type: 'separator'},
            {label: 'Unicode'},
            {label: 'Western'},
            {type: 'separator'},
            {label: 'etc...'}
          ]
          */
        }, {
          type: 'separator'
        }, {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Alt+I',
          click: function (item, focusedWindow) {
            sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_TOGGLE_DEV_TOOLS])
          }
        }, {
          label: 'Toggle Browser Console',
          accelerator: 'CmdOrCtrl+Alt+J',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.toggleDevTools()
            }
          }
        }, {
          type: 'separator'
        }, {
          label: 'Toggle Full Screen View',
          accelerator: 'Shift+CmdOrCtrl+F',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              // This doesn't seem to work but also doesn't throw errors...
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
            }
          }
        }
      ]
    }, {
      label: 'History',
      submenu: [
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+[',
          click: function (item, focusedWindow) {
            sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_BACK])
          }
        }, {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          click: function (item, focusedWindow) {
            sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_FORWARD])
          }
        }, {
          type: 'separator'
        }, {
          label: 'Reopen Last Closed Tab',
          accelerator: 'Shift+CmdOrCtrl+T',
          click: function (item, focusedWindow) {
            sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_UNDO_CLOSED_FRAME])
          }
        }, {
          label: 'Reopen Last Closed Window',
          enabled: false
        }, {
          type: 'separator'
        }, {
          label: 'Show All History',
          accelerator: 'CmdOrCtrl+Y',
          enabled: false
        }
      ]
    }, {
      label: 'Bookmarks',
      submenu: [
        bookmarkPageMenuItem,
        {
          label: 'Add to Favorites Bar',
          enabled: false,
          accelerator: 'Shift+CmdOrCtrl+D'
        }, {
          type: 'separator'
        }, {
          label: 'Manage Bookmarks',
          enabled: false,
          accelerator: 'Alt+CmdOrCtrl+B'
        }, {
          type: 'separator'
        }, {
          label: 'My Bookmarks',
          enabled: false
        }, {
          label: 'More',
          enabled: false
        }, {
          type: 'separator'
        }, {
          label: 'Import Bookmarks',
          enabled: false
          /*
          submenu: [
            {label: 'Google Chrome...'},
            {label: 'Firefox...'},
            {label: 'Safari...'}
          ]
          */
        }
      ]
    }, {
      label: 'Bravery',
      submenu: [
        {
          label: 'Manage...',
          enabled: false
        }, {
          type: 'separator'
        }, {
          label: 'GiveBack to this site',
          enabled: false,
          accelerator: 'Shift+CmdOrCtrl+Y'
        }, {
          label: 'Stay ad supported on this site',
          enabled: false,
          accelerator: 'Shift+CmdOrCtrl+N'
        }, {
          type: 'separator'
        }, {
          label: 'Site Protection Settings (Changes invoke reload)',
          enabled: false // Hack to make this look like a section header.
        }, {
          type: 'checkbox',
          label: 'Brave ad replacement',
          checked: Filtering.isResourceEnabled(AdInsertion.resourceName),
          click: function (item, focusedWindow) {
            AppActions.setResourceEnabled(AdInsertion.resourceName, !Filtering.isResourceEnabled(AdInsertion.resourceName))
            init({bookmarked: bookmarkPageMenuItem.checked})
          }
        }, {
          type: 'checkbox',
          label: 'Block ads',
          checked: Filtering.isResourceEnabled(AdBlock.resourceName),
          click: function (item, focusedWindow) {
            AppActions.setResourceEnabled(AdBlock.resourceName, !Filtering.isResourceEnabled(AdBlock.resourceName))
            init({bookmarked: bookmarkPageMenuItem.checked})
          }
        }, {
          type: 'checkbox',
          label: 'Block 3rd party cookies',
          enabled: false,
          checked: true
        }, {
          type: 'checkbox',
          label: 'Block Tracking',
          checked: Filtering.isResourceEnabled(TrackingProtection.resourceName),
          click: function (item, focusedWindow) {
            AppActions.setResourceEnabled(TrackingProtection.resourceName, !Filtering.isResourceEnabled(TrackingProtection.resourceName))
            init({bookmarked: bookmarkPageMenuItem.checked})
          }
        }, {
          type: 'checkbox',
          label: 'Block Popups',
          enabled: false,
          checked: true
        }, {
          type: 'checkbox',
          label: 'HTTPS everywhere',
          checked: Filtering.isResourceEnabled(HttpsEverywhere.resourceName),
          click: function (item, focusedWindow) {
            AppActions.setResourceEnabled(HttpsEverywhere.resourceName, !Filtering.isResourceEnabled(HttpsEverywhere.resourceName))
            init({bookmarked: bookmarkPageMenuItem.checked})
          }
        }, {
          type: 'separator'
        }, {
          label: 'Disable all protection on this site...',
          enabled: false
        }
      ]
    }, {
      label: 'Window',
      role: 'window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
          // "Minimize all" added automatically
        }, {
          label: 'Zoom',
          enabled: false
        }, {
          type: 'separator'
        }, {
          label: 'Select Next Tab',
          accelerator: 'Ctrl+Tab',
          click: function (item, focusedWindow) {
            sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEXT_TAB])
          }
        }, {
          label: 'Select Previous Tab',
          accelerator: 'Ctrl+Shift+Tab',
          click: function (item, focusedWindow) {
            sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_PREV_TAB])
          }
        }, {
          label: 'Move Tab to New Window',
          enabled: false
        }, {
          label: 'Merge All Windows',
          enabled: false
        }, {
          type: 'separator'
        }, {
          label: 'Downloads',
          accelerator: 'Shift+CmdOrCtrl+J',
          enabled: false
        }, {
          label: 'History',
          // On OSX, Shift+Cmd+H cannot be overridden.
          accelerator: 'CmdOrCtrl+Y',
          enabled: false
        }, {
          label: 'Bookmarks',
          accelerator: 'Alt+CmdOrCtrl+B',
          enabled: false
        }, {
          label: 'Tab Manager',
          accelerator: 'Alt+CmdOrCtrl+M',
          enabled: false
        }, {
          type: 'separator'
        }, {
          label: 'Bring All to Front',
          role: 'front'
        }
      ]
    }, {
      label: 'Help',
      role: 'help',
      submenu: helpMenu
    }
  ]

  if (isDarwin) {
    template.unshift({
      label: name, // Ignored on OSX, which gets this from the app Info.plist file.
      submenu: [
        aboutBraveMenuItem, {
          type: 'separator'
        }, preferencesMenuItem, {
          type: 'separator'
        }, {
          label: 'Send us Feedback...',
          click: function (item, focusedWindow) {
            sendToFocusedWindow(focusedWindow,
              [messages.SHORTCUT_NEW_FRAME, contactUrl])
          }
        }, {
          type: 'separator'
        }, {
          label: 'Services',
          role: 'services'
        }, {
          type: 'separator'
        }, {
          label: 'Hide ' + name,
          accelerator: 'Command+H',
          role: 'hide'
        }, {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        }, {
          label: 'Show All',
          role: 'unhide'
        }, {
          type: 'separator'
        },
        quitMenuItem
      ]
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

module.exports.init = init
