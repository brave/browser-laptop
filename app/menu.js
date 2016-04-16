/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')
const appConfig = require('../js/constants/appConfig')
const Menu = require('menu')
const messages = require('../js/constants/messages')
const settings = require('../js/constants/settings')
const dialog = electron.dialog
const appActions = require('../js/actions/appActions')
const siteUtil = require('../js/state/siteUtil')
const CommonMenu = require('../js/commonMenu')
const Filtering = require('./filtering')
const getSetting = require('../js/settings').getSetting
const appStore = require('../js/stores/appStore')

const isDarwin = process.platform === 'darwin'

const aboutUrl = 'https://brave.com/'

const adblock = appConfig.resourceNames.ADBLOCK
const cookieblock = appConfig.resourceNames.COOKIEBLOCK
const adInsertion = appConfig.resourceNames.AD_INSERTION
const trackingProtection = appConfig.resourceNames.TRACKING_PROTECTION
const httpsEverywhere = appConfig.resourceNames.HTTPS_EVERYWHERE
const safeBrowsing = appConfig.resourceNames.SAFE_BROWSING

let menuArgs = {}
let lastSettingsState, lastArgs

/**
 * Sets up the menu.
 * @param {Object} settingsState - Application settings state
 * @param {Object} args - Arguments to initialize the menu with if any
 * @param {boolean} state.bookmarked - Whether the current active page is
 *   bookmarked
 */
const init = (settingsState, args) => {
  // Check for unneeded updates.
  // Updating the menu when it is not needed causes the menu to close if expanded
  // and also causes menu clicks to not work.  So we don't want to update it a lot
  // when app state changes, like when there are downloads.
  // Note that settingsState is not used directly below, but getSetting uses it.
  if (settingsState === lastSettingsState && args === lastArgs) {
    return
  }

  lastSettingsState = settingsState
  lastArgs = args
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
        }, (paths) => {
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
          appActions.closeWindow(focusedWindow.id)
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
    CommonMenu.reportAnIssueMenuItem,
    CommonMenu.separatorMenuItem,
    CommonMenu.submitFeedbackMenuItem,
    {
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
    helpMenu.push(CommonMenu.aboutBraveMenuItem)
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
          accelerator: isDarwin ? 'Cmd+Alt+I' : 'Ctrl+Shift+I',
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
          label: 'Home',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: function (item, focusedWindow) {
            CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL, getSetting(settings.HOMEPAGE)])
          }
        }, {
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
        },
        CommonMenu.separatorMenuItem,
        {
          label: 'Clear History',
          accelerator: 'Shift+CmdOrCtrl+Delete',
          enabled: siteUtil.hasNoTagSites(appStore.getState().get('sites')),
          click: function (item, focusedWindow) {
            appActions.clearSitesWithoutTags(appStore.getState().get('sites'))
          }
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
        CommonMenu.bookmarksToolbarMenuItem(),
        CommonMenu.separatorMenuItem,
        CommonMenu.importBookmarksMenuItem
      ]
    },
    CommonMenu.buildBraveryMenu({
      adblock: Filtering.isResourceEnabled(adblock),
      cookieblock: Filtering.isResourceEnabled(cookieblock),
      adInsertion: Filtering.isResourceEnabled(adInsertion),
      trackingProtection: Filtering.isResourceEnabled(trackingProtection),
      httpsEverywhere: Filtering.isResourceEnabled(httpsEverywhere),
      safeBrowsing: Filtering.isResourceEnabled(safeBrowsing)
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
        CommonMenu.bookmarksMenuItem,
        CommonMenu.downloadsMenuItem,
        CommonMenu.passwordsMenuItem, {
          label: 'History',
          accelerator: 'CmdOrCtrl+Y',
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
      label: appConfig.name, // Ignored on OSX, which gets this from the app Info.plist file.
      submenu: [
        CommonMenu.aboutBraveMenuItem,
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
              [messages.SHORTCUT_NEW_FRAME, appConfig.contactUrl])
          }
        },
        CommonMenu.separatorMenuItem,
        {
          label: 'Services',
          role: 'services'
        },
        CommonMenu.separatorMenuItem,
        {
          label: `Hide ${appConfig.name}`,
          accelerator: 'Command+H',
          role: 'hide'
        }, {
          label: 'Hide Others',
          accelerator: 'Command+Alt+H',
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
