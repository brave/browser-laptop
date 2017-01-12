/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const appConstants = require('../constants/appConstants')
const windowConstants = require('../constants/windowConstants')
const ExtensionConstants = require('../../app/common/constants/extensionConstants')
const AppDispatcher = require('../dispatcher/appDispatcher')
const appConfig = require('../constants/appConfig')
const settings = require('../constants/settings')
const siteUtil = require('../state/siteUtil')
const siteSettings = require('../state/siteSettings')
const appUrlUtil = require('../lib/appUrlUtil')
const electron = require('electron')
const app = electron.app
const ipcMain = electron.ipcMain
const messages = require('../constants/messages')
const UpdateStatus = require('../constants/updateStatus')
const BrowserWindow = electron.BrowserWindow
const LocalShortcuts = require('../../app/localShortcuts')
const appActions = require('../actions/appActions')
const syncActions = require('../actions/syncActions')
const firstDefinedValue = require('../lib/functional').firstDefinedValue
const dates = require('../../app/dates')
const getSetting = require('../settings').getSetting
const EventEmitter = require('events').EventEmitter
const Immutable = require('immutable')
const diff = require('immutablediff')
const debounce = require('../lib/debounce')
const locale = require('../../app/locale')
const path = require('path')
const autofill = require('../../app/autofill')
const nativeImage = require('../../app/nativeImage')
const Filtering = require('../../app/filtering')
const basicAuth = require('../../app/browser/basicAuth')
const windows = require('../../app/browser/windows')
const assert = require('assert')

// state helpers
const basicAuthState = require('../../app/common/state/basicAuthState')
const extensionState = require('../../app/common/state/extensionState')
const aboutNewTabState = require('../../app/common/state/aboutNewTabState')
const aboutHistoryState = require('../../app/common/state/aboutHistoryState')
const windowState = require('../../app/common/state/windowState')

const webtorrent = require('../../app/browser/webtorrent')

const isDarwin = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

// Only used internally
const CHANGE_EVENT = 'app-state-change'

const defaultProtocols = ['https', 'http']

let appState
let lastEmittedState
let shuttingDown = false

// TODO cleanup all this createWindow crap
function isModal (browserOpts) {
  // this needs some better checks
  return browserOpts.scrollbars === false
}

const navbarHeight = () => {
  // TODO there has to be a better way to get this or at least add a test
  return 75
}

/**
 * Determine window dimensions (width / height)
 */
const setWindowDimensions = (browserOpts, defaults, windowState) => {
  if (windowState.ui && windowState.ui.size) {
    browserOpts.width = firstDefinedValue(browserOpts.width, windowState.ui.size[0])
    browserOpts.height = firstDefinedValue(browserOpts.height, windowState.ui.size[1])
  }
  browserOpts.width = firstDefinedValue(browserOpts.width, browserOpts.innerWidth, defaults.width)
  // height and innerHeight are the frame webview size
  browserOpts.height = firstDefinedValue(browserOpts.height, browserOpts.innerHeight)
  if (typeof browserOpts.height === 'number') {
    // add navbar height to get total height for BrowserWindow
    browserOpts.height = browserOpts.height + navbarHeight()
  } else {
    // no inner height so check outer height or use default
    browserOpts.height = firstDefinedValue(browserOpts.outerHeight, defaults.height)
  }
  return browserOpts
}

/**
 * Determine window position (x / y)
 */
const setWindowPosition = (browserOpts, defaults, windowState) => {
  if (windowState.ui && windowState.ui.position) {
    // Position comes from window state
    browserOpts.x = firstDefinedValue(browserOpts.x, windowState.ui.position[0])
    browserOpts.y = firstDefinedValue(browserOpts.y, windowState.ui.position[1])
  } else if (typeof defaults.x === 'number' && typeof defaults.y === 'number') {
    // Position comes from the default position
    browserOpts.x = firstDefinedValue(browserOpts.x, defaults.x)
    browserOpts.y = firstDefinedValue(browserOpts.y, defaults.y)
  } else {
    // Default the position
    browserOpts.x = firstDefinedValue(browserOpts.x, browserOpts.left, browserOpts.screenX)
    browserOpts.y = firstDefinedValue(browserOpts.y, browserOpts.top, browserOpts.screenY)
  }
  return browserOpts
}

const createWindow = (browserOpts, defaults, frameOpts, windowState) => {
  browserOpts = setWindowDimensions(browserOpts, defaults, windowState)
  browserOpts = setWindowPosition(browserOpts, defaults, windowState)

  delete browserOpts.left
  delete browserOpts.top

  const screen = electron.screen
  const primaryDisplay = screen.getPrimaryDisplay()
  const parentWindowKey = browserOpts.parentWindowKey
  const parentWindow = parentWindowKey ? BrowserWindow.fromId(parentWindowKey) : BrowserWindow.getFocusedWindow()
  const bounds = parentWindow ? parentWindow.getBounds() : primaryDisplay.bounds

  // position on screen should be relative to focused window
  // or the primary display if there is no focused window
  const display = screen.getDisplayNearestPoint(bounds)

  // if no parentWindow, x, y or center is defined then go ahead
  // and center it if it's smaller than the display width
  // typeof and isNaN are used because 0 is falsey
  if (!(parentWindow ||
      browserOpts.center === false ||
      browserOpts.x > 0 ||
      browserOpts.y > 0) &&
      browserOpts.width < display.bounds.width) {
    browserOpts.center = true
  } else {
    browserOpts.center = false
    // don't offset if focused window is at least as big as the screen it's on
    if (bounds.width >= display.bounds.width && bounds.height >= display.bounds.height) {
      browserOpts.x = firstDefinedValue(browserOpts.x, display.bounds.x)
      browserOpts.y = firstDefinedValue(browserOpts.y, display.bounds.y)
    } else {
      browserOpts.x = firstDefinedValue(browserOpts.x, bounds.x + defaults.windowOffset)
      browserOpts.y = firstDefinedValue(browserOpts.y, bounds.y + defaults.windowOffset)
    }

    // make sure the browser won't be outside the viewable area of any display
    // negative numbers aren't allowed so we don't need to worry about that
    const displays = screen.getAllDisplays()
    const maxX = Math.max(...displays.map((display) => { return display.bounds.x + display.bounds.width }))
    const maxY = Math.max(...displays.map((display) => { return display.bounds.y + display.bounds.height }))

    browserOpts.x = Math.min(browserOpts.x, maxX - defaults.windowOffset)
    browserOpts.y = Math.min(browserOpts.y, maxY - defaults.windowOffset)
  }

  const minWidth = isModal(browserOpts) ? defaults.minModalWidth : defaults.minWidth
  const minHeight = isModal(browserOpts) ? defaults.minModalHeight : defaults.minHeight

  // min width and height don't seem to work when the window is first created
  browserOpts.width = browserOpts.width < minWidth ? minWidth : browserOpts.width
  browserOpts.height = browserOpts.height < minHeight ? minHeight : browserOpts.height

  const autoHideMenuBarSetting = isDarwin || getSetting(settings.AUTO_HIDE_MENU)

  const windowProps = {
    // smaller min size for "modal" windows
    minWidth,
    minHeight,
    // Neither a frame nor a titlebar
    // frame: false,
    // A frame but no title bar and windows buttons in titlebar 10.10 OSX and up only?
    titleBarStyle: 'hidden-inset',
    autoHideMenuBar: autoHideMenuBarSetting,
    title: appConfig.name,
    webPreferences: defaults.webPreferences,
    frame: !isWindows
  }

  if (process.platform === 'linux') {
    windowProps.icon = path.join(__dirname, '..', '..', 'res', 'app.png')
  }

  let mainWindow = new BrowserWindow(Object.assign(windowProps, browserOpts))

  mainWindow.setMenuBarVisibility(true)

  if (windowState.ui && windowState.ui.isMaximized) {
    mainWindow.maximize()
  }

  if (windowState.ui && windowState.ui.isFullScreen) {
    mainWindow.setFullScreen(true)
  }

  mainWindow.on('close', function () {
    LocalShortcuts.unregister(mainWindow)
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  mainWindow.on('scroll-touch-begin', function (e) {
    mainWindow.webContents.send('scroll-touch-begin')
  })

  mainWindow.on('scroll-touch-end', function (e) {
    mainWindow.webContents.send('scroll-touch-end')
  })

  mainWindow.on('scroll-touch-edge', function (e) {
    mainWindow.webContents.send('scroll-touch-edge')
  })

  mainWindow.on('enter-full-screen', function () {
    if (mainWindow.isMenuBarVisible()) {
      mainWindow.setMenuBarVisibility(false)
    }
  })

  mainWindow.on('leave-full-screen', function () {
    mainWindow.webContents.send(messages.LEAVE_FULL_SCREEN)

    if (getSetting(settings.AUTO_HIDE_MENU) === false) {
      mainWindow.setMenuBarVisibility(true)
    }
  })

  mainWindow.on('app-command', function (e, cmd) {
    switch (cmd) {
      case 'browser-backward':
        mainWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_BACK)
        return
      case 'browser-forward':
        mainWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_FORWARD)
        return
    }
  })

  LocalShortcuts.register(mainWindow)
  return mainWindow
}

class AppStore extends EventEmitter {
  getState () {
    return appState
  }

  emitFullWindowState (wnd) {
    wnd.webContents.send(messages.APP_STATE_CHANGE, { state: appState.toJS() })
    lastEmittedState = appState
  }

  emitChanges (emitFullState) {
    if (lastEmittedState) {
      const d = diff(lastEmittedState, appState)
      if (!d.isEmpty()) {
        BrowserWindow.getAllWindows().forEach((wnd) =>
          wnd.webContents.send(messages.APP_STATE_CHANGE, { stateDiff: d.toJS() }))
        lastEmittedState = appState
        this.emit(CHANGE_EVENT, d.toJS())
      }
    } else {
      this.emit(CHANGE_EVENT, [])
    }
  }

  addChangeListener (callback) {
    this.on(CHANGE_EVENT, callback)
  }

  removeChangeListener (callback) {
    this.removeListener(CHANGE_EVENT, callback)
  }
}

function windowDefaults () {
  setDefaultWindowSize()

  return {
    show: false,
    width: appState.getIn(['defaultWindowParams', 'width']) || appState.get('defaultWindowWidth'),
    height: appState.getIn(['defaultWindowParams', 'height']) || appState.get('defaultWindowHeight'),
    x: appState.getIn(['defaultWindowParams', 'x']) || undefined,
    y: appState.getIn(['defaultWindowParams', 'y']) || undefined,
    minWidth: 480,
    minHeight: 300,
    minModalHeight: 100,
    minModalWidth: 100,
    windowOffset: 20,
    webPreferences: {
      sharedWorker: true,
      nodeIntegration: false,
      partition: 'default',
      webSecurity: false,
      allowFileAccessFromFileUrls: true,
      allowUniversalAccessFromFileUrls: true
    }
  }
}

/**
 * set the default width and height if they
 * haven't been initialized yet
 */
function setDefaultWindowSize () {
  if (!appState) {
    return
  }
  const screen = electron.screen
  const primaryDisplay = screen.getPrimaryDisplay()
  if (!appState.getIn(['defaultWindowParams', 'width']) && !appState.get('defaultWindowWidth') &&
      !appState.getIn(['defaultWindowParams', 'height']) && !appState.get('defaultWindowHeight')) {
    appState = appState.setIn(['defaultWindowParams', 'width'], primaryDisplay.workAreaSize.width)
    appState = appState.setIn(['defaultWindowParams', 'height'], primaryDisplay.workAreaSize.height)
  }
}

const appStore = new AppStore()
const emitChanges = debounce(appStore.emitChanges.bind(appStore), 5)

/**
 * Clears out the top X non tagged sites.
 * This is debounced to every 1 minute, the cleanup is not particularly intensive
 * but there's no point to cleanup frequently.
 */
const filterOutNonRecents = debounce(() => {
  appState = appState.set('sites', siteUtil.filterOutNonRecents(appState.get('sites')))
  emitChanges()
}, 60 * 1000)

/**
 * Useful for updating non-react preferences (electron properties, etc).
 * Called when any settings are modified (ex: via preferences).
 */
function handleChangeSettingAction (settingKey, settingValue) {
  switch (settingKey) {
    case settings.AUTO_HIDE_MENU:
      BrowserWindow.getAllWindows().forEach(function (wnd) {
        wnd.setAutoHideMenuBar(settingValue)
        wnd.setMenuBarVisibility(!settingValue)
      })
      break
    case settings.DEFAULT_ZOOM_LEVEL:
      Filtering.setDefaultZoomLevel(settingValue)
      break
    default:
  }
}

const applyReducers = (state, action) => [
  require('../../app/browser/reducers/downloadsReducer'),
  require('../../app/browser/reducers/flashReducer'),
  require('../../app/browser/reducers/tabsReducer'),
  require('../../app/browser/reducers/spellCheckReducer'),
  require('../../app/browser/reducers/clipboardReducer')
].reduce(
    (appState, reducer) => {
      const newState = reducer(appState, action)
      assert.ok(action.actionType === appConstants.APP_SET_STATE || Immutable.Map.isMap(newState),
        `Oops! action ${action.actionType} didn't return valid state for reducer:\n\n${reducer}`)
      return newState
    }, appState)

const handleAppAction = (action) => {
  if (shuttingDown) {
    return
  }

  const ledger = require('../../app/ledger')

  appState = applyReducers(appState, action)

  switch (action.actionType) {
    case appConstants.APP_SET_STATE:
      appState = action.appState
      appState = Filtering.init(appState, action, appStore)
      appState = windows.init(appState, action, appStore)
      appState = basicAuth.init(appState, action, appStore)
      appState = webtorrent.init(appState, action, appStore)
      break
    case appConstants.APP_SHUTTING_DOWN:
      shuttingDown = true
      break
    case appConstants.APP_NEW_WINDOW:
      const frameOpts = (action.frameOpts && action.frameOpts.toJS()) || {}
      const browserOpts = (action.browserOpts && action.browserOpts.toJS()) || {}
      const newWindowState = action.restoredState || {}

      const mainWindow = createWindow(browserOpts, windowDefaults(), frameOpts, newWindowState)
      const homepageSetting = getSetting(settings.HOMEPAGE)

      // initialize frames state
      let frames = []
      if (frameOpts) {
        if (frameOpts.forEach) {
          frames = frameOpts
        } else {
          frames.push(frameOpts)
        }
      } else if (getSetting(settings.STARTUP_MODE) === 'homePage' && homepageSetting) {
        frames = homepageSetting.split('|').map((homepage) => {
          return {
            location: homepage
          }
        })
      }

      mainWindow.webContents.on('did-finish-load', (e) => {
        lastEmittedState = appState
        e.sender.send(messages.INITIALIZE_WINDOW, frameOpts.disposition, appState.toJS(), frames, action.restoredState)
        if (action.cb) {
          action.cb()
        }
      })
      mainWindow.webContents.on('crashed', (e) => {
        console.error('Window crashed. Reloading...')
        mainWindow.loadURL(appUrlUtil.getBraveExtIndexHTML())

        ipcMain.on(messages.NOTIFICATION_RESPONSE, function notificationResponseCallback (e, message, buttonIndex, persist) {
          if (message === locale.translation('unexpectedErrorWindowReload')) {
            appActions.hideMessageBox(message)
            ipcMain.removeListener(messages.NOTIFICATION_RESPONSE, notificationResponseCallback)
          }
        })

        appActions.showMessageBox({
          buttons: [
            {text: locale.translation('ok')}
          ],
          options: {
            persist: false
          },
          message: locale.translation('unexpectedErrorWindowReload')
        })
      })
      mainWindow.loadURL(appUrlUtil.getBraveExtIndexHTML())
      mainWindow.show()
      break
    case appConstants.APP_CLOSE_WINDOW:
      appState = windows.closeWindow(appState, action)
      break
    case appConstants.APP_WINDOW_CLOSED:
      appState = windowState.removeWindow(appState, action)
      break
    case appConstants.APP_WINDOW_CREATED:
      appState = windowState.maybeCreateWindow(appState, action)
      break
    case appConstants.APP_WINDOW_UPDATED:
      appState = windowState.maybeCreateWindow(appState, action)
      break
    case appConstants.APP_ADD_PASSWORD:
      // If there is already an entry for this exact origin, action, and
      // username if it exists, update the password instead of creating a new entry
      let passwords = appState.get('passwords').filterNot((pw) => {
        return pw.get('origin') === action.passwordDetail.origin &&
          pw.get('action') === action.passwordDetail.action &&
          (!pw.get('username') || pw.get('username') === action.passwordDetail.username)
      })
      appState = appState.set('passwords', passwords.push(Immutable.fromJS(action.passwordDetail)))
      break
    case appConstants.APP_REMOVE_PASSWORD:
      appState = appState.set('passwords', appState.get('passwords').filterNot((pw) => {
        return Immutable.is(pw, Immutable.fromJS(action.passwordDetail))
      }))
      break
    case appConstants.APP_CLEAR_PASSWORDS:
      appState = appState.set('passwords', new Immutable.List())
      break
    case appConstants.APP_CHANGE_NEW_TAB_DETAIL:
      appState = aboutNewTabState.mergeDetails(appState, action)
      if (action.refresh) {
        appState = aboutNewTabState.setSites(appState, action)
      }
      break
    case appConstants.APP_POPULATE_HISTORY:
      appState = aboutHistoryState.setHistory(appState, action)
      break
    case appConstants.APP_DATA_URL_COPIED:
      nativeImage.copyDataURL(action.dataURL, action.html, action.text)
      break
    case appConstants.APP_ADD_SITE:
      const oldSiteSize = appState.get('sites').size
      const addSiteSyncCallback = action.skipSync ? undefined : syncActions.updateSite
      if (action.siteDetail.constructor === Immutable.List) {
        action.siteDetail.forEach((s) => {
          appState = appState.set('sites', siteUtil.addSite(appState.get('sites'), s, action.tag, undefined, addSiteSyncCallback))
        })
      } else {
        appState = appState.set('sites', siteUtil.addSite(appState.get('sites'), action.siteDetail, action.tag, action.originalSiteDetail, addSiteSyncCallback))
      }
      if (action.destinationDetail) {
        appState = appState.set('sites', siteUtil.moveSite(appState.get('sites'), action.siteDetail, action.destinationDetail, false, false, true))
      }
      // If there was an item added then clear out the old history entries
      if (oldSiteSize !== appState.get('sites').size) {
        filterOutNonRecents()
      }
      appState = aboutNewTabState.setSites(appState, action)
      appState = aboutHistoryState.setHistory(appState, action)
      break
    case appConstants.APP_REMOVE_SITE:
      const removeSiteSyncCallback = action.skipSync ? undefined : syncActions.removeSite
      appState = appState.set('sites', siteUtil.removeSite(appState.get('sites'), action.siteDetail, action.tag, removeSiteSyncCallback))
      appState = aboutNewTabState.setSites(appState, action)
      appState = aboutHistoryState.setHistory(appState, action)
      break
    case appConstants.APP_MOVE_SITE:
      appState = appState.set('sites', siteUtil.moveSite(appState.get('sites'), action.sourceDetail, action.destinationDetail, action.prepend, action.destinationIsParent, false, syncActions.updateSite))
      break
    case appConstants.APP_CLEAR_HISTORY:
      appState = appState.set('sites',
        siteUtil.clearHistory(appState.get('sites'), syncActions.updateSite))
      appState = aboutNewTabState.setSites(appState, action)
      appState = aboutHistoryState.setHistory(appState, action)
      syncActions.clearHistory()
      break
    case appConstants.APP_DEFAULT_WINDOW_PARAMS_CHANGED:
      if (action.size && action.size.size === 2) {
        appState = appState.setIn(['defaultWindowParams', 'width'], action.size.get(0))
        appState = appState.setIn(['defaultWindowParams', 'height'], action.size.get(1))
      }
      if (action.position && action.position.size === 2) {
        appState = appState.setIn(['defaultWindowParams', 'x'], action.position.get(0))
        appState = appState.setIn(['defaultWindowParams', 'y'], action.position.get(1))
      }
      break
    case appConstants.APP_SET_DATA_FILE_ETAG:
      appState = appState.setIn([action.resourceName, 'etag'], action.etag)
      break
    case appConstants.APP_UPDATE_LAST_CHECK:
      appState = appState.setIn(['updates', 'lastCheckTimestamp'], (new Date()).getTime())
      appState = appState.setIn(['updates', 'lastCheckYMD'], dates.todayYMD())
      appState = appState.setIn(['updates', 'lastCheckWOY'], dates.todayWOY())
      appState = appState.setIn(['updates', 'lastCheckMonth'], dates.todayMonth())
      appState = appState.setIn(['updates', 'firstCheckMade'], true)
      break
    case appConstants.APP_SET_UPDATE_STATUS:
      if (action.status !== undefined) {
        appState = appState.setIn(['updates', 'status'], action.status)
      }
      // Auto reset back to false because it'll be set to true on each new check
      if (action.verbose !== undefined) {
        appState = appState.setIn(['updates', 'verbose'], action.verbose)
      }
      if (action.metadata !== undefined) {
        appState = appState.setIn(['updates', 'metadata'], action.metadata)
      }
      if (action.status === UpdateStatus.UPDATE_APPLYING_RESTART) {
        app.quit()
      }
      break
    case appConstants.APP_SET_RESOURCE_ENABLED:
      appState = appState.setIn([action.resourceName, 'enabled'], action.enabled)
      break
    case appConstants.APP_RESOURCE_READY:
      appState = appState.setIn([action.resourceName, 'ready'], true)
      break
    case appConstants.APP_ADD_RESOURCE_COUNT:
      const oldCount = appState.getIn([action.resourceName, 'count']) || 0
      appState = appState.setIn([action.resourceName, 'count'], oldCount + action.count)
      break
    case appConstants.APP_SET_DATA_FILE_LAST_CHECK:
      appState = appState.mergeIn([action.resourceName], {
        lastCheckVersion: action.lastCheckVersion,
        lastCheckDate: action.lastCheckDate
      })
      break
    case appConstants.APP_CHANGE_SETTING:
      appState = appState.setIn(['settings', action.key], action.value)
      handleChangeSettingAction(action.key, action.value)
      break
    case appConstants.APP_ALLOW_FLASH_ONCE:
      {
        const propertyName = action.isPrivate ? 'temporarySiteSettings' : 'siteSettings'
        console.log(siteUtil.getOrigin(action.url))
        console.log(propertyName)
        appState = appState.set(propertyName,
          siteSettings.mergeSiteSetting(appState.get(propertyName), siteUtil.getOrigin(action.url), 'flash', 1))
        break
      }
    case appConstants.APP_ALLOW_FLASH_ALWAYS:
      {
        const propertyName = action.isPrivate ? 'temporarySiteSettings' : 'siteSettings'
        const expirationTime = Date.now() + 7 * 24 * 3600 * 1000
        appState = appState.set(propertyName,
          siteSettings.mergeSiteSetting(appState.get(propertyName), siteUtil.getOrigin(action.url), 'flash', expirationTime))
        break
      }
    case appConstants.APP_CHANGE_SITE_SETTING:
      {
        let propertyName = action.temporary ? 'temporarySiteSettings' : 'siteSettings'
        let newSiteSettings = siteSettings.mergeSiteSetting(appState.get(propertyName), action.hostPattern, action.key, action.value)
        if (!action.temporary) {
          let syncObject = siteUtil.setObjectId(newSiteSettings.get(action.hostPattern))
          syncActions.updateSiteSetting(action.hostPattern, syncObject)
          newSiteSettings = newSiteSettings.set(action.hostPattern, syncObject)
        }
        appState = appState.set(propertyName, newSiteSettings)
        break
      }
    case appConstants.APP_REMOVE_SITE_SETTING:
      {
        let propertyName = action.temporary ? 'temporarySiteSettings' : 'siteSettings'
        let newSiteSettings = siteSettings.removeSiteSetting(appState.get(propertyName),
          action.hostPattern, action.key)
        if (!action.temporary) {
          let syncObject = siteUtil.setObjectId(newSiteSettings.get(action.hostPattern))
          syncActions.updateSiteSetting(action.hostPattern, syncObject)
          newSiteSettings = newSiteSettings.set(action.hostPattern, syncObject)
        }
        appState = appState.set(propertyName, newSiteSettings)
        break
      }
    case appConstants.APP_CLEAR_SITE_SETTINGS:
      {
        let propertyName = action.temporary ? 'temporarySiteSettings' : 'siteSettings'
        let newSiteSettings = new Immutable.Map()
        appState.get(propertyName).map((entry, hostPattern) => {
          let newEntry = entry.delete(action.key)
          newSiteSettings = newSiteSettings.set(hostPattern, newEntry)
          if (entry.get('objectId')) {
            syncActions.updateSiteSetting(hostPattern, newEntry)
          }
        })
        appState = appState.set(propertyName, newSiteSettings)
        break
      }
    case appConstants.APP_UPDATE_LEDGER_INFO:
      appState = appState.set('ledgerInfo', Immutable.fromJS(action.ledgerInfo))
      break
    case appConstants.APP_UPDATE_PUBLISHER_INFO:
      appState = appState.set('publisherInfo', Immutable.fromJS(action.publisherInfo))
      break
    case appConstants.APP_SHOW_MESSAGE_BOX:
      let notifications = appState.get('notifications')
      notifications = notifications.filterNot((notification) => {
        let message = notification.get('message')
        // action.detail is a regular mutable object only when running tests
        return action.detail.get
          ? message === action.detail.get('message')
          : message === action.detail['message']
      })

      // Insert notification next to those with the same style, or at the end
      let insertIndex = notifications.size
      const style = action.detail.get
        ? action.detail.get('options').get('style')
        : action.detail['options']['style']
      if (style) {
        const styleIndex = notifications.findLastIndex((notification) => {
          return notification.get('options').get('style') === style
        })
        if (styleIndex > -1) {
          insertIndex = styleIndex
        } else {
          // Insert after the last notification with a style
          insertIndex = notifications.findLastIndex((notification) => {
            return typeof notification.get('options').get('style') === 'string'
          }) + 1
        }
      }
      notifications = notifications.insert(insertIndex, Immutable.fromJS(action.detail))
      appState = appState.set('notifications', notifications)
      break
    case appConstants.APP_HIDE_MESSAGE_BOX:
      appState = appState.set('notifications', appState.get('notifications').filterNot((notification) => {
        return notification.get('message') === action.message
      }))
      break
    case appConstants.APP_CLEAR_MESSAGE_BOXES:
      appState = appState.set('notifications', appState.get('notifications').filterNot((notification) => {
        return notification.get('frameOrigin') === action.origin
      }))
      break
    case appConstants.APP_ADD_WORD:
      let listType = 'ignoredWords'
      if (action.learn) {
        listType = 'addedWords'
      }
      const path = ['dictionary', listType]
      let wordList = appState.getIn(path)
      if (!wordList.includes(action.word)) {
        appState = appState.setIn(path, wordList.push(action.word))
      }
      break
    case appConstants.APP_SET_DICTIONARY:
      appState = appState.setIn(['dictionary', 'locale'], action.locale)
      break
    case appConstants.APP_BACKUP_KEYS:
      appState = ledger.backupKeys(appState, action)
      break
    case appConstants.APP_RECOVER_WALLET:
      appState = ledger.recoverKeys(appState, action)
      break
    case appConstants.APP_LEDGER_RECOVERY_SUCCEEDED:
      appState = appState.setIn(['ui', 'about', 'preferences', 'recoverySucceeded'], true)
      break
    case appConstants.APP_LEDGER_RECOVERY_FAILED:
      appState = appState.setIn(['ui', 'about', 'preferences', 'recoverySucceeded'], false)
      break
    case appConstants.APP_CLEAR_RECOVERY:
      appState = appState.setIn(['ui', 'about', 'preferences', 'recoverySucceeded'], undefined)
      break
    case appConstants.APP_ON_CLEAR_BROWSING_DATA:
      // TODO: Maybe make storing this state optional?
      appState = appState.set('clearBrowsingDataDefaults', action.clearDataDetail)
      if (action.clearDataDetail.get('browserHistory')) {
        handleAppAction({actionType: appConstants.APP_CLEAR_HISTORY})
        BrowserWindow.getAllWindows().forEach((wnd) => wnd.webContents.send(messages.CLEAR_CLOSED_FRAMES))
      }
      if (action.clearDataDetail.get('downloadHistory')) {
        handleAppAction({actionType: appConstants.APP_CLEAR_COMPLETED_DOWNLOADS})
      }
      // Site cookies clearing should also clear cache so that evercookies will be properly removed
      if (action.clearDataDetail.get('cachedImagesAndFiles') || action.clearDataDetail.get('allSiteCookies')) {
        const Filtering = require('../../app/filtering')
        Filtering.clearCache()
      }
      if (action.clearDataDetail.get('savedPasswords')) {
        handleAppAction({actionType: appConstants.APP_CLEAR_PASSWORDS})
      }
      if (action.clearDataDetail.get('allSiteCookies')) {
        const Filtering = require('../../app/filtering')
        Filtering.clearStorageData()
      }
      if (action.clearDataDetail.get('autocompleteData')) {
        autofill.clearAutocompleteData()
      }
      if (action.clearDataDetail.get('autofillData')) {
        autofill.clearAutofillData()
      }
      if (action.clearDataDetail.get('savedSiteSettings')) {
        appState = appState.set('siteSettings', Immutable.Map())
        appState = appState.set('temporarySiteSettings', Immutable.Map())
        syncActions.clearSiteSettings()
      }
      break
    case appConstants.APP_IMPORT_BROWSER_DATA:
      {
        const importer = require('../../app/importer')
        if (action.selected.get('type') === 5) {
          if (action.selected.get('favorites')) {
            importer.importHTML(action.selected)
          }
        } else {
          importer.importData(action.selected)
        }
        break
      }
    case appConstants.APP_ADD_AUTOFILL_ADDRESS:
      autofill.addAutofillAddress(action.detail.toJS(),
        action.originalDetail.get('guid') === undefined ? '-1' : action.originalDetail.get('guid'))
      break
    case appConstants.APP_REMOVE_AUTOFILL_ADDRESS:
      autofill.removeAutofillAddress(action.detail.get('guid'))
      break
    case appConstants.APP_ADD_AUTOFILL_CREDIT_CARD:
      autofill.addAutofillCreditCard(action.detail.toJS(),
        action.originalDetail.get('guid') === undefined ? '-1' : action.originalDetail.get('guid'))
      break
    case appConstants.APP_REMOVE_AUTOFILL_CREDIT_CARD:
      autofill.removeAutofillCreditCard(action.detail.get('guid'))
      break
    case appConstants.APP_AUTOFILL_DATA_CHANGED:
      const date = new Date().getTime()
      appState = appState.setIn(['autofill', 'addresses', 'guid'], action.addressGuids)
      appState = appState.setIn(['autofill', 'addresses', 'timestamp'], date)
      appState = appState.setIn(['autofill', 'creditCards', 'guid'], action.creditCardGuids)
      appState = appState.setIn(['autofill', 'creditCards', 'timestamp'], date)
      break
    case appConstants.APP_SET_LOGIN_REQUIRED_DETAIL:
      appState = basicAuthState.setLoginRequiredDetail(appState, action)
      break
    case appConstants.APP_SET_LOGIN_RESPONSE_DETAIL:
      appState = basicAuth.setLoginResponseDetail(appState, action)
      break
    case ExtensionConstants.BROWSER_ACTION_REGISTERED:
      appState = extensionState.browserActionRegistered(appState, action)
      break
    case ExtensionConstants.BROWSER_ACTION_UPDATED:
      appState = extensionState.browserActionUpdated(appState, action)
      break
    case ExtensionConstants.EXTENSION_INSTALLED:
      appState = extensionState.extensionInstalled(appState, action)
      break
    case ExtensionConstants.EXTENSION_ENABLED:
      appState = extensionState.extensionEnabled(appState, action)
      break
    case ExtensionConstants.EXTENSION_DISABLED:
      appState = extensionState.extensionDisabled(appState, action)
      break
    case ExtensionConstants.CONTEXT_MENU_CREATED:
      appState = extensionState.contextMenuCreated(appState, action)
      break
    case ExtensionConstants.CONTEXT_MENU_ALL_REMOVED:
      appState = extensionState.contextMenuAllRemoved(appState, action)
      break
    case ExtensionConstants.CONTEXT_MENU_CLICKED:
      process.emit('chrome-context-menus-clicked',
        action.extensionId, action.tabId, action.info.toJS())
      break
    case appConstants.APP_SET_MENUBAR_TEMPLATE:
      appState = appState.setIn(['menu', 'template'], action.menubarTemplate)
      break
    case appConstants.APP_UPDATE_ADBLOCK_DATAFILES:
      const adblock = require('../../app/adBlock')
      adblock.updateAdblockDataFiles(action.uuid, action.enable)
      handleAppAction({
        actionType: appConstants.APP_CHANGE_SETTING,
        key: `adblock.${action.uuid}.enabled`,
        value: action.enable
      })
      return
    case appConstants.APP_UPDATE_ADBLOCK_CUSTOM_RULES: {
      const adblock = require('../../app/adBlock')
      adblock.updateAdblockCustomRules(action.rules)
      handleAppAction({
        actionType: appConstants.APP_CHANGE_SETTING,
        key: settings.ADBLOCK_CUSTOM_RULES,
        value: action.rules
      })
      return
    }
    case appConstants.APP_DEFAULT_BROWSER_UPDATED:
      if (action.useBrave) {
        for (const p of defaultProtocols) {
          app.setAsDefaultProtocolClient(p)
        }
      }
      let isDefaultBrowser = defaultProtocols.every(p => app.isDefaultProtocolClient(p))
      appState = appState.setIn(['settings', settings.IS_DEFAULT_BROWSER], isDefaultBrowser)
      break
    case appConstants.APP_DEFAULT_BROWSER_CHECK_COMPLETE:
      appState = appState.set('defaultBrowserCheckComplete', {})
      break
    case windowConstants.WINDOW_SET_FAVICON:
      appState = appState.set('sites', siteUtil.updateSiteFavicon(appState.get('sites'), action.frameProps.get('location'), action.favicon))
      appState = aboutNewTabState.setSites(appState, action)
      break
    case appConstants.APP_RENDER_URL_TO_PDF:
      const pdf = require('../../app/pdf')
      appState = pdf.renderUrlToPdf(appState, action)
      break
    case appConstants.APP_SET_OBJECT_ID:
      let obj = appState.getIn(action.objectPath)
      if (obj && obj.constructor === Immutable.Map) {
        appState = appState.setIn(action.objectPath.concat(['objectId']),
          action.objectId)
      }
      break
    case appConstants.APP_SAVE_SYNC_INIT_DATA:
      if (action.deviceId) {
        appState = appState.setIn(['sync', 'deviceId'], action.deviceId)
      }
      if (action.seed) {
        appState = appState.setIn(['sync', 'seed'], action.seed)
      }
      if (action.lastFetchTimestamp) {
        appState = appState.setIn(['sync', 'lastFetchTimestamp'], action.lastFetchTimestamp)
      }
      break
    default:
  }

  emitChanges()
}

appStore.dispatchToken = AppDispatcher.register(handleAppAction)

module.exports = appStore
