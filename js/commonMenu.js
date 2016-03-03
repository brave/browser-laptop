/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConfig = require('./constants/appConfig')
const appActions = require('../js/actions/appActions')
const messages = require('../js/constants/messages')
const Immutable = require('immutable')
const Channel = require('../app/channel')
const path = require('path')

const httpsEverywhere = appConfig.resourceNames.HTTPS_EVERYWHERE
const adblock = appConfig.resourceNames.ADBLOCK
const adInsertion = appConfig.resourceNames.AD_INSERTION
const trackingProtection = appConfig.resourceNames.TRACKING_PROTECTION
const cookieblock = appConfig.resourceNames.COOKIEBLOCK
const settings = require('./constants/settings')
const getSetting = require('./settings').getSetting
const issuesUrl = 'https://github.com/brave/browser-laptop/issues'
const isDarwin = process.platform === 'darwin'

let electron
try {
  electron = require('electron')
} catch (e) {
  electron = global.require('electron')
}

let app
let dialog
let BrowserWindow
if (process.type === 'browser') {
  app = electron.app
  dialog = electron.dialog
  BrowserWindow = electron.BrowserWindow
} else {
  app = electron.remote.app
  dialog = electron.remote.dialog
  BrowserWindow = electron.remote.BrowserWindow
}

const ensureAtLeastOneWindow = (frameOpts) => {
  if (BrowserWindow.getAllWindows().length === 0) {
    appActions.newWindow(frameOpts)
  }
}

/**
 * Sends a message to the web contents of the focused window.
 * @param {Object} focusedWindow the focusedWindow if any
 * @param {Array} message message and arguments to send
 * @return {boolean} whether the message was sent
 */
module.exports.sendToFocusedWindow = (focusedWindow, message) => {
  if (focusedWindow) {
    focusedWindow.webContents.send.apply(focusedWindow.webContents, message)
    return true
  } else {
    return false
  }
}

module.exports.quitMenuItem = {
  label: 'Quit ' + appConfig.name,
  accelerator: 'Command+Q',
  click: app.quit
}

module.exports.newTabMenuItem = {
  label: 'New Tab',
  accelerator: 'CmdOrCtrl+T',
  click: function (item, focusedWindow) {
    if (!module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME])) {
      // no active windows
      appActions.newWindow()
    }
  }
}

module.exports.newPrivateTabMenuItem = {
  label: 'New Private Tab',
  accelerator: 'CmdOrCtrl+Alt+T',
  click: function (item, focusedWindow) {
    ensureAtLeastOneWindow(Immutable.fromJS({ isPrivate: true }))
    module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, undefined, { isPrivate: true }])
  }
}

module.exports.newPartitionedTabMenuItem = {
  label: 'New Session Tab',
  accelerator: 'CmdOrCtrl+Alt+S',
  click: function (item, focusedWindow) {
    ensureAtLeastOneWindow(Immutable.fromJS({ isPartitioned: true }))
    module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, undefined, { isPartitioned: true }])
  }
}

module.exports.newWindowMenuItem = {
  label: 'New Window',
  accelerator: 'CmdOrCtrl+N',
  click: () => appActions.newWindow()
}

module.exports.reopenLastClosedTabItem = {
  label: 'Reopen Last Closed Tab',
  accelerator: 'Shift+CmdOrCtrl+T',
  click: function (item, focusedWindow) {
    module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_UNDO_CLOSED_FRAME])
  }
}

module.exports.separatorMenuItem = {
  type: 'separator'
}

module.exports.printMenuItem = {
  label: 'Print...',
  accelerator: 'CmdOrCtrl+P',
  click: function (item, focusedWindow) {
    module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_PRINT])
  }
}

module.exports.findOnPageMenuItem = {
  label: 'Find on page...',
  accelerator: 'CmdOrCtrl+F',
  click: function (item, focusedWindow) {
    module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_ACTIVE_FRAME_SHOW_FINDBAR])
  }
}

module.exports.checkForUpdateMenuItem = {
  label: 'Check for updates...',
  click: function (item, focusedWindow) {
    if (process.type === 'browser') {
      ensureAtLeastOneWindow()
      process.emit(messages.CHECK_FOR_UPDATE)
    } else {
      electron.ipcRenderer.send(messages.CHECK_FOR_UPDATE)
    }
  }
}

module.exports.preferencesMenuItem = {
  label: 'Preferences...',
  accelerator: 'CmdOrCtrl+,',
  click: (item, focusedWindow) => {
    if (BrowserWindow.getAllWindows().length === 0) {
      appActions.newWindow(Immutable.fromJS({
        location: 'about:preferences'
      }))
    } else {
      module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, 'about:preferences', { singleFrame: true }])
    }
  }
}

module.exports.bookmarksMenuItem = {
  label: 'Bookmarks manager...',
  accelerator: isDarwin ? 'CmdOrCtrl+Alt+B' : 'Ctrl+Shift+O',
  click: (item, focusedWindow) => {
    if (BrowserWindow.getAllWindows().length === 0) {
      appActions.newWindow(Immutable.fromJS({
        location: 'about:bookmarks'
      }))
    } else {
      module.exports.sendToFocusedWindow(focusedWindow, [messages.SHORTCUT_NEW_FRAME, 'about:bookmarks', { singleFrame: true }])
    }
  }
}

module.exports.reportAnIssueMenuItem = {
  label: 'Report an issue',
  click: function (item, focusedWindow) {
    module.exports.sendToFocusedWindow(focusedWindow,
      [messages.SHORTCUT_NEW_FRAME, issuesUrl])
  }
}

module.exports.submitFeedbackMenuItem = {
  label: 'Submit Feedback...',
  click: function (item, focusedWindow) {
    module.exports.sendToFocusedWindow(focusedWindow,
      [messages.SHORTCUT_NEW_FRAME, appConfig.contactUrl])
  }
}

module.exports.bookmarksToolbarMenuItem = () => {
  const showBookmarksToolbar = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)
  return {
    label: 'Bookmarks Toolbar',
    type: 'checkbox',
    checked: showBookmarksToolbar,
    click: (item, focusedWindow) => {
      appActions.changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, !showBookmarksToolbar)
    }
  }
}

module.exports.aboutBraveMenuItem = {
  label: 'About ' + appConfig.name,
  click: (item, focusedWindow) => {
    dialog.showMessageBox({
      title: 'Brave',
      message: 'Version: ' + app.getVersion() + '\n' +
        'Electron: ' + process.versions['atom-shell'] + '\n' +
        'libchromiumcontent: ' + process.versions['chrome'] + '\n' +
        'Channel: ' + Channel.channel(),
      icon: path.join(__dirname, '..', 'app', 'img', 'braveBtn3x.png'),
      buttons: ['Ok']
    })
  }
}

module.exports.buildBraveryMenu = function (settings, init) {
  const replaceAds = settings[adInsertion] || false
  const blockAds = settings[adblock] || false
  const blockTracking = settings[trackingProtection] || false
  const blockCookies = settings[cookieblock] || false
  const useHttps = settings[httpsEverywhere] || false
  return {
    label: 'Bravery',
    submenu: [
      {
        type: 'radio',
        label: 'Replace ads',
        checked: blockAds && replaceAds && blockTracking,
        click: function (item, focusedWindow) {
          appActions.setResourceEnabled(adblock, true)
          appActions.setResourceEnabled(adInsertion, true)
          appActions.setResourceEnabled(trackingProtection, true)
          init()
        }
      }, {
        type: 'radio',
        label: 'Block ads',
        checked: blockAds && !replaceAds && blockTracking,
        click: function (item, focusedWindow) {
          appActions.setResourceEnabled(adblock, true)
          appActions.setResourceEnabled(adInsertion, false)
          appActions.setResourceEnabled(trackingProtection, true)
          init()
        }
      }, {
        type: 'radio',
        label: 'Allow ads and tracking',
        checked: !blockAds && !replaceAds && !blockTracking,
        click: function (item, focusedWindow) {
          appActions.setResourceEnabled(adblock, false)
          appActions.setResourceEnabled(adInsertion, false)
          appActions.setResourceEnabled(trackingProtection, false)
          init()
        }
      },
      module.exports.separatorMenuItem,
      {
        type: 'checkbox',
        label: 'Block 3rd party cookies',
        checked: blockCookies,
        click: function (item, focusedWindow) {
          appActions.setResourceEnabled(cookieblock, !blockCookies)
          init()
        }
      }, {
        type: 'checkbox',
        label: 'Block Popups',
        enabled: false,
        checked: true
      }, {
        type: 'checkbox',
        label: 'HTTPS Everywhere',
        checked: useHttps,
        click: function (item, focusedWindow) {
          appActions.setResourceEnabled(httpsEverywhere, !useHttps)
          init()
        }
      }
    ]
  }
}
