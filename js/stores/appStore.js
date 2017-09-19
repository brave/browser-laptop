/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const appConstants = require('../constants/appConstants')
const windowConstants = require('../constants/windowConstants')
const ExtensionConstants = require('../../app/common/constants/extensionConstants')
const appDispatcher = require('../dispatcher/appDispatcher')
const appConfig = require('../constants/appConfig')
const settings = require('../constants/settings')
const siteUtil = require('../state/siteUtil')
const syncUtil = require('../state/syncUtil')
const siteSettings = require('../state/siteSettings')
const appUrlUtil = require('../lib/appUrlUtil')
const electron = require('electron')
const app = electron.app
const messages = require('../constants/messages')
const UpdateStatus = require('../constants/updateStatus')
const BrowserWindow = electron.BrowserWindow
const syncActions = require('../actions/syncActions')
const firstDefinedValue = require('../lib/functional').firstDefinedValue
const dates = require('../../app/dates')
const getSetting = require('../settings').getSetting
const EventEmitter = require('events').EventEmitter
const Immutable = require('immutable')
const diff = require('immutablediff')
const debounce = require('../lib/debounce')
const path = require('path')
const autofill = require('../../app/autofill')
const nativeImage = require('../../app/nativeImage')
const filtering = require('../../app/filtering')
const basicAuth = require('../../app/browser/basicAuth')
const webtorrent = require('../../app/browser/webtorrent')
const {calculateTopSites} = require('../../app/browser/api/topSites')
const assert = require('assert')
const profiles = require('../../app/browser/profiles')
const {zoomLevel} = require('../../app/common/constants/toolbarUserInterfaceScale')
const {initWindowCacheState} = require('../../app/sessionStoreShutdown')

// state helpers
const {isImmutable, makeImmutable} = require('../../app/common/state/immutableUtil')
const basicAuthState = require('../../app/common/state/basicAuthState')
const extensionState = require('../../app/common/state/extensionState')
const aboutNewTabState = require('../../app/common/state/aboutNewTabState')
const aboutHistoryState = require('../../app/common/state/aboutHistoryState')
const tabState = require('../../app/common/state/tabState')

const isDarwin = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

// Only used internally
const CHANGE_EVENT = 'app-state-change'

const defaultProtocols = ['https', 'http']

let appState = null
let lastEmittedState
let initialized = false

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
const setWindowDimensions = (browserOpts, defaults, immutableWindowState) => {
  assert(isImmutable(immutableWindowState))
  if (immutableWindowState.getIn(['ui', 'size'])) {
    browserOpts.width = firstDefinedValue(browserOpts.width, immutableWindowState.getIn(['ui', 'size', 0]))
    browserOpts.height = firstDefinedValue(browserOpts.height, immutableWindowState.getIn(['ui', 'size', 1]))
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
const setWindowPosition = (browserOpts, defaults, immutableWindowState) => {
  if (browserOpts.positionByMouseCursor) {
    const screenPos = electron.screen.getCursorScreenPoint()
    browserOpts.x = screenPos.x
    browserOpts.y = screenPos.y
  } else if (immutableWindowState.getIn(['ui', 'position'])) {
    // Position comes from window state
    browserOpts.x = firstDefinedValue(browserOpts.x, immutableWindowState.getIn(['ui', 'position', 0]))
    browserOpts.y = firstDefinedValue(browserOpts.y, immutableWindowState.getIn(['ui', 'position', 1]))
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

const createWindow = (action) => {
  const frameOpts = (action.frameOpts && action.frameOpts.toJS()) || {}
  let browserOpts = (action.browserOpts && action.browserOpts.toJS()) || {}
  const immutableWindowState = action.restoredState || Immutable.Map()
  const defaults = windowDefaults()

  browserOpts = setWindowDimensions(browserOpts, defaults, immutableWindowState)
  browserOpts = setWindowPosition(browserOpts, defaults, immutableWindowState)

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

  const homepageSetting = getSetting(settings.HOMEPAGE)
  const startupSetting = getSetting(settings.STARTUP_MODE)
  const toolbarUserInterfaceScale = getSetting(settings.TOOLBAR_UI_SCALE)

  setImmediate(() => {
    const win = new BrowserWindow(Object.assign(windowProps, browserOpts, {disposition: frameOpts.disposition}))
    let restoredImmutableWindowState = action.restoredState
    initWindowCacheState(win.id, restoredImmutableWindowState)

    // initialize frames state
    let frames = Immutable.List()
    if (restoredImmutableWindowState) {
      frames = restoredImmutableWindowState.get('frames')
      restoredImmutableWindowState = restoredImmutableWindowState.set('frames', Immutable.List())
      restoredImmutableWindowState = restoredImmutableWindowState.set('tabs', Immutable.List())
    } else {
      if (frameOpts && Object.keys(frameOpts).length > 0) {
        if (frameOpts.forEach) {
          frames = Immutable.fromJS(frameOpts)
        } else {
          frames = frames.push(Immutable.fromJS(frameOpts))
        }
      } else if (startupSetting === 'homePage' && homepageSetting) {
        frames = Immutable.fromJS(homepageSetting.split('|').map((homepage) => {
          return {
            location: homepage
          }
        }))
      }
    }

    if (frames.size === 0) {
      frames = Immutable.fromJS([{}])
    }

    if (immutableWindowState.getIn(['ui', 'isMaximized'])) {
      win.maximize()
    }

    if (immutableWindowState.getIn(['ui', 'isFullScreen'])) {
      win.setFullScreen(true)
    }

    appDispatcher.registerWindow(win, win.webContents)
    win.webContents.on('did-finish-load', (e) => {
      lastEmittedState = appState
      win.webContents.setZoomLevel(zoomLevel[toolbarUserInterfaceScale] || 0.0)

      const mem = muon.shared_memory.create({
        windowValue: {
          disposition: frameOpts.disposition,
          id: win.id
        },
        appState: appState.toJS(),
        frames: frames.toJS(),
        windowState: (restoredImmutableWindowState && restoredImmutableWindowState.toJS()) || undefined})

      e.sender.sendShared(messages.INITIALIZE_WINDOW, mem)
      if (action.cb) {
        action.cb()
      }
    })

    win.on('ready-to-show', () => {
      win.show()
    })

    win.loadURL(appUrlUtil.getBraveExtIndexHTML())
  })
}

class AppStore extends EventEmitter {
  getState () {
    return appState
  }

  emitChanges (emitFullState) {
    if (lastEmittedState) {
      const d = diff(lastEmittedState, appState)
      if (!d.isEmpty()) {
        BrowserWindow.getAllWindows().forEach((wnd) => {
          if (wnd.webContents && !wnd.webContents.isDestroyed()) {
            wnd.webContents.send(messages.APP_STATE_CHANGE, { stateDiff: d.toJS() })
          }
        })
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
      filtering.setDefaultZoomLevel(settingValue)
      break
    case settings.TOOLBAR_UI_SCALE: {
      const newZoomLevel = zoomLevel[settingValue] || 0
      BrowserWindow.getAllWindows().forEach(function (wnd) {
        wnd.webContents.setZoomLevel(newZoomLevel)
      })
    } break
    default:
  }
}

let reducers = []

const applyReducers = (state, action, immutableAction) => reducers.reduce(
    (appState, reducer) => {
      const newState = reducer(appState, action, immutableAction)
      assert.ok(action.actionType === appConstants.APP_SET_STATE || Immutable.Map.isMap(newState),
        `Oops! action ${action.actionType} didn't return valid state for reducer:\n\n${reducer}`)
      return newState
    }, appState)

const handleAppAction = (action) => {
  if (action.actionType === appConstants.APP_SET_STATE) {
    reducers = [
      require('../../app/browser/reducers/downloadsReducer'),
      require('../../app/browser/reducers/flashReducer'),
      require('../../app/browser/reducers/autoplayReducer'),
      // tabs, sites and windows reducers need to stay in that order
      // until we have a better way to manage dependencies.
      // tabsReducer must be above dragDropReducer.
      require('../../app/browser/reducers/tabsReducer'),
      require('../../app/browser/reducers/sitesReducer'),
      require('../../app/browser/reducers/windowsReducer'),
      require('../../app/browser/reducers/syncReducer'),
      require('../../app/browser/reducers/clipboardReducer'),
      require('../../app/browser/reducers/urlBarSuggestionsReducer'),
      require('../../app/browser/reducers/passwordManagerReducer'),
      require('../../app/browser/reducers/spellCheckerReducer'),
      require('../../app/browser/reducers/tabMessageBoxReducer'),
      require('../../app/browser/reducers/dragDropReducer'),
      require('../../app/browser/reducers/extensionsReducer'),
      require('../../app/browser/reducers/shareReducer'),
      require('../../app/browser/reducers/updatesReducer'),
      require('../../app/browser/reducers/braverySettingsReducer'),
      require('../../app/ledger').doAction
    ]
    initialized = true
    appState = action.appState
  }

  if (!initialized) {
    console.error('Action called before state was initialized: ' + action.actionType)
    return
  }

  // maintain backwards compatibility for now by adding an additional param for immutableAction
  const immutableAction = makeImmutable(action)
  appState = applyReducers(appState, action, immutableAction)

  switch (action.actionType) {
    case appConstants.APP_SET_STATE:
      // DO NOT ADD TO THIS LIST
      // See tabsReducer.js for app state init example
      // TODO(bridiver) - these should be refactored into reducers
      appState = filtering.init(appState, action, appStore)
      appState = basicAuth.init(appState, action, appStore)
      appState = webtorrent.init(appState, action, appStore)
      appState = profiles.init(appState, action, appStore)
      appState = require('../../app/browser/menu').init(appState, action, appStore)
      appState = require('../../app/sync').init(appState, action, appStore)
      break
    case appConstants.APP_SHUTTING_DOWN:
      appDispatcher.shutdown()
      app.quit()
      break
    case appConstants.APP_NEW_WINDOW:
      createWindow(action)
      break
    case appConstants.APP_CHANGE_NEW_TAB_DETAIL:
      appState = aboutNewTabState.mergeDetails(appState, action)
      if (action.refresh) {
        calculateTopSites(true)
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
      calculateTopSites(false)
      appState = aboutHistoryState.setHistory(appState, action)
      // If there was an item added then clear out the old history entries
      if (oldSiteSize !== appState.get('sites').size) {
        filterOutNonRecents()
      }
      break
    case appConstants.APP_APPLY_SITE_RECORDS:
    case appConstants.APP_REMOVE_SITE:
      calculateTopSites(true)
      appState = aboutHistoryState.setHistory(appState, action)
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
        appState = appState.set(propertyName,
          siteSettings.mergeSiteSetting(appState.get(propertyName), siteUtil.getOrigin(action.url), 'flash', 1))
        break
      }
    case appConstants.APP_ALLOW_FLASH_ALWAYS:
      {
        const propertyName = action.isPrivate ? 'temporarySiteSettings' : 'siteSettings'
        const expirationTime = Date.now() + (7 * 24 * 3600 * 1000)
        appState = appState.set(propertyName,
          siteSettings.mergeSiteSetting(appState.get(propertyName), siteUtil.getOrigin(action.url), 'flash', expirationTime))
        break
      }
    case appConstants.APP_CHANGE_SITE_SETTING:
      {
        let propertyName = action.temporary ? 'temporarySiteSettings' : 'siteSettings'
        let newSiteSettings = siteSettings.mergeSiteSetting(appState.get(propertyName), action.hostPattern, action.key, action.value)
        if (action.skipSync) {
          newSiteSettings = newSiteSettings.setIn([action.hostPattern, 'skipSync'], true)
        }
        appState = appState.set(propertyName, newSiteSettings)
        break
      }
    case appConstants.APP_REMOVE_SITE_SETTING:
      {
        let propertyName = action.temporary ? 'temporarySiteSettings' : 'siteSettings'
        let newSiteSettings = siteSettings.removeSiteSetting(appState.get(propertyName),
          action.hostPattern, action.key)
        if (action.skipSync) {
          newSiteSettings = newSiteSettings.setIn([action.hostPattern, 'skipSync'], true)
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
          if (action.skipSync) {
            newEntry = newEntry.set('skipSync', true)
          }
          newSiteSettings = newSiteSettings.set(hostPattern, newEntry)
        })
        appState = appState.set(propertyName, newSiteSettings)
        break
      }
    case appConstants.APP_SET_SKIP_SYNC:
      {
        if (appState.getIn(action.path)) {
          appState = appState.setIn(action.path.concat(['skipSync']), action.skipSync)
        }
        break
      }
    case appConstants.APP_ADD_NOSCRIPT_EXCEPTIONS:
      {
        const propertyName = action.temporary ? 'temporarySiteSettings' : 'siteSettings'
        // Note that this is always cleared on restart or reload, so should not
        // be synced or persisted.
        const key = 'noScriptExceptions'
        if (!action.origins || !action.origins.size) {
          // Clear the exceptions
          appState = appState.setIn([propertyName, action.hostPattern, key], new Immutable.Map())
        } else {
          const currentExceptions = appState.getIn([propertyName, action.hostPattern, key]) || new Immutable.Map()
          appState = appState.setIn([propertyName, action.hostPattern, key], currentExceptions.merge(action.origins))
        }
      }
      break
    case appConstants.APP_UPDATE_LEDGER_INFO:
      appState = appState.set('ledgerInfo', Immutable.fromJS(action.ledgerInfo))
      break
    case appConstants.APP_UPDATE_LOCATION_INFO:
      appState = appState.set('locationInfo', Immutable.fromJS(action.locationInfo))
      break
    case appConstants.APP_UPDATE_PUBLISHER_INFO:
      appState = appState.set('publisherInfo', Immutable.fromJS(action.publisherInfo))
      break
    case appConstants.APP_SHOW_NOTIFICATION:
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
    case appConstants.APP_HIDE_NOTIFICATION:
      appState = appState.set('notifications', appState.get('notifications').filterNot((notification) => {
        return notification.get('message') === action.message
      }))
      break
    case appConstants.APP_TAB_CLOSE_REQUESTED:
      const tabValue = tabState.getByTabId(appState, immutableAction.get('tabId'))
      if (!tabValue) {
        break
      }
      const origin = siteUtil.getOrigin(tabValue.get('url'))

      if (origin) {
        const tabsInOrigin = tabState.getTabs(appState).find((tabValue) =>
          siteUtil.getOrigin(tabValue.get('url')) === origin && tabValue.get('tabId') !== immutableAction.get('tabId'))
        if (!tabsInOrigin) {
          appState = appState.set('notifications', appState.get('notifications').filterNot((notification) => {
            return notification.get('frameOrigin') === origin
          }))
        }
      }
      break
    case appConstants.APP_LEDGER_RECOVERY_STATUS_CHANGED:
      {
        const date = new Date().getTime()
        appState = appState.setIn(['about', 'preferences', 'recoverySucceeded'], action.recoverySucceeded)
        appState = appState.setIn(['about', 'preferences', 'updatedStamp'], date)
      }
      break
    case appConstants.APP_ON_CLEAR_BROWSING_DATA:
      // TODO: Maybe make storing this state optional?
      appState = appState.set('clearBrowsingDataDefaults', action.clearDataDetail)
      if (action.clearDataDetail.get('browserHistory')) {
        calculateTopSites(true)
        appState = aboutHistoryState.setHistory(appState, action)
        syncActions.clearHistory()
        BrowserWindow.getAllWindows().forEach((wnd) => wnd.webContents.send(messages.CLEAR_CLOSED_FRAMES))
      }
      if (action.clearDataDetail.get('downloadHistory')) {
        handleAppAction({actionType: appConstants.APP_CLEAR_COMPLETED_DOWNLOADS})
      }
      // Site cookies clearing should also clear cache so that evercookies will be properly removed
      if (action.clearDataDetail.get('cachedImagesAndFiles') || action.clearDataDetail.get('allSiteCookies')) {
        filtering.clearCache()
      }
      if (action.clearDataDetail.get('savedPasswords')) {
        handleAppAction({actionType: appConstants.APP_CLEAR_PASSWORDS})
      }
      if (action.clearDataDetail.get('allSiteCookies')) {
        filtering.clearStorageData()
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
      appState = siteUtil.updateSiteFavicon(appState, action.frameProps.get('location'), action.favicon)
      if (action.frameProps.get('favicon') !== action.favicon) {
        calculateTopSites(false)
      }
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
        // Update the site cache if this is a site
        if (action.objectPath[0] === 'sites') {
          appState = syncUtil.updateSiteCache(appState, obj)
        }
      }
      break
    case appConstants.APP_SAVE_SYNC_DEVICES:
      for (let deviceId of Object.keys(action.devices)) {
        const device = action.devices[deviceId]
        if (device.lastRecordTimestamp) {
          appState = appState.setIn(['sync', 'devices', deviceId, 'lastRecordTimestamp'], device.lastRecordTimestamp)
        }
        if (device.name) {
          appState = appState.setIn(['sync', 'devices', deviceId, 'name'], device.name)
        }
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
      if (action.seedQr) {
        appState = appState.setIn(['sync', 'seedQr'], action.seedQr)
      }
      break
    case appConstants.APP_SET_SYNC_SETUP_ERROR:
      appState = appState.setIn(['sync', 'setupError'], action.error)
      break
    case appConstants.APP_CREATE_SYNC_CACHE:
      appState = syncUtil.createSiteCache(appState)
      break
    case appConstants.APP_RESET_SYNC_DATA:
      const sessionStore = require('../../app/sessionStore')
      const syncDefault = Immutable.fromJS(sessionStore.defaultAppState().sync)
      const originalSeed = appState.getIn(['sync', 'seed'])
      appState = appState.set('sync', syncDefault)
      appState.get('sites').forEach((site, key) => {
        if (site.has('objectId') && syncUtil.isSyncable('bookmark', site)) {
          // Remember which profile this bookmark was originally synced to.
          // Since old bookmarks should be synced when a new profile is created,
          // we have to keep track of which profile already has these bookmarks
          // or else the old profile may have these bookmarks duplicated. #7405
          appState = appState.setIn(['sites', key, 'originalSeed'], originalSeed)
        }
      })
      appState.setIn(['sync', 'devices'], {})
      appState.setIn(['sync', 'objectsById'], {})
      break
    case appConstants.APP_SHOW_DOWNLOAD_DELETE_CONFIRMATION:
      appState = appState.set('deleteConfirmationVisible', true)
      break
    case appConstants.APP_HIDE_DOWNLOAD_DELETE_CONFIRMATION:
      appState = appState.set('deleteConfirmationVisible', false)
      break
    case appConstants.APP_ENABLE_UNDEFINED_PUBLISHERS:
      const sitesObject = appState.get('siteSettings')
      Object.keys(action.publishers).map((item) => {
        const pattern = `https?://${item}`
        const siteSetting = sitesObject.get(pattern)
        const result = (siteSetting) && (siteSetting.get('ledgerPayments'))

        if (result === undefined) {
          let newSiteSettings = siteSettings.mergeSiteSetting(appState.get('siteSettings'), pattern, 'ledgerPayments', true)
          appState = appState.set('siteSettings', newSiteSettings)
        }
      })
      break
    case appConstants.APP_CHANGE_LEDGER_PINNED_PERCENTAGES:
      Object.keys(action.publishers).map((item) => {
        const pattern = `https?://${item}`
        let newSiteSettings = siteSettings.mergeSiteSetting(appState.get('siteSettings'), pattern, 'ledgerPinPercentage', action.publishers[item].pinPercentage)
        appState = appState.set('siteSettings', newSiteSettings)
      })
      break
    case appConstants.APP_DEFAULT_SEARCH_ENGINE_LOADED:
      appState = appState.set('searchDetail', action.searchDetail)
      break
    default:
  }

  emitChanges()
}

appStore.dispatchToken = appDispatcher.register(handleAppAction)

module.exports = appStore
