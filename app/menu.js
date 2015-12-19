/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const app = electron.app
const Menu = require('menu')
const messages = require('../js/constants/messages')

const init = () => {
  var template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Check for updates ...',
          click: function (item, focusedWindow) {
            process.emit(messages.CHECK_FOR_UPDATE)
          }
        },
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.webContents.send(messages.SHORTCUT_NEW_FRAME)
            } else {
              // no active windows
              process.emit(messages.NEW_WINDOW)
            }
          }
        }, {
          label: 'New Private Tab',
          accelerator: 'CmdOrCtrl+Alt+T',
          click: function (item, focusedWindow) {
            focusedWindow.webContents.send(messages.SHORTCUT_NEW_FRAME)
          }
        }, {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => process.emit(messages.NEW_WINDOW)
        }, {
          label: 'New Private Window',
          accelerator: 'CmdOrCtrl+Alt+N',
          click: () => process.emit(messages.NEW_WINDOW)
        }, {
          type: 'separator'
        }, {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O'
        }, {
          label: 'Open Location...',
          accelerator: 'CmdOrCtrl+L'
        }, {
          type: 'separator'
        }, {
          label: 'Import from...',
          submenu: [
            {label: 'Google Chrome...'},
            {label: 'Firefox...'},
            {label: 'Safari...'}
          ]
        }, {
          type: 'separator'
        }, {
          // this should be disabled when
          // no windows are active
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.webContents.send(messages.SHORTCUT_CLOSE_FRAME)
            }
          }
        }, {
          // this should be disabled when
          // no windows are active
          label: 'Close Window',
          accelerator: 'CmdOrCtrl+Shift+W',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              process.emit(messages.CLOSE_WINDOW)
            }
          }
        }, {
          type: 'separator'
        }, {
          label: 'Save Page As...',
          accelerator: 'CmdOrCtrl+S'
        }, {
          label: 'Share...',
          submenu: [
            {label: 'Email Page Link...'},
            {type: 'separator'},
            {label: 'Tweet Page...'},
            {label: 'Share on Facebook...'},
            {label: 'More...'}
          ]
        }, {
          type: 'separator'
        }, {
          label: 'Print...',
          accelerator: 'CmdOrCtrl+P'
        }
      ]
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
          role: 'paste'
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
          accelerator: 'CmdOrCtrl+F'
        }, {
          label: 'Find Next',
          accelerator: 'CmdOrCtrl+G'
        }, {
          label: 'Find Previous',
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
          accelerator: 'CmdOrCtrl+0'
        }, {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus' // renders as Shift+Cmd+= on OSX?
        }, {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-'
        }, {
          type: 'separator'
        }, {
          label: 'Toolbars',
          submenu: [
            {label: 'Favorites Bar', accelerator: 'Alt+CmdOrCtrl+B'},
            {label: 'Tab Bar', accelerator: 'Alt+CmdOrCtrl+T'},
            {label: 'Address Bar', accelerator: 'Alt+CmdOrCtrl+A'},
            {label: 'Tab Previews', accelerator: 'Alt+CmdOrCtrl+P'}
          ]
        }, {
          type: 'separator'
        }, {
          label: 'Reload Page',
          accelerator: 'CmdOrCtrl+R',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              // TODO: reload active frame
              focusedWindow.reload()
            }
          }
        }, {
          label: 'Clean Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              // TODO: reload active frame
              focusedWindow.reloadIgnoringCache()
            }
          }
        }, {
          type: 'separator'
        }, {
          label: 'Reading View',
          accelerator: 'Alt+CmdOrCtrl+R'
        }, {
          label: 'Tab Manager',
          accelerator: 'Alt+CmdOrCtrl+M'
        }, {
          type: 'separator'
        }, {
          label: 'Text Encoding',
          submenu: [
            {label: 'Autodetect', submenu: []},
            {type: 'separator'},
            {label: 'Unicode'},
            {label: 'Western'},
            {type: 'separator'},
            {label: 'etc...'}
          ]
        }, {
          type: 'separator'
        }, {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Alt+I',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_TOGGLE_DEV_TOOLS)
            }
          }
        }, {
          label: 'Toggle Browser Console',
          accelerator: 'CmdOrCtrl+Shift+J',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.toggleDevTools()
            }
          }
        }, {
          type: 'separator'
        }, {
          label: 'Enter Full Screen View',
          accelerator: 'Shift+CmdOrCtrl+F'
        }
        // Bring All To Front added automatically
      ]
    }, {
      label: 'History',
      submenu: [
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+['
        }, {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]'
        }, {
          type: 'separator'
        }, {
          label: 'Reopen Last Closed Tab',
          accelerator: 'Shift+CmdOrCtrl+T'
        }, {
          label: 'Reopen Last Closed Window'
        }, {
          type: 'separator'
        }, {
          label: 'My Mac',
          enabled: false
        }, {
          type: 'separator'
        }, {
          label: 'My iPhone',
          enabled: false
        }, {
          type: 'separator'
        }, {
          label: 'Show All History',
          accelerator: 'CmdOrCtrl+Y'
        }
      ]
    }, {
      label: 'Bookmarks',
      submenu: [
        {
          label: 'Add Bookmarks',
          accelerator: 'CmdOrCtrl+D'
        }, {
          label: 'Add to Favorites Bar',
          accelerator: 'Shift+CmdOrCtrl+D'
        }, {
          type: 'separator'
        }, {
          label: 'Manage Bookmarks',
          accelerator: 'Alt+CmdOrCtrl+B'
        }, {
          type: 'separator'
        }, {
          label: 'My Bookmarks',
          enabled: false
        }, {
          label: 'More',
          submenu: []
        }, {
          type: 'separator'
        }, {
          label: 'Import Bookmarks',
          submenu: [
            {label: 'Google Chrome...'},
            {label: 'Firefox...'},
            {label: 'Safari...'}
          ]
        }
      ]
    }, {
      label: 'Bravery',
      submenu: [
        {
          label: 'Logged in as Yan (0 Points)',
          enabled: false
        }, {
          label: 'Manage...'
        }, {
          type: 'separator'
        }, {
          label: 'GiveBack to this site',
          accelerator: 'Shift+CmdOrCtrl+Y'
        }, {
          label: 'Stay ad supported on this site',
          accelerator: 'Shift+CmdOrCtrl+N'
        }, {
          type: 'separator'
        }, {
          label: 'Site Protection Settings (Changes invoke reload)',
          enabled: false // Hack to make this look like a section header.
        }, {
          type: 'checkbox',
          label: 'Block Ads',
          checked: true
        }, {
          type: 'checkbox',
          label: 'Block Cookies',
          checked: true
        }, {
          type: 'checkbox',
          label: 'Block Tracking',
          checked: true
        }, {
          type: 'checkbox',
          label: 'Block Popups',
          checked: true
        }, {
          type: 'checkbox',
          label: 'Block HTTP',
          checked: false
        }, {
          type: 'separator'
        }, {
          label: 'Disable all protection on this site...'
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
          label: 'Zoom'
        }, {
          type: 'separator'
        }, {
          label: 'Select Next Tab',
          accelerator: 'Ctrl+Tab'
        }, {
          label: 'Select Previous Tab',
          accelerator: 'Ctrl+Shift+Tab'
        }, {
          label: 'Move Tab to New Window'
        }, {
          label: 'Merge All Windows'
        }, {
          type: 'separator'
        }, {
          label: 'Downloads',
          accelerator: 'Shift+CmdOrCtrl+J'
        }, {
          label: 'History',
          // On OSX, Shift+Cmd+H cannot be overridden.
          accelerator: 'CmdOrCtrl+Y'
        }, {
          label: 'Bookmarks',
          accelerator: 'Alt+CmdOrCtrl+B'
        }, {
          label: 'Tab Manager',
          accelerator: 'Alt+CmdOrCtrl+M'
        }
      ]
    }, {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'Brave Help',
          click: function (item, focusedWindow) {
            focusedWindow.webContents.send(messages.SHORTCUT_NEW_FRAME,
                                           'https://brave.com')
          }
        }, {
          type: 'separator'
        }, {
          label: 'Submit Feedback...',
          click: function (item, focusedWindow) {
            focusedWindow.webContents.send(messages.SHORTCUT_NEW_FRAME,
                                           'https://brave.com')
          }
        }, {
          label: 'Spread the word about Brave...',
          click: function (item, focusedWindow) {
            focusedWindow.webContents.send(messages.SHORTCUT_NEW_FRAME,
                                           'https://brave.com')
          }
        }
      ]
    }
  ]

  if (process.platform === 'darwin') {
    var name = 'Brave'
    template.unshift({
      label: name, // Ignored. OSX gets this from the app Info.plist file.
      submenu: [
        {
          label: 'About ' + name,
          role: 'about'
        }, {
          type: 'separator'
        }, {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,'
        }, {
          type: 'separator'
        }, {
          label: 'Send us Feedback...',
          click: function (item, focusedWindow) {
            focusedWindow.webContents.send(messages.SHORTCUT_NEW_FRAME,
                                           'https://brave.com')
          }
        }, {
          type: 'separator'
        }, {
          label: 'Services',
          role: 'services',
          submenu: []
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
        }, {
          label: 'Quit ' + name,
          accelerator: 'Command+Q',
          click: app.quit
        }
      ]
    })
    // Window menu.
    template[3].submenu.push(
      {
        type: 'separator'
      }, {
        label: 'Bring All to Front',
        role: 'front'
      }
    )
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

module.exports.init = init
