/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const electron = require('electron')
const appConfig = require('../../js/constants/appConfig')
const appActions = require('../../js/actions/appActions')
const appConstants = require('../../js/constants/appConstants')
const appDispatcher = require('../../js/dispatcher/appDispatcher')
const appStore = require('../../js/stores/appStore')
const windowConstants = require('../../js/constants/windowConstants')
const Menu = electron.Menu
const CommonMenu = require('../common/commonMenu')
const messages = require('../../js/constants/messages')
const settings = require('../../js/constants/settings')
const siteTags = require('../../js/constants/siteTags')
const dialog = electron.dialog
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const {fileUrl} = require('../../js/lib/appUrlUtil')
const menuUtil = require('../common/lib/menuUtil')
const getSetting = require('../../js/settings').getSetting
const locale = require('../locale')
const {isSiteBookmarked, siteSort} = require('../../js/state/siteUtil')
const isDarwin = process.platform === 'darwin'
const aboutUrl = 'https://brave.com/'

let appMenu = null
// TODO(bridiver) - these should be handled in the appStore
let closedFrames = {}
let currentLocation = null

// Submenu initialization
const createFileSubmenu = () => {
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
              CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, fileUrl(path)])
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

const createEditSubmenu = () => {
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
    // NOTE: macOS inserts "start dictation" and "emoji and symbols" automatically
  ]

  if (!isDarwin) {
    submenu.push(CommonMenu.preferencesMenuItem())
  }

  return submenu
}

const createViewSubmenu = () => {
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
    },
    CommonMenu.reloadPageMenuItem(),
    CommonMenu.cleanReloadMenuItem(),
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

const createHistorySubmenu = () => {
  let submenu = [
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
      label: locale.translation('clearBrowsingData'),
      accelerator: 'Shift+CmdOrCtrl+Delete',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_OPEN_CLEAR_BROWSING_DATA_PANEL])
      }
    }
  ]
  submenu = submenu.concat(menuUtil.createRecentlyClosedTemplateItems(Immutable.fromJS(Object.keys(closedFrames).map(key => closedFrames[key]))))

  submenu.push(
    // TODO: recently visited
    // CommonMenu.separatorMenuItem,
    // {
    //   label: locale.translation('recentlyVisited'),
    //   enabled: false
    // },
    CommonMenu.separatorMenuItem,
    CommonMenu.historyMenuItem())

  return submenu
}

const isCurrentLocationBookmarked = () => {
  return isSiteBookmarked(appStore.getState().get('sites'), Immutable.fromJS({location: currentLocation}))
}

const createBookmarksSubmenu = () => {
  let submenu = [
    {
      label: locale.translation('bookmarkPage'),
      type: 'checkbox',
      accelerator: 'CmdOrCtrl+D',
      checked: isCurrentLocationBookmarked(),
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
    CommonMenu.importBrowserDataMenuItem(),
    CommonMenu.exportBookmarksMenuItem()
  ]

  const bookmarks = menuUtil.createBookmarkTemplateItems(appStore.getState().get('sites').toList().sort(siteSort))
  if (bookmarks.length > 0) {
    submenu.push(CommonMenu.separatorMenuItem)
    submenu = submenu.concat(bookmarks)
  }

  return submenu
}

const createWindowSubmenu = () => {
  const submenu = [
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
    CommonMenu.passwordsMenuItem()
  ]

  if (isDarwin) {
    submenu.push(
      CommonMenu.separatorMenuItem,
      {
        label: locale.translation('bringAllToFront'),
        role: 'front'
      }
    )
  }

  return submenu
}

const createHelpSubmenu = () => {
  const submenu = [
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

const createDebugSubmenu = () => {
  return [
    {
      // Makes future renderer processes pause when they are created until a debugger appears.
      // The console will print a message like: [84790:0710/201431:ERROR:child_process.cc(136)] Renderer (84790) paused waiting for debugger to attach. Send SIGUSR1 to unpause.
      // And this means you should attach Xcode or whatever your debugger is to PID 84790 to unpause.
      // To debug all renderer processes then add the appendSwitch call to app/index.js
      label: 'append wait renderer switch',
      click: function () {
        app.commandLine.appendSwitch('renderer-startup-dialog')
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
        app.relaunch({args: process.argv.slice(1) + ['--relaunch']})
        app.quit()
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

const createDockSubmenu = () => {
  return [
    {
      label: locale.translation('newWindow'),
      click: () => appActions.newWindow()
    }
  ]
}

/**
 * Will only build the initial menu, which is mostly static items
 * Dynamic items (Bookmarks, History) get updated w/ updateMenu
 */
const createMenu = () => {
  const template = [
    { label: locale.translation('file'), submenu: createFileSubmenu() },
    { label: locale.translation('edit'), submenu: createEditSubmenu() },
    { label: locale.translation('view'), submenu: createViewSubmenu() },
    { label: locale.translation('history'), submenu: createHistorySubmenu() },
    { label: locale.translation('bookmarks'), submenu: createBookmarksSubmenu() },
    {
      label: locale.translation('bravery'),
      submenu: [
        CommonMenu.braverySiteMenuItem(),
        CommonMenu.separatorMenuItem,
        CommonMenu.braveryPaymentsMenuItem()
      ]
    },
    { label: locale.translation('window'), submenu: createWindowSubmenu(), role: 'window' },
    { label: locale.translation('help'), submenu: createHelpSubmenu(), role: 'help' }
  ]

  if (process.env.NODE_ENV === 'development') {
    template.push({ label: 'Debug', submenu: createDebugSubmenu() })
  }

  if (isDarwin) {
    template.unshift({
      label: appConfig.name, // Ignored on macOS, which gets this from the app Info.plist file.
      submenu: [
        CommonMenu.aboutBraveMenuItem(),
        CommonMenu.separatorMenuItem,
        CommonMenu.preferencesMenuItem(),
        CommonMenu.separatorMenuItem,
        CommonMenu.importBrowserDataMenuItem(),
        CommonMenu.checkForUpdateMenuItem(),
        CommonMenu.submitFeedbackMenuItem(),
        CommonMenu.separatorMenuItem,
        {
          label: locale.translation('services'),
          role: 'services'
        },
        CommonMenu.separatorMenuItem,
        {
          label: locale.translation('hideBrave'),
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

  appActions.setMenubarTemplate(Immutable.fromJS(template))

  let oldMenu = appMenu
  appMenu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(appMenu)
  if (oldMenu) {
    oldMenu.destroy()
  }

  if (app.dock) {
    const dockMenu = Menu.buildFromTemplate(createDockSubmenu())
    app.dock.setMenu(dockMenu)
  }
}

const setMenuItemChecked = (label, checked) => {
  // Update electron menu (Mac / Linux)
  const systemMenuItem = menuUtil.getMenuItem(appMenu, label)
  systemMenuItem.checked = checked

  // Update in-memory menu template (Windows)
  const oldTemplate = appStore.getState().getIn(['menu', 'template'])
  const newTemplate = menuUtil.setTemplateItemChecked(oldTemplate, label, checked)
  if (newTemplate) {
    appActions.setMenubarTemplate(newTemplate)
  }
}

const doAction = (action) => {
  switch (action.actionType) {
    case windowConstants.WINDOW_SET_FOCUSED_FRAME:
      // Update the checkbox next to "Bookmark Page" (Bookmarks menu)
      currentLocation = action.frameProps.get('location')
      setMenuItemChecked(locale.translation('bookmarkPage'), isCurrentLocationBookmarked())
      break
    case appConstants.APP_CHANGE_SETTING:
      if (action.key === settings.SHOW_BOOKMARKS_TOOLBAR) {
        // Update the checkbox next to "Bookmarks Toolbar" (Bookmarks menu)
        setMenuItemChecked(locale.translation('bookmarksToolbar'), action.value)
      }
      break
    case windowConstants.WINDOW_UNDO_CLOSED_FRAME:
      appDispatcher.waitFor([appStore.dispatchToken], () => {
        delete closedFrames[action.frameProps.get('location')]
        createMenu()
      })
      break
    case windowConstants.WINDOW_CLEAR_CLOSED_FRAMES:
      appDispatcher.waitFor([appStore.dispatchToken], () => {
        closedFrames = {}
        createMenu()
      })
      break
    case windowConstants.WINDOW_CLOSE_FRAME:
      appDispatcher.waitFor([appStore.dispatchToken], () => {
        if (!action.frameProps.get('isPrivate') && action.frameProps.get('location') !== 'about:newtab') {
          closedFrames[action.frameProps.get('location')] = action.frameProps
          createMenu()
        }
      })
      break
    case appConstants.APP_ADD_SITE:
      if (action.tag === siteTags.BOOKMARK || action.tag === siteTags.BOOKMARK_FOLDER) {
        appDispatcher.waitFor([appStore.dispatchToken], () => {
          createMenu()
        })
      } else if (action.siteDetail.constructor === Immutable.List && action.tag === undefined) {
        let shouldRebuild = false
        action.siteDetail.forEach((site) => {
          const tag = site.getIn(['tags', 0])
          if (tag === siteTags.BOOKMARK || tag === siteTags.BOOKMARK_FOLDER) {
            shouldRebuild = true
          }
        })
        if (shouldRebuild) {
          appDispatcher.waitFor([appStore.dispatchToken], () => {
            createMenu()
          })
        }
      }
      break
    case appConstants.APP_REMOVE_SITE:
      if (action.tag === siteTags.BOOKMARK || action.tag === siteTags.BOOKMARK_FOLDER) {
        appDispatcher.waitFor([appStore.dispatchToken], () => {
          createMenu()
        })
      }
      break
    case appConstants.APP_CLEAR_HISTORY:
      if (action.tag === siteTags.BOOKMARK) {
        appDispatcher.waitFor([appStore.dispatchToken], () => {
          createMenu()
        })
      }
      break
    case windowConstants.WINDOW_CLICK_MENUBAR_SUBMENU:
      appDispatcher.waitFor([appStore.dispatchToken], () => {
        const clickedMenuItem = menuUtil.getMenuItem(appMenu, action.label)
        if (clickedMenuItem) {
          const focusedWindow = BrowserWindow.getFocusedWindow()
          clickedMenuItem.click(clickedMenuItem, focusedWindow, focusedWindow.webContents)
        }
      })
      break
    default:
  }
}

/**
 * Sets up the menu.
 * @param {Object} appState - Application state. Used to fetch bookmarks and settings (like homepage)
 */
module.exports.init = (appState) => {
  createMenu()
  appDispatcher.register(doAction)
}
