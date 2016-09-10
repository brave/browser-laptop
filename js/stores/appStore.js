/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const AppConstants = require('../constants/appConstants')
const WindowConstants = require('../constants/windowConstants')
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
const downloadStates = require('../constants/downloadStates')
const BrowserWindow = electron.BrowserWindow
const LocalShortcuts = require('../../app/localShortcuts')
const appActions = require('../actions/appActions')
const firstDefinedValue = require('../lib/functional').firstDefinedValue
const dates = require('../../app/dates')
const getSetting = require('../settings').getSetting
const EventEmitter = require('events').EventEmitter
const Immutable = require('immutable')
const diff = require('immutablediff')
const debounce = require('../lib/debounce.js')
const isDarwin = process.platform === 'darwin'
const locale = require('../../app/locale')
const path = require('path')

// state helpers
const basicAuthState = require('../../app/common/state/basicAuthState')
const tabState = require('../../app/common/state/tabState')

// Only used internally
const CHANGE_EVENT = 'app-state-change'

let appState
let lastEmittedState

// TODO cleanup all this createWindow crap
function isModal (browserOpts) {
  // this needs some better checks
  return browserOpts.scrollbars === false
}

function navbarHeight () {
  // TODO there has to be a better way to get this or at least add a test
  return 75
}

const createWindow = (browserOpts, defaults, frameOpts, windowState) => {
  const parentWindowKey = browserOpts.parentWindowKey

  browserOpts.width = firstDefinedValue(browserOpts.width, browserOpts.innerWidth, defaults.width)
  // height and innerHeight are the frame webview size
  browserOpts.height = firstDefinedValue(browserOpts.height, browserOpts.innerHeight)
  if (isNaN(browserOpts.height)) {
    // no inner height so check outer height or use default
    browserOpts.height = firstDefinedValue(browserOpts.outerHeight, defaults.height)
  } else {
    // BrowserWindow height is window height so add navbar height
    browserOpts.height = browserOpts.height + navbarHeight()
  }

  if (windowState.ui && windowState.ui.position) {
    browserOpts.x = firstDefinedValue(browserOpts.x, windowState.ui.position[0])
    browserOpts.y = firstDefinedValue(browserOpts.y, windowState.ui.position[1])
  }

  browserOpts.x = firstDefinedValue(browserOpts.x, browserOpts.left, browserOpts.screenX)
  browserOpts.y = firstDefinedValue(browserOpts.y, browserOpts.top, browserOpts.screenY)
  delete browserOpts.left
  delete browserOpts.top

  const screen = electron.screen
  const primaryDisplay = screen.getPrimaryDisplay()
  const parentWindow = parentWindowKey ? BrowserWindow.fromId(parentWindowKey) : BrowserWindow.getFocusedWindow()
  const bounds = parentWindow ? parentWindow.getBounds() : primaryDisplay.bounds

  // position on screen should be relative to focused window
  // or the primary display if there is no focused window
  const display = screen.getDisplayNearestPoint(bounds)

  // if no parentWindow, x, y or center is defined then go ahead
  // and center it if it's smaller than the display width
  // typeof and isNaN are used because 0 is falsy
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
    webPreferences: defaults.webPreferences
  }

  if (process.platform === 'linux') {
    windowProps.icon = path.join(__dirname, '..', '..', 'res', 'app.png')
  }

  let mainWindow = new BrowserWindow(Object.assign(windowProps, browserOpts))

  if (windowState.ui && windowState.ui.isMaximized) {
    mainWindow.maximize()
  }

  if (windowState.ui && windowState.ui.isFullScreen) {
    mainWindow.setFullScreen(true)
  }

  mainWindow.on('blur', function () {
    appActions.windowBlurred(mainWindow.id)
  })

  mainWindow.on('resize', function (evt) {
    // the default window size is whatever the last window resize was
    appActions.setDefaultWindowSize(evt.sender.getSize())
  })

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

  mainWindow.loadURL(appUrlUtil.getIndexHTML())
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
    width: appState.get('defaultWindowWidth'),
    height: appState.get('defaultWindowHeight'),
    minWidth: 480,
    minHeight: 300,
    minModalHeight: 100,
    minModalWidth: 100,
    windowOffset: 20,
    webPreferences: {
      sharedWorker: true,
      partition: 'default',
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
  if (!appState.get('defaultWindowWidth') && !appState.get('defaultWindowHeight')) {
    appState = appState.set('defaultWindowWidth', primaryDisplay.workAreaSize.width)
    appState = appState.set('defaultWindowHeight', primaryDisplay.workAreaSize.height)
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
      const Filtering = require('../../app/filtering')
      Filtering.setDefaultZoomLevel(settingValue)
      break
    default:
  }
}

const handleAppAction = (action) => {
  switch (action.actionType) {
    case AppConstants.APP_SET_STATE:
      appState = action.appState
      break
    case AppConstants.APP_NEW_WINDOW:
      const frameOpts = action.frameOpts && action.frameOpts.toJS()
      const browserOpts = (action.browserOpts && action.browserOpts.toJS()) || {}
      const windowState = action.restoredState || {}

      const mainWindow = createWindow(browserOpts, windowDefaults(), frameOpts, windowState)
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

      mainWindow.webContents.on('did-frame-finish-load', (e, isMainFrame) => {
        if (isMainFrame) {
          lastEmittedState = appState
          mainWindow.webContents.send(messages.INITIALIZE_WINDOW, browserOpts.disposition, appState.toJS(), frames, action.restoredState)
          if (action.cb) {
            action.cb()
          }
        }
      })
      mainWindow.webContents.on('crashed', (e) => {
        console.error('Window crashed. Reloading...')
        mainWindow.loadURL(appUrlUtil.getIndexHTML())

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
      mainWindow.loadURL(appUrlUtil.getIndexHTML())
      mainWindow.show()
      break
    case AppConstants.APP_CLOSE_WINDOW:
      const appWindow = BrowserWindow.fromId(action.appWindowId)
      appWindow.close()
      break
    case AppConstants.APP_ADD_PASSWORD:
      // If there is already an entry for this exact origin, action, and
      // username if it exists, update the password instead of creating a new entry
      let passwords = appState.get('passwords').filterNot((pw) => {
        return pw.get('origin') === action.passwordDetail.origin &&
          pw.get('action') === action.passwordDetail.action &&
          (!pw.get('username') || pw.get('username') === action.passwordDetail.username)
      })
      appState = appState.set('passwords', passwords.push(Immutable.fromJS(action.passwordDetail)))
      break
    case AppConstants.APP_REMOVE_PASSWORD:
      appState = appState.set('passwords', appState.get('passwords').filterNot((pw) => {
        return Immutable.is(pw, Immutable.fromJS(action.passwordDetail))
      }))
      break
    case AppConstants.APP_CLEAR_PASSWORDS:
      appState = appState.set('passwords', new Immutable.List())
      break
    case AppConstants.APP_CHANGE_NEW_TAB_DETAIL:
      appState = appState.setIn(['about', 'newtab'], action.newTabPageDetail)
      break
    case AppConstants.APP_ADD_SITE:
      const oldSiteSize = appState.get('sites').size
      if (action.siteDetail.constructor === Immutable.List) {
        action.siteDetail.forEach((s) => {
          appState = appState.set('sites', siteUtil.addSite(appState.get('sites'), s, action.tag))
        })
      } else {
        appState = appState.set('sites', siteUtil.addSite(appState.get('sites'), action.siteDetail, action.tag, action.originalSiteDetail))
      }
      if (action.destinationDetail) {
        appState = appState.set('sites', siteUtil.moveSite(appState.get('sites'), action.siteDetail, action.destinationDetail, false, false, true))
      }
      // If there was an item added then clear out the old history entries
      if (oldSiteSize !== appState.get('sites').size) {
        filterOutNonRecents()
      }
      break
    case AppConstants.APP_REMOVE_SITE:
      appState = appState.set('sites', siteUtil.removeSite(appState.get('sites'), action.siteDetail, action.tag))
      break
    case AppConstants.APP_MOVE_SITE:
      appState = appState.set('sites', siteUtil.moveSite(appState.get('sites'), action.sourceDetail, action.destinationDetail, action.prepend, action.destinationIsParent, false))
      break
    case AppConstants.APP_MERGE_DOWNLOAD_DETAIL:
      if (action.downloadDetail) {
        appState = appState.mergeIn(['downloads', action.downloadId], action.downloadDetail)
      } else {
        appState = appState.deleteIn(['downloads', action.downloadId])
      }
      break
    case AppConstants.APP_CLEAR_COMPLETED_DOWNLOADS:
      if (appState.get('downloads')) {
        const downloads = appState.get('downloads')
          .filter((download) =>
            ![downloadStates.COMPLETED, downloadStates.INTERRUPTED, downloadStates.CANCELLED].includes(download.get('state')))
        appState = appState.set('downloads', downloads)
      }
      break
    case AppConstants.APP_CLEAR_HISTORY:
      appState = appState.set('sites', siteUtil.clearHistory(appState.get('sites')))
      break
    case AppConstants.APP_SET_DEFAULT_WINDOW_SIZE:
      appState = appState.set('defaultWindowWidth', action.size[0])
      appState = appState.set('defaultWindowHeight', action.size[1])
      break
    case AppConstants.APP_SET_DATA_FILE_ETAG:
      appState = appState.setIn([action.resourceName, 'etag'], action.etag)
      break
    case AppConstants.APP_UPDATE_LAST_CHECK:
      appState = appState.setIn(['updates', 'lastCheckTimestamp'], (new Date()).getTime())
      appState = appState.setIn(['updates', 'lastCheckYMD'], dates.todayYMD())
      appState = appState.setIn(['updates', 'lastCheckWOY'], dates.todayWOY())
      appState = appState.setIn(['updates', 'lastCheckMonth'], dates.todayMonth())
      appState = appState.setIn(['updates', 'firstCheckMade'], true)
      break
    case AppConstants.APP_SET_UPDATE_STATUS:
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
    case AppConstants.APP_SET_RESOURCE_ENABLED:
      appState = appState.setIn([action.resourceName, 'enabled'], action.enabled)
      break
    case AppConstants.APP_ADD_RESOURCE_COUNT:
      const oldCount = appState.getIn([action.resourceName, 'count']) || 0
      appState = appState.setIn([action.resourceName, 'count'], oldCount + action.count)
      break
    case AppConstants.APP_SET_DATA_FILE_LAST_CHECK:
      appState = appState.mergeIn([action.resourceName], {
        lastCheckVersion: action.lastCheckVersion,
        lastCheckDate: action.lastCheckDate
      })
      break
    case AppConstants.APP_CHANGE_SETTING:
      appState = appState.setIn(['settings', action.key], action.value)
      handleChangeSettingAction(action.key, action.value)
      break
    case AppConstants.APP_CHANGE_SITE_SETTING:
      {
        let propertyName = action.temporary ? 'temporarySiteSettings' : 'siteSettings'
        appState = appState.set(propertyName,
          siteSettings.mergeSiteSetting(appState.get(propertyName), action.hostPattern, action.key, action.value))
        break
      }
    case AppConstants.APP_REMOVE_SITE_SETTING:
      {
        let propertyName = action.temporary ? 'temporarySiteSettings' : 'siteSettings'
        let newSiteSettings = siteSettings.removeSiteSetting(appState.get(propertyName),
          action.hostPattern, action.key)
        appState = appState.set(propertyName, newSiteSettings)
        break
      }
    case AppConstants.APP_UPDATE_LEDGER_INFO:
      appState = appState.set('ledgerInfo', Immutable.fromJS(action.ledgerInfo))
      break
    case AppConstants.APP_UPDATE_PUBLISHER_INFO:
      appState = appState.set('publisherInfo', Immutable.fromJS(action.publisherInfo))
      break
    case AppConstants.APP_SHOW_MESSAGE_BOX:
      let notifications = appState.get('notifications')
      appState = appState.set('notifications', notifications.filterNot((notification) => {
        let message = notification.get('message')
        // action.detail is a regular mutable object only when running tests
        return action.detail.get
          ? message === action.detail.get('message')
          : message === action.detail['message']
      }).push(Immutable.fromJS(action.detail)))
      break
    case AppConstants.APP_HIDE_MESSAGE_BOX:
      appState = appState.set('notifications', appState.get('notifications').filterNot((notification) => {
        return notification.get('message') === action.message
      }))
      break
    case AppConstants.APP_CLEAR_MESSAGE_BOXES:
      appState = appState.set('notifications', appState.get('notifications').filterNot((notification) => {
        return notification.get('frameOrigin') === action.origin
      }))
      break
    case AppConstants.APP_ADD_WORD:
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
    case AppConstants.APP_SET_DICTIONARY:
      appState = appState.setIn(['dictionary', 'locale'], action.locale)
      break
    case AppConstants.APP_CLEAR_DATA:
      if (action.clearDataDetail.get('browserHistory')) {
        handleAppAction({actionType: AppConstants.APP_CLEAR_HISTORY})
        BrowserWindow.getAllWindows().forEach((wnd) => wnd.webContents.send(messages.CLEAR_CLOSED_FRAMES))
      }
      if (action.clearDataDetail.get('downloadHistory')) {
        handleAppAction({actionType: AppConstants.APP_CLEAR_COMPLETED_DOWNLOADS})
      }
      // Site cookies clearing should also clear cache so that evercookies will be properly removed
      if (action.clearDataDetail.get('cachedImagesAndFiles') || action.clearDataDetail.get('allSiteCookies')) {
        const Filtering = require('../../app/filtering')
        Filtering.clearCache()
      }
      if (action.clearDataDetail.get('savedPasswords')) {
        handleAppAction({actionType: AppConstants.APP_CLEAR_PASSWORDS})
      }
      if (action.clearDataDetail.get('allSiteCookies')) {
        const Filtering = require('../../app/filtering')
        Filtering.clearStorageData()
      }
      if (action.clearDataDetail.get('autocompleteData')) {
        const Filtering = require('../../app/filtering')
        Filtering.clearAutocompleteData()
      }
      if (action.clearDataDetail.get('autofillData')) {
        const Filtering = require('../../app/filtering')
        Filtering.clearAutofillData()
      }
      break
    case AppConstants.APP_ADD_AUTOFILL_ADDRESS:
      {
        const Filtering = require('../../app/filtering')
        appState = appState.setIn(['autofill', 'addresses', 'guid'],
          appState.getIn(['autofill', 'addresses', 'guid']).filterNot((address) => {
            return Immutable.is(address, action.originalDetail.get('guid'))
          }))

        let addresses = appState.getIn(['autofill', 'addresses', 'guid'])
        const guid = Filtering.addAutofillAddress(action.detail.toJS())
        if (action.originalDetail.get('guid') !== undefined &&
          !Immutable.is(Immutable.fromJS(guid), action.originalDetail.get('guid'))) {
          Filtering.removeAutofillAddress(action.originalDetail.get('guid').toJS())
        }
        appState = appState.setIn(['autofill', 'addresses', 'guid'], addresses.push(Immutable.fromJS(guid)))
        appState = appState.setIn(['autofill', 'addresses', 'timestamp'], new Date().getTime())
        break
      }
    case AppConstants.APP_REMOVE_AUTOFILL_ADDRESS:
      {
        const Filtering = require('../../app/filtering')
        appState = appState.setIn(['autofill', 'addresses', 'guid'],
          appState.getIn(['autofill', 'addresses', 'guid']).filterNot((address) => {
            return Immutable.is(address, action.detail.get('guid'))
          }))
        Filtering.removeAutofillAddress(action.detail.get('guid').toJS())
        appState = appState.setIn(['autofill', 'addresses', 'timestamp'], new Date().getTime())
        break
      }
    case AppConstants.APP_ADD_AUTOFILL_CREDIT_CARD:
      {
        const Filtering = require('../../app/filtering')
        appState = appState.setIn(['autofill', 'creditCards', 'guid'],
          appState.getIn(['autofill', 'creditCards', 'guid']).filterNot((card) => {
            return Immutable.is(card, action.originalDetail.get('guid'))
          }))

        let creditCards = appState.getIn(['autofill', 'creditCards', 'guid'])
        const guid = Filtering.addAutofillCreditCard(action.detail.toJS())
        if (action.originalDetail.get('guid') !== undefined &&
          !Immutable.is(Immutable.fromJS(guid), action.originalDetail.get('guid'))) {
          Filtering.removeAutofillCreditCard(action.originalDetail.get('guid').toJS())
        }
        appState = appState.setIn(['autofill', 'creditCards', 'guid'], creditCards.push(Immutable.fromJS(guid)))
        appState = appState.setIn(['autofill', 'creditCards', 'timestamp'], new Date().getTime())
        break
      }
    case AppConstants.APP_REMOVE_AUTOFILL_CREDIT_CARD:
      {
        const Filtering = require('../../app/filtering')
        appState = appState.setIn(['autofill', 'creditCards', 'guid'],
          appState.getIn(['autofill', 'creditCards', 'guid']).filterNot((card) => {
            return Immutable.is(card, action.detail.get('guid'))
          }))
        Filtering.removeAutofillCreditCard(action.detail.get('guid').toJS())
        appState = appState.setIn(['autofill', 'creditCards', 'timestamp'], new Date().getTime())
        break
      }
    case AppConstants.APP_SET_LOGIN_REQUIRED_DETAIL:
      appState = basicAuthState.setLoginRequiredDetail(appState, action.tabId, action.detail)
      break
    case AppConstants.APP_SET_LOGIN_RESPONSE_DETAIL:
      appState = basicAuthState.setLoginResponseDetail(appState, action.tabId, action.detail)
      break
    case WindowConstants.WINDOW_CLOSE_FRAME:
      appState = tabState.closeTab(appState, action.frameProps.get('tabId'))
      break
    default:
  }

  emitChanges()
}

appStore.dispatchToken = AppDispatcher.register(handleAppAction)

module.exports = appStore
