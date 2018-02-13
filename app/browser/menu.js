/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const electron = require('electron')
const Menu = electron.Menu
const dialog = electron.dialog
const app = electron.app
const BrowserWindow = electron.BrowserWindow

// Constants
const appConfig = require('../../js/constants/appConfig')
const messages = require('../../js/constants/messages')
const settings = require('../../js/constants/settings')

// State
const tabState = require('../common/state/tabState')
const appStore = require('../../js/stores/appStore')

// Actions
const appActions = require('../../js/actions/appActions')

// Util
const CommonMenu = require('../common/commonMenu')
const {fileUrl} = require('../../js/lib/appUrlUtil')
const menuUtil = require('../common/lib/menuUtil')
const {getSetting} = require('../../js/settings')
const locale = require('../locale')
const platformUtil = require('../common/lib/platformUtil')
const bookmarkUtil = require('../common/lib/bookmarkUtil')
const isDarwin = platformUtil.isDarwin()
const isLinux = platformUtil.isLinux()
const isWindows = platformUtil.isWindows()
const {templateUrls} = require('./share')

let appMenu = null
let closedFrames = new Immutable.OrderedMap()
let currentLocation = null

// Submenu initialization
const createFileSubmenu = () => {
  const submenu = [
    CommonMenu.newTabMenuItem(),
    CommonMenu.newPrivateTabMenuItem(),
    CommonMenu.newTorTabMenuItem(),
    CommonMenu.newPartitionedTabMenuItem(),
    CommonMenu.newWindowMenuItem(),
    CommonMenu.separatorMenuItem,
    {
      label: locale.translation('openFile'),
      accelerator: 'CmdOrCtrl+O',
      click: (item, focusedWindow) => {
        dialog.showDialog(focusedWindow, {
          type: 'select-open-multi-file'
        }, (paths) => {
          if (paths) {
            paths.forEach((path) => {
              appActions.createTabRequested({
                url: fileUrl(path),
                windowId: focusedWindow.id
              })
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
      // This should be disabled when no windows are active.
      label: locale.translation('closeTab'),
      accelerator: 'CmdOrCtrl+W',
      click: function () {
        appActions.tabCloseRequested(tabState.TAB_ID_ACTIVE)
      }
    }, {
      // This should be disabled when no windows are active.
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
      submenu: [
        CommonMenu.simpleShareActiveTabMenuItem('emailPageLink', 'email'),
        CommonMenu.separatorMenuItem,
        CommonMenu.simpleShareActiveTabMenuItem('sharePageLink', 'twitter'),
        CommonMenu.simpleShareActiveTabMenuItem('sharePageLink', 'facebook'),
        CommonMenu.simpleShareActiveTabMenuItem('sharePageLink', 'pinterest'),
        CommonMenu.simpleShareActiveTabMenuItem('sharePageLink', 'googlePlus'),
        CommonMenu.simpleShareActiveTabMenuItem('sharePageLink', 'linkedIn'),
        CommonMenu.simpleShareActiveTabMenuItem('sharePageLink', 'buffer'),
        CommonMenu.simpleShareActiveTabMenuItem('sharePageLink', 'reddit')
      ]
    },
    // Move inside share menu when it's enabled
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
    {
      label: locale.translation('toggleDeveloperTools'),
      accelerator: isDarwin ? 'Cmd+Alt+I' : 'Ctrl+Shift+I',
      click: function () {
        const win = BrowserWindow.getActiveWindow()
        const activeTab = tabState.getActiveTab(appStore.getState(), win.id)
        if (activeTab) {
          appActions.toggleDevTools(activeTab.get('tabId'))
        } else {
          console.warn('Unable to open developer tools; activeTab is null or undefined')
        }
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
          if (i === 0) {
            appActions.loadURLInActiveTabRequested(focusedWindow.id, homepage)
          } else {
            appActions.createTabRequested({
              url: homepage,
              windowId: focusedWindow.id
            })
          }
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
    {
      label: locale.translation('clearBrowsingData'),
      accelerator: 'Shift+CmdOrCtrl+Delete',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_OPEN_CLEAR_BROWSING_DATA_PANEL])
      }
    }
  ]
  const recentlyClosedItems = menuUtil.createRecentlyClosedTemplateItems(closedFrames)
  submenu = submenu.concat(recentlyClosedItems)

  submenu.push(
    CommonMenu.separatorMenuItem,
    CommonMenu.historyMenuItem()
  )

  return submenu
}

const isCurrentLocationBookmarked = (state) => {
  return bookmarkUtil.isLocationBookmarked(state, currentLocation)
}

const createBookmarksSubmenu = (state) => {
  let submenu = [
    {
      label: locale.translation('bookmarkPage'),
      type: 'checkbox',
      accelerator: 'CmdOrCtrl+D',
      checked: isCurrentLocationBookmarked(state),
      click: function (item, focusedWindow) {
        const msg = item.checked
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

  const bookmarks = menuUtil.createBookmarkTemplateItems(state)
  if (bookmarks.length > 0) {
    submenu.push(CommonMenu.separatorMenuItem)
    submenu = submenu.concat(bookmarks)
  }

  const otherBookmarks = menuUtil.createOtherBookmarkTemplateItems(state)
  if (otherBookmarks.length > 0) {
    submenu.push(CommonMenu.separatorMenuItem)
    submenu.push({
      label: locale.translation('otherBookmarks'),
      submenu: otherBookmarks
    })
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
    CommonMenu.extensionsMenuItem(),
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
    CommonMenu.submitFeedbackMenuItem()
  ]

  if (!isDarwin && !isLinux) {
    submenu.push(CommonMenu.separatorMenuItem)
    submenu.push(CommonMenu.checkForUpdateMenuItem())
  }
  if (!isDarwin) {
    submenu.push(CommonMenu.separatorMenuItem)
    submenu.push(CommonMenu.aboutBraveMenuItem())
  }

  return submenu
}

const createDebugSubmenu = (state) => {
  return [
    {
      // Makes future renderer processes pause when they are created until a debugger appears.
      // The console will print a message like: [84790:0710/201431:ERROR:child_process.cc(136)] Renderer (84790) paused waiting for debugger to attach. Send SIGUSR1 to unpause.
      // And this means you should attach Xcode or whatever your debugger is to PID 84790 to unpause.
      // To debug all renderer processes then add the appendSwitch call to app/index.js
      label: 'Append wait renderer switch',
      click: function () {
        app.commandLine.appendSwitch('renderer-startup-dialog')
      }
    }, {
      label: 'Crash main process',
      click: function () {
        process.crash()
      }
    }, {
      label: 'Send memory pressure alert',
      click: function () {
        app.sendMemoryPressureAlert()
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
      label: 'Toggle React profiling',
      accelerator: 'Alt+P',
      click: function (item, focusedWindow) {
        CommonMenu.sendToFocusedWindow(focusedWindow, [messages.DEBUG_REACT_PROFILE])
      }
    }, {
      label: 'Stop reporting window state',
      click: function () {
        const win = BrowserWindow.getActiveWindow()
        appActions.noReportStateModeClicked(win.id)
      }
    }, {
      label: 'Allow manual tab discarding',
      type: 'checkbox',
      checked: !!getSetting(settings.DEBUG_ALLOW_MANUAL_TAB_DISCARD),
      click: function (menuItem, browserWindow, e) {
        appActions.changeSetting(settings.DEBUG_ALLOW_MANUAL_TAB_DISCARD, menuItem.checked)
      }
    }, {
      label: 'Display tab identifiers',
      type: 'checkbox',
      checked: !!getSetting(settings.DEBUG_VERBOSE_TAB_INFO),
      click: function (menuItem, browserWindow, e) {
        appActions.changeSetting(settings.DEBUG_VERBOSE_TAB_INFO, menuItem.checked)
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

const api = {
  init: (state) => {
    const template = [
      { label: locale.translation('file'), submenu: createFileSubmenu() },
      { label: locale.translation('edit'), submenu: createEditSubmenu() },
      { label: locale.translation('view'), submenu: createViewSubmenu() },
      { label: locale.translation('history'), submenu: createHistorySubmenu() },
      { label: locale.translation('bookmarks'), submenu: createBookmarksSubmenu(state) },
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

    if (process.env.NODE_ENV === 'development' || process.env.BRAVE_ENABLE_DEBUG_MENU !== undefined) {
      template.push({ label: 'Debug', submenu: createDebugSubmenu(state) })
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

    if (isWindows) {
      const menuTemplate = JSON.parse(JSON.stringify(template))
      appActions.setMenubarTemplate(Immutable.fromJS(menuTemplate))
    }

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
  },

  getAppMenu: () => {
    return appMenu
  },

  setCurrentLocation: (location) => {
    currentLocation = location
  },

  setMenuItemAttribute: (state, label, key, value) => {
    // Update electron menu (Mac / Linux)
    const systemMenuItem = menuUtil.getMenuItem(appMenu, label)
    systemMenuItem[key] = value

    // Update in-memory menu template (Windows)
    if (isWindows) {
      const oldTemplate = state.getIn(['menu', 'template'])
      const newTemplate = menuUtil.setTemplateItemAttribute(oldTemplate, label, key, value)
      if (newTemplate) {
        appActions.setMenubarTemplate(newTemplate)
      }
    }
  },

  updateRecentlyClosedMenuItems: (state) => {
    // Update electron menu (Mac / Linux)
    menuUtil.updateRecentlyClosedMenuItems(appMenu, closedFrames)
    Menu.setApplicationMenu(appMenu)

    // Update in-memory menu template (Windows)
    if (isWindows) {
      const oldTemplate = state.getIn(['menu', 'template'])
      if (oldTemplate) {
        const historyMenuKey = oldTemplate.findKey(value =>
          value.get('label') === locale.translation('history')
        )
        const newSubmenuTemplate = createHistorySubmenu()
        const newSubmenu = JSON.parse(JSON.stringify(newSubmenuTemplate))
        const newTemplate = oldTemplate.setIn([historyMenuKey, 'submenu'], newSubmenu)
        appActions.setMenubarTemplate(newTemplate)
      }
    }
  },

  updateShareMenuItems: (state, enabled) => {
    for (let key of Object.keys(templateUrls)) {
      const siteName = menuUtil.extractSiteName(key)
      const l10nId = key === 'email' ? 'emailPageLink' : 'sharePageLink'
      const label = locale.translation(l10nId, {siteName: siteName})
      api.setMenuItemAttribute(state, label, 'enabled', enabled)
    }
  }
}

module.exports = api
