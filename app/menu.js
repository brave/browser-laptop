/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')
const appConfig = require('../js/constants/appConfig')
const Menu = electron.Menu
const messages = require('../js/constants/messages')
const settings = require('../js/constants/settings')
const dialog = electron.dialog
const appActions = require('../js/actions/appActions')
const siteUtil = require('../js/state/siteUtil')
const getSetting = require('../js/settings').getSetting
const locale = require('./locale')
const isDarwin = process.platform === 'darwin'
const aboutUrl = 'https://brave.com/'

// Start off with an empty menu
let appMenu = Menu.buildFromTemplate([])
Menu.setApplicationMenu(appMenu)

// Static menu definitions (initialized once in createMenu())
let fileSubmenu, editSubmenu, viewSubmenu, braverySubmenu, windowSubmenu, helpSubmenu, debugSubmenu

// States which can trigger dynamic menus to change
let lastSettingsState, lastSites

// Used to hold the default value for "isBookmarked" (see createBookmarksSubmenu)
let initBookmarkChecked = false

// Submenu initialization
const createFileSubmenu = (CommonMenu) => {
  const submenu = [
    CommonMenu.newTabMenuItem(),
    CommonMenu.newPrivateTabMenuItem(),
    CommonMenu.newPartitionedTabMenuItem(),
    CommonMenu.newWindowMenuItem(),
    CommonMenu.separatorMenuItem,
    {
      label: locale.translation('openFile'),
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
      label: locale.translation('openLocation'),
      accelerator: 'CmdOrCtrl+L',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_FOCUS_URL])
      }
    },
    CommonMenu.separatorMenuItem,
    /*
    {
      label: locale.translation('importFrom'),
      visible: false
      submenu: [
        {label: 'Google Chrome...'},
        {label: 'Firefox...'},
        {label: 'Safari...'}
      ]
    },
    CommonMenu.separatorMenuItem,
    */
    {
      // this should be disabled when
      // no windows are active
      label: locale.translation('closeTab'),
      accelerator: 'CmdOrCtrl+W',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_CLOSE_FRAME])
      }
    }, {
      // this should be disabled when
      // no windows are active
      label: locale.translation('closeWindow'),
      accelerator: 'CmdOrCtrl+Shift+W',
      click: function (item, focusedWindow) {
        if (focusedWindow) {
          appActions.closeWindow(focusedWindow.id)
        }
      }
    },
    CommonMenu.separatorMenuItem,
    {
      label: locale.translation('savePageAs'),
      accelerator: 'CmdOrCtrl+S',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_SAVE])
      }
    }, {
      label: locale.translation('share'),
      visible: false
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
    CommonMenu.printMenuItem()
  ]

  if (!isDarwin) {
    submenu.push(CommonMenu.separatorMenuItem)
    submenu.push(CommonMenu.quitMenuItem())
  }

  return submenu
}

const createEditSubmenu = (CommonMenu) => {
  const submenu = [
    {
      label: locale.translation('undo'),
      accelerator: 'CmdOrCtrl+Z',
      role: 'undo'
    }, {
      label: locale.translation('redo'),
      accelerator: 'Shift+CmdOrCtrl+Z',
      role: 'redo'
    },
    CommonMenu.separatorMenuItem,
    {
      label: locale.translation('cut'),
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    }, {
      label: locale.translation('copy'),
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    }, {
      label: locale.translation('paste'),
      accelerator: 'CmdOrCtrl+V',
      role: 'paste'
    }, {
      label: locale.translation('pasteWithoutFormatting'),
      accelerator: 'Shift+CmdOrCtrl+V',
      click: function (item, focusedWindow) {
        focusedWindow.webContents.pasteAndMatchStyle()
      }
    },
    CommonMenu.separatorMenuItem,
    {
      label: locale.translation('delete'),
      accelerator: 'Delete',
      click: function (item, focusedWindow) {
        focusedWindow.webContents.delete()
      }
    }, {
      label: locale.translation('selectAll'),
      accelerator: 'CmdOrCtrl+A',
      role: 'selectall'
    },
    CommonMenu.separatorMenuItem,
    CommonMenu.findOnPageMenuItem(),
    {
      label: locale.translation('findNext'),
      visible: false,
      accelerator: 'CmdOrCtrl+G'
    }, {
      label: locale.translation('findPrevious'),
      visible: false,
      accelerator: 'Shift+CmdOrCtrl+G'
    },
    CommonMenu.separatorMenuItem
    // NOTE: OSX inserts "start dictation" and "emoji and symbols" automatically
  ]

  if (!isDarwin) {
    submenu.push(CommonMenu.preferencesMenuItem())
  }

  return submenu
}

const createViewSubmenu = (CommonMenu) => {
  return [
    {
      label: locale.translation('actualSize'),
      accelerator: 'CmdOrCtrl+0',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_ZOOM_RESET])
      }
    }, {
      label: locale.translation('zoomIn'),
      accelerator: 'CmdOrCtrl+=',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_ZOOM_IN])
      }
    }, {
      label: locale.translation('zoomOut'),
      accelerator: 'CmdOrCtrl+-',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_ZOOM_OUT])
      }
    },
    CommonMenu.separatorMenuItem,
    /*
    {
      label: locale.translation('toolbars'),
      visible: false
      submenu: [
        {label: 'Favorites Bar', accelerator: 'Alt+CmdOrCtrl+B'},
        {label: 'Tab Bar'},
        {label: 'Address Bar', accelerator: 'Alt+CmdOrCtrl+A'},
        {label: 'Tab Previews', accelerator: 'Alt+CmdOrCtrl+P'}
      ]
    },
    CommonMenu.separatorMenuItem,
    */
    {
      label: locale.translation('stop'),
      accelerator: isDarwin ? 'Cmd+.' : 'Esc',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_STOP])
      }
    }, {
      label: locale.translation('reloadPage'),
      accelerator: 'CmdOrCtrl+R',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_RELOAD])
      }
    }, {
      label: locale.translation('cleanReload'),
      accelerator: 'CmdOrCtrl+Shift+R',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_CLEAN_RELOAD])
      }
    },
    CommonMenu.separatorMenuItem,
    /*
    {
      label: locale.translation('readingView'),
      visible: false,
      accelerator: 'Alt+CmdOrCtrl+R'
    }, {
      label: locale.translation('tabManager'),
      visible: false,
      accelerator: 'Alt+CmdOrCtrl+M'
    },
    CommonMenu.separatorMenuItem,
    {
      label: locale.translation('textEncoding'),
      visible: false
      submenu: [
        {label: 'Autodetect', submenu: []},
        CommonMenu.separatorMenuItem,
        {label: 'Unicode'},
        {label: 'Western'},
        CommonMenu.separatorMenuItem,
        {label: 'etc...'}
      ]
    },
    CommonMenu.separatorMenuItem,
    */
    {
      label: locale.translation('toggleDeveloperTools'),
      accelerator: isDarwin ? 'Cmd+Alt+I' : 'Ctrl+Shift+I',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_TOGGLE_DEV_TOOLS])
      }
    },
    CommonMenu.separatorMenuItem,
    {
      label: locale.translation('toggleFullScreenView'),
      accelerator: isDarwin ? 'Ctrl+Cmd+F' : 'F11',
      click: function (item, focusedWindow) {
        if (focusedWindow) {
          // This doesn't seem to work but also doesn't throw errors...
          focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
        }
      }
    }
  ]
}

const createHistorySubmenu = (CommonMenu) => {
  return [
    {
      label: locale.translation('home'),
      accelerator: 'CmdOrCtrl+Shift+H',
      click: function (item, focusedWindow) {
        getSetting(settings.HOMEPAGE).split('|').forEach((homepage, i) => {
          CommonMenu.sendToFocusedWindow(focusedWindow,
              [i === 0 ? messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL : messages.SHORTCUT_NEW_FRAME, homepage])
        })
      }
    }, {
      label: locale.translation('back'),
      accelerator: 'CmdOrCtrl+[',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_BACK])
      }
    }, {
      label: locale.translation('forward'),
      accelerator: 'CmdOrCtrl+]',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_FORWARD])
      }
    },
    CommonMenu.separatorMenuItem,
    CommonMenu.reopenLastClosedTabItem(),
    {
      label: locale.translation('reopenLastClosedWindow'),
      accelerator: 'Alt+Shift+CmdOrCtrl+T',
      click: function () {
        process.emit(messages.UNDO_CLOSED_WINDOW)
      }
    },
    CommonMenu.separatorMenuItem,
    /*
    {
      label: locale.translation('showAllHistory'),
      accelerator: 'CmdOrCtrl+Y',
      visible: false
    },
    CommonMenu.separatorMenuItem,
    */
    {
      label: locale.translation('clearHistory'),
      accelerator: 'Shift+CmdOrCtrl+Delete',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_OPEN_CLEAR_BROWSING_DATA_PANEL, {browserHistory: true}])
      }
    }, {
      label: locale.translation('clearCache'),
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_OPEN_CLEAR_BROWSING_DATA_PANEL, {cachedImagesAndFiles: true}])
      }
    }, {
      label: locale.translation('clearSiteData'),
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_OPEN_CLEAR_BROWSING_DATA_PANEL, {allSiteCookies: true, cachedImagesAndFiles: true}])
      }
    }
  ]
}

const createBookmarksSubmenu = (CommonMenu) => {
  return [
    {
      label: locale.translation('bookmarkPage'),
      type: 'checkbox',
      accelerator: 'CmdOrCtrl+D',
      checked: initBookmarkChecked, // NOTE: checked status is updated via updateBookmarkedStatus()
      click: function (item, focusedWindow) {
        var msg = item.checked
          ? messages.SHORTCUT_ACTIVE_FRAME_REMOVE_BOOKMARK
          : messages.SHORTCUT_ACTIVE_FRAME_BOOKMARK
        CommonMenu.sendToFocusedWindow(focusedWindow, [msg])
      }
    },
    {
      label: locale.translation('addToFavoritesBar'),
      visible: false,
      accelerator: 'Shift+CmdOrCtrl+D'
    },
    CommonMenu.separatorMenuItem,
    CommonMenu.bookmarksManagerMenuItem(),
    CommonMenu.bookmarksToolbarMenuItem(),
    CommonMenu.separatorMenuItem,
    CommonMenu.importBookmarksMenuItem(),
    CommonMenu.separatorMenuItem
  ].concat(CommonMenu.createBookmarkMenuItems(siteUtil.getBookmarks(lastSites)))
}

const createWindowSubmenu = (CommonMenu) => {
  return [
    {
      label: locale.translation('minimize'),
      accelerator: 'CmdOrCtrl+M',
      role: 'minimize'
      // "Minimize all" added automatically
    }, {
      label: locale.translation('zoom'),
      visible: false
    },
    CommonMenu.separatorMenuItem,
    {
      label: locale.translation('selectNextTab'),
      accelerator: 'Ctrl+Tab',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEXT_TAB])
      }
    }, {
      label: locale.translation('selectPreviousTab'),
      accelerator: 'Ctrl+Shift+Tab',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_PREV_TAB])
      }
    }, {
      label: locale.translation('moveTabToNewWindow'),
      visible: false
    }, {
      label: locale.translation('mergeAllWindows'),
      visible: false
    },
    CommonMenu.separatorMenuItem,
    CommonMenu.bookmarksManagerMenuItem(),
    CommonMenu.downloadsMenuItem(),
    CommonMenu.passwordsMenuItem(),
    {
      label: locale.translation('history'),
      accelerator: 'CmdOrCtrl+Y',
      visible: false
    },
    CommonMenu.separatorMenuItem,
    {
      label: locale.translation('bringAllToFront'),
      role: 'front'
    }
  ]
}

const createHelpSubmenu = (CommonMenu) => {
  const submenu = [
    CommonMenu.reportAnIssueMenuItem(),
    CommonMenu.separatorMenuItem,
    CommonMenu.submitFeedbackMenuItem(),
    {
      label: locale.translation('spreadTheWord'),
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow,
                            [messages.SHORTCUT_NEW_FRAME, aboutUrl])
      }
    }
  ]

  if (!isDarwin) {
    submenu.push(CommonMenu.separatorMenuItem)
    submenu.push(CommonMenu.checkForUpdateMenuItem())
    submenu.push(CommonMenu.separatorMenuItem)
    submenu.push(CommonMenu.aboutBraveMenuItem())
  }

  return submenu
}

const createDebugSubmenu = (CommonMenu) => {
  return [
    {
      // Makes future renderer processes pause when they are created until a debugger appears.
      // The console will print a message like: [84790:0710/201431:ERROR:child_process.cc(136)] Renderer (84790) paused waiting for debugger to attach. Send SIGUSR1 to unpause.
      // And this means you should attach Xcode or whatever your debugger is to PID 84790 to unpause.
      // To debug all renderer processes then add the appendSwitch call to app/index.js
      label: 'append wait renderer switch',
      click: function () {
        electron.app.commandLine.appendSwitch('renderer-startup-dialog')
      }
    }, {
      label: 'Crash main process',
      click: function () {
        process.crash()
      }
    }, {
      label: 'Relaunch',
      accelerator: 'Command+Alt+R',
      click: function () {
        electron.app.relaunch({args: process.argv.slice(1) + ['--relaunch']})
        electron.app.quit()
      }
    }, {
      label: locale.translation('toggleBrowserConsole'),
      accelerator: 'Shift+F8',
      click: function (item, focusedWindow) {
        if (focusedWindow) {
          focusedWindow.toggleDevTools()
        }
      }
    }, {
      label: 'Toggle React Profiling',
      accelerator: 'Alt+P',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.DEBUG_REACT_PROFILE])
      }
    }
  ]
}

/**
 * Get the electron MenuItem object based on its label
 * @param {string} label - the text associated with the menu
 * NOTE: label may be a localized string
 */
const getMenuItem = (label) => {
  if (appMenu && appMenu.items && appMenu.items.length > 0) {
    for (let i = 0; i < appMenu.items.length; i++) {
      const menuItem = appMenu.items[i].submenu.items.find(function (item) {
        return item.label === label
      })
      if (menuItem) return menuItem
    }
  }
  return null
}

/**
 * Called from navigationBar.js; used to update bookmarks menu status
 * @param {boolean} isBookmarked - true if the currently viewed site is bookmarked
 */
const updateBookmarkedStatus = (isBookmarked) => {
  const menuItem = getMenuItem(locale.translation('bookmarkPage'))
  if (menuItem) {
    menuItem.checked = isBookmarked
  }
  // menu may be rebuilt without the location changing
  // this holds the last known status
  initBookmarkChecked = isBookmarked
}

/**
 * Check for uneeded updates.
 * Updating the menu when it is not needed causes the menu to close if expanded
 * and also causes menu clicks to not work.  So we don't want to update it a lot
 * when app state changes, like when there are downloads.
 * NOTE: settingsState is not used directly; it gets used indirectly via getSetting()
 * @param {}
 */
const isUpdateNeeded = (settingsState, sites) => {
  let stateChanged = false
  if (settingsState !== lastSettingsState) {
    lastSettingsState = settingsState
    stateChanged = true
  }
  if (sites !== lastSites) {
    lastSites = sites
    stateChanged = true
  }
  return stateChanged
}

/**
 * Will only build the static items once
 * Dynamic items (Bookmarks, History) are built each time
 */
const createMenu = (CommonMenu) => {
  if (!fileSubmenu) { fileSubmenu = createFileSubmenu(CommonMenu) }
  if (!editSubmenu) { editSubmenu = createEditSubmenu(CommonMenu) }
  if (!viewSubmenu) { viewSubmenu = createViewSubmenu(CommonMenu) }
  if (!braverySubmenu) {
    braverySubmenu = [
      CommonMenu.braveryGlobalMenuItem(),
      CommonMenu.braverySiteMenuItem()
    ]
  }
  if (!windowSubmenu) { windowSubmenu = createWindowSubmenu(CommonMenu) }
  if (!helpSubmenu) { helpSubmenu = createHelpSubmenu(CommonMenu) }

  // Creation of the menu. Notice Bookmarks and History are created each time.
  const template = [
    { label: locale.translation('file'), submenu: fileSubmenu },
    { label: locale.translation('edit'), submenu: editSubmenu },
    { label: locale.translation('view'), submenu: viewSubmenu },
    { label: locale.translation('history'), submenu: createHistorySubmenu(CommonMenu) },
    { label: locale.translation('bookmarks'), submenu: createBookmarksSubmenu(CommonMenu) },
    { label: locale.translation('bravery'), submenu: braverySubmenu },
    { label: locale.translation('window'), submenu: windowSubmenu, role: 'window' },
    { label: locale.translation('help'), submenu: helpSubmenu, role: 'help' }
  ]

  if (process.env.NODE_ENV === 'development') {
    if (!debugSubmenu) { debugSubmenu = createDebugSubmenu(CommonMenu) }
    template.push({ label: 'Debug', submenu: debugSubmenu })
  }

  if (isDarwin) {
    template.unshift({
      label: appConfig.name, // Ignored on OSX, which gets this from the app Info.plist file.
      submenu: [
        CommonMenu.aboutBraveMenuItem(),
        CommonMenu.separatorMenuItem,
        CommonMenu.checkForUpdateMenuItem(),
        CommonMenu.separatorMenuItem,
        CommonMenu.preferencesMenuItem(),
        CommonMenu.separatorMenuItem,
        {
          label: locale.translation('sendUsFeedback'),
          click: function () {
            electron.shell.openExternal(appConfig.contactUrl)
          }
        },
        CommonMenu.separatorMenuItem,
        {
          label: locale.translation('services'),
          role: 'services'
        },
        CommonMenu.separatorMenuItem,
        {
          label: `Hide ${appConfig.name}`,
          accelerator: 'Command+H',
          role: 'hide'
        }, {
          label: locale.translation('hideOthers'),
          accelerator: 'Command+Alt+H',
          role: 'hideothers'
        }, {
          label: locale.translation('showAll'),
          role: 'unhide'
        },
        CommonMenu.separatorMenuItem,
        CommonMenu.quitMenuItem()
      ]
    })
  }

  const oldMenu = appMenu
  appMenu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(appMenu)
  oldMenu.destroy()
}

/**
 * Sets up the menu.
 * @param {Object} settingsState - Application settings state
 * @param {List} - list of siteDetails
 */
const init = (settingsState, sites) => {
  // The menu will always be called once localization is done
  // so don't bother loading anything until it is done.
  if (!locale.initialized) {
    return
  }

  if (!isUpdateNeeded(settingsState, sites)) {
    return
  }

  // This needs to be within the init method to handle translations
  const CommonMenu = require('../js/commonMenu')

  createMenu(CommonMenu)
}

module.exports = {
  init,
  updateBookmarkedStatus
}
