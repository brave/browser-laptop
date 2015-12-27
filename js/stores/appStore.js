/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const AppConstants = require('../constants/appConstants')
const Immutable = require('immutable')
const URL = require('url')
const SiteUtil = require('../state/siteUtil')
const electron = require('electron')
const ipcMain = electron.ipcMain
const messages = require('../constants/messages')
const BrowserWindow = electron.BrowserWindow
const LocalShortcuts = require('../../app/localShortcuts')
const siteHacks = require('../data/siteHacks')

let appState = Immutable.fromJS({
  windows: [],
  sites: [],
  visits: [],
  updateAvailable: false
})

const spawnWindow = () => {
  let mainWindow = new BrowserWindow({
    width: 1360,
    height: 800,
    minWidth: 400,
    // Neither a frame nor a titlebar
    // frame: false,
    // A frame but no title bar and windows buttons in titlebar 10.10 OSX and up only?
    'title-bar-style': 'hidden'
  })

  // pass the appState into the query string for initialization
  // This seems kind of hacky, maybe there is a better way to make
  // sure that the window has the app state before it opens?
  let queryString = 'appState=' + encodeURIComponent(JSON.stringify(appState))

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('file://' + __dirname + '/../../app/index-dev.html?' + queryString)
  } else {
    mainWindow.loadURL('file://' + __dirname + '/../../app/index.html?' + queryString)
  }

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(function (details, cb) {
    let domain = URL.parse(details.url).hostname.split('.').slice(-2).join('.')
    let hack = siteHacks[domain]
    if (hack) {
      cb({ requestHeaders: hack.call(this, details) })
    } else {
      cb({})
    }
  })

  mainWindow.on('closed', function () {
    LocalShortcuts.unregister(mainWindow)
    mainWindow = null
  })

  LocalShortcuts.register(mainWindow)
  return mainWindow
}

class AppStore {
  getState () {
    return appState
  }

  emitChange () {
    ipcMain.emit(messages.APP_STATE_CHANGE, this.getState())
  }
}

const appStore = new AppStore()

const handleAppAction = (action) => {
  switch (action.actionType) {
    case AppConstants.APP_NEW_WINDOW:
      appState = appState.set('windows', appState.get('windows').push(spawnWindow()))
      appStore.emitChange()
      break
    case AppConstants.APP_CLOSE_WINDOW:
      let appWindow = BrowserWindow.fromId(action.appWindowId)
      appWindow.close()

      let windows = appState.get('windows')
      appState = appState.set('windows', windows.delete(windows.indexOf(appWindow)))
      appStore.emitChange()
      break
    case AppConstants.APP_ADD_SITE:
      appState = appState.set('sites', SiteUtil.addSite(appState.get('sites'), action.frameProps, action.tag))
      appStore.emitChange()
      break
    case AppConstants.APP_REMOVE_SITE:
      appState = appState.set('sites', SiteUtil.removeSite(appState.get('sites'), action.frameProps, action.tag))
      appStore.emitChange()
      break
    default:
  }
}

// Register callback to handle all updates
ipcMain.on(messages.APP_ACTION, (event, action) => handleAppAction(action))
process.on(messages.APP_ACTION, handleAppAction)

process.on(messages.UPDATE_AVAILABLE, () => {
  console.log('appStore update-available')
  appState = appState.merge({
    updateAvailable: true
  })
  appStore.emitChange()
})

module.exports = appStore
