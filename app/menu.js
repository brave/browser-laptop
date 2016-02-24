/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')
const AppConfig = require('../js/constants/appConfig')
const Menu = require('menu')
const messages = require('../js/constants/messages')
const dialog = electron.dialog
const app = electron.app
const AppActions = require('../js/actions/appActions')
const CommonMenu = require('../js/commonMenu')
const Filtering = require('./filtering')
const Channel = require('./channel')

const isDarwin = process.platform === 'darwin'

const issuesUrl = 'https://github.com/brave/browser-laptop/issues'
const aboutUrl = 'https://brave.com/'

const path = require('path')

const httpsEverywhere = AppConfig.resourceNames.HTTPS_EVERYWHERE
const adblock = AppConfig.resourceNames.ADBLOCK
const cookieblock = AppConfig.resourceNames.COOKIEBLOCK
const adInsertion = AppConfig.resourceNames.AD_INSERTION
const trackingProtection = AppConfig.resourceNames.TRACKING_PROTECTION

let menuArgs = {}

/**
 * Sets up the menu.
 * @param {Object} settingsState - Application settings state
 * @param {Object} args - Arguments to initialize the menu with if any
 * @param {boolean} state.bookmarked - Whether the current active page is
 *   bookmarked
 */
const init = (settingsState, args) => {
  menuArgs = Object.assign(menuArgs, args || {})
  // Create references to menu items that need to be updated dynamically
  const bookmarkPageMenuItem = {
    label: 'Bookmark this page',
    type: 'checkbox',
    accelerator: 'CmdOrCtrl+D',
    checked: menuArgs.bookmarked || false,
    click: function (item, focusedWindow) {
      var msg = bookmarkPageMenuItem.checked
        ? messages.SHORTCUT_ACTIVE_FRAME_REMOVE_BOOKMARK
        : messages.SHORTCUT_ACTIVE_FRAME_BOOKMARK
      CommonMenu.sendToFocusedWindow(focusedWindow, [msg])
    }
  }

  const aboutBraveMenuItem = {
    label: 'About ' + AppConfig.name,
    click: (item, focusedWindow) => {
      dialog.showMessageBox({
        title: 'Brave',
        message: 'Version: ' + app.getVersion() + '\n' +
          'Electron: ' + process.versions['atom-shell'] + '\n' +
          'libchromiumcontent: ' + process.versions['chrome'] + '\n' +
          'Channel: ' + Channel.channel(),
        icon: path.join(__dirname, 'img', 'braveBtn3x.png'),
        buttons: ['Ok']
      })
    }
  }

  const fileMenu = [
// Note: we are keeping this here for testing. Calling process.crash() from the inspector does not create a crash report.
//        {
//          label: 'Crash!!!!!',
//          click: function (item, focusedWindow) {
//            process.crash()
//          }
//        },
    CommonMenu.newTabMenuItem,
    CommonMenu.newPrivateTabMenuItem,
    CommonMenu.newPartitionedTabMenuItem,
    CommonMenu.newWindowMenuItem,
    CommonMenu.separatorMenuItem,
    {
      label: 'Open File...',
      accelerator: 'CmdOrCtrl+O',
      click: (item, focusedWindow) => {
        dialog.showOpenDialog(focusedWindow, {
          properties: ['openFile', 'multiSelections']
        }, function (paths) {
          if (paths) {
            paths.forEach((path) => {
              CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, path])
            })
          }
        })
      }
    }, {
      label: 'Open Location...',
      accelerator: 'CmdOrCtrl+L',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_FOCUS_URL, false])
      }
    }, {
      label: 'Open Search...',
      accelerator: 'CmdOrCtrl+K',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_FOCUS_URL, true])
      }
    },
    CommonMenu.separatorMenuItem,
    {
      label: 'Import from...',
      enabled: false
      /*
      submenu: [
        {label: 'Google Chrome...'},
        {label: 'Firefox...'},
        {label: 'Safari...'}
      ]
      */
    },
    CommonMenu.separatorMenuItem,
    {
      // this should be disabled when
      // no windows are active
      label: 'Close Tab',
      accelerator: 'CmdOrCtrl+W',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_CLOSE_FRAME])
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
    },
    CommonMenu.separatorMenuItem,
    {
      label: 'Save Page As...',
      accelerator: 'CmdOrCtrl+S',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_SAVE])
      }
    }, {
      label: 'Share...',
      enabled: false
      /*
      submenu: [
        {label: 'Email Page Link...'},
        CommonMenu.separatorMenuItem,
        {label: 'Tweet Page...'},
        {label: 'Share on Facebook...'},
        {label: 'More...'}
      ]
      */
    },
    CommonMenu.separatorMenuItem,
    CommonMenu.printMenuItem
  ]

  const helpMenu = [
    {
      label: 'Report an issue',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow,
          [messages.SHORTCUT_NEW_FRAME, issuesUrl])
      }
    },
    CommonMenu.separatorMenuItem,
    {
      label: 'Submit Feedback...',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow,
                            [messages.SHORTCUT_NEW_FRAME, AppConfig.contactUrl])
      }
    }, {
      label: 'Spread the word about Brave...',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow,
                            [messages.SHORTCUT_NEW_FRAME, aboutUrl])
      }
    }
  ]

  if (!isDarwin) {
    fileMenu.push(CommonMenu.separatorMenuItem)
    fileMenu.push(CommonMenu.quitMenuItem)
    helpMenu.push(CommonMenu.separatorMenuItem)
    helpMenu.push(CommonMenu.checkForUpdateMenuItem)
    helpMenu.push(CommonMenu.separatorMenuItem)
    helpMenu.push(aboutBraveMenuItem)
  }

  const editSubmenu = [{
    label: 'Undo',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo'
  }, {
    label: 'Redo',
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo'
  },
    CommonMenu.separatorMenuItem,
    {
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
    },
    CommonMenu.separatorMenuItem,
    {
      label: 'Delete',
      accelerator: 'Delete',
      click: function (item, focusedWindow) {
        focusedWindow.webContents.delete()
      }
    }, {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      role: 'selectall'
    },
    CommonMenu.separatorMenuItem,
    CommonMenu.findOnPageMenuItem,
    {
      // TODO: hook up find next/prev shortcut. low-priority since this is
      // probably not used much.
      label: 'Find Next',
      enabled: false,
      accelerator: 'CmdOrCtrl+G'
    }, {
      label: 'Find Previous',
      enabled: false,
      accelerator: 'Shift+CmdOrCtrl+G'
    },
    CommonMenu.separatorMenuItem
    // OSX inserts "start dictation" and "emoji and symbols" automatically
  ]

  if (!isDarwin) {
    editSubmenu.push(CommonMenu.preferencesMenuItem)
  }

  var template = [
    {
      label: 'File',
      submenu: fileMenu
    }, {
      label: 'Edit',
      submenu: editSubmenu
    }, {
      label: 'View',
      submenu: [
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: function (item, focusedWindow) {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_ZOOM_RESET])
          }
        }, {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: function (item, focusedWindow) {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_ZOOM_IN])
          }
        }, {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: function (item, focusedWindow) {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_ZOOM_OUT])
          }
        },
        CommonMenu.separatorMenuItem,
        {
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
        },
        CommonMenu.separatorMenuItem,
        {
          label: 'Reload Page',
          accelerator: 'CmdOrCtrl+R',
          click: function (item, focusedWindow) {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_RELOAD])
          }
        }, {
          label: 'Clean Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: function (item, focusedWindow) {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_CLEAN_RELOAD])
          }
        },
        CommonMenu.separatorMenuItem,
        {
          label: 'Reading View',
          enabled: false,
          accelerator: 'Alt+CmdOrCtrl+R'
        }, {
          label: 'Tab Manager',
          enabled: false,
          accelerator: 'Alt+CmdOrCtrl+M'
        },
        CommonMenu.separatorMenuItem,
        {
          label: 'Text Encoding',
          enabled: false
          /*
          submenu: [
            {label: 'Autodetect', submenu: []},
            CommonMenu.separatorMenuItem,
            {label: 'Unicode'},
            {label: 'Western'},
            CommonMenu.separatorMenuItem,
            {label: 'etc...'}
          ]
          */
        },
        CommonMenu.separatorMenuItem,
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Alt+I',
          click: function (item, focusedWindow) {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_TOGGLE_DEV_TOOLS])
          }
        }, {
          label: 'Toggle Browser Console',
          accelerator: 'CmdOrCtrl+Alt+J',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.toggleDevTools()
            }
          }
        },
        CommonMenu.separatorMenuItem,
        {
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
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_BACK])
          }
        }, {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          click: function (item, focusedWindow) {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_FORWARD])
          }
        },
        CommonMenu.separatorMenuItem,
        CommonMenu.reopenLastClosedTabItem, {
          label: 'Reopen Last Closed Window',
          accelerator: 'Alt+Shift+CmdOrCtrl+T',
          click: function () {
            process.emit(messages.UNDO_CLOSED_WINDOW)
          }
        },
        CommonMenu.separatorMenuItem,
        {
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
        },
        CommonMenu.separatorMenuItem,
        CommonMenu.bookmarksMenuItem,
        CommonMenu.bookmarksToolbarMenuItem(settingsState),
        CommonMenu.separatorMenuItem,
        {
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
    },
    CommonMenu.buildBraveryMenu({
      adblock: Filtering.isResourceEnabled(adblock),
      cookieblock: Filtering.isResourceEnabled(cookieblock),
      adInsertion: Filtering.isResourceEnabled(adInsertion),
      trackingProtection: Filtering.isResourceEnabled(trackingProtection),
      httpsEverywhere: Filtering.isResourceEnabled(httpsEverywhere)
    }, init.bind(this, settingsState, {bookmarked: bookmarkPageMenuItem.checked})),
    {
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
        },
        CommonMenu.separatorMenuItem,
        {
          label: 'Select Next Tab',
          accelerator: 'Ctrl+Tab',
          click: function (item, focusedWindow) {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEXT_TAB])
          }
        }, {
          label: 'Select Previous Tab',
          accelerator: 'Ctrl+Shift+Tab',
          click: function (item, focusedWindow) {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_PREV_TAB])
          }
        }, {
          label: 'Move Tab to New Window',
          enabled: false
        }, {
          label: 'Merge All Windows',
          enabled: false
        },
        CommonMenu.separatorMenuItem,
        {
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
        },
        CommonMenu.separatorMenuItem,
        {
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
      label: AppConfig.name, // Ignored on OSX, which gets this from the app Info.plist file.
      submenu: [
        aboutBraveMenuItem,
        CommonMenu.separatorMenuItem,
        CommonMenu.checkForUpdateMenuItem,
        CommonMenu.separatorMenuItem,
        CommonMenu.preferencesMenuItem,
        CommonMenu.bookmarksMenuItem,
        CommonMenu.separatorMenuItem,
        {
          label: 'Send us Feedback...',
          click: function (item, focusedWindow) {
            CommonMenu.sendToFocusedWindow(focusedWindow,
              [messages.SHORTCUT_NEW_FRAME, AppConfig.contactUrl])
          }
        },
        CommonMenu.separatorMenuItem,
        {
          label: 'Services',
          role: 'services'
        },
        CommonMenu.separatorMenuItem,
        {
          label: 'Hide ' + AppConfig.name,
          accelerator: 'Command+H',
          role: 'hide'
        }, {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        }, {
          label: 'Show All',
          role: 'unhide'
        },
        CommonMenu.separatorMenuItem,
        CommonMenu.quitMenuItem
      ]
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

module.exports.init = init
