/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const appConstants = require('../constants/appConstants')
const windowConstants = require('../constants/windowConstants')
const ExtensionConstants = require('../../app/common/constants/extensionConstants')
const appDispatcher = require('../dispatcher/appDispatcher')
const settings = require('../constants/settings')
const {STATE_SITES} = require('../constants/stateConstants')
const syncUtil = require('../state/syncUtil')
const electron = require('electron')
const app = electron.app
const messages = require('../constants/messages')
const UpdateStatus = require('../constants/updateStatus')
const BrowserWindow = electron.BrowserWindow
const syncActions = require('../actions/syncActions')
const dates = require('../../app/dates')
const EventEmitter = require('events').EventEmitter
const Immutable = require('immutable')
const path = require('path')
const diff = require('immutablediff')
const debounce = require('../lib/debounce')
const autofill = require('../../app/autofill')
const filtering = require('../../app/filtering')
const basicAuth = require('../../app/browser/basicAuth')
const webtorrent = require('../../app/browser/webtorrent')
const {calculateTopSites} = require('../../app/browser/api/topSites')
const assert = require('assert')
const profiles = require('../../app/browser/profiles')
const {zoomLevel} = require('../../app/common/constants/toolbarUserInterfaceScale')
const {HrtimeLogger} = require('../../app/common/lib/logUtil')
const platformUtil = require('../../app/common/lib/platformUtil')
const urlUtil = require('../lib/urlutil')
const buildConfig = require('../constants/buildConfig')
const {shouldDebugStoreActions} = require('../../app/cmdLine')

// state helpers
const {makeImmutable, findNullKeyPaths} = require('../../app/common/state/immutableUtil')
const basicAuthState = require('../../app/common/state/basicAuthState')
const extensionState = require('../../app/common/state/extensionState')
const aboutNewTabState = require('../../app/common/state/aboutNewTabState')
const aboutHistoryState = require('../../app/common/state/aboutHistoryState')
const tabState = require('../../app/common/state/tabState')
const bookmarksState = require('../../app/common/state/bookmarksState')
const bookmarkFoldersState = require('../../app/common/state/bookmarkFoldersState')
const historyState = require('../../app/common/state/historyState')

// Only used internally
const CHANGE_EVENT = 'app-state-change'

const defaultProtocols = ['https', 'http']

let appState = null
let initialized = false

/**
 * Enable reducer logging with env var REDUCER_TIME_LOG_THRESHOLD={time in ns}
 * Log format: `{unix timestamp (ms)},{label},{run time (ns)}`
 */
const TIME_LOG_PATH = process.env.REDUCER_TIME_LOG_PATH ||
  path.join(app.getPath('userData'), `reducer-time-${new Date().toISOString()}.log`)
const TIME_LOG_THRESHOLD = parseInt(process.env.REDUCER_TIME_LOG_THRESHOLD)
const SHOULD_LOG_TIME = (TIME_LOG_THRESHOLD > 0)
if (SHOULD_LOG_TIME) {
  console.log(`Logging reducer runtimes above ${TIME_LOG_THRESHOLD} ms to ${TIME_LOG_PATH}`)
}
const timeLogger = new HrtimeLogger(TIME_LOG_PATH, TIME_LOG_THRESHOLD)

function shouldIgnoreStateDiffForWindow (stateOp) {
  const path = stateOp.get('path')
  // remove tabs[].frame since it comes from the windowState anyway
  // TODO: do we need to store this in the appState? It's expensive.
  const shouldIgnore = (path.startsWith('/tabs/') && path.includes('/frame/'))
  return shouldIgnore
}

class AppStore extends EventEmitter {
  constructor () {
    super()
    this.lastEmittedState = null
  }

  getState () {
    return appState
  }

  emitChanges () {
    if (this.lastEmittedState && this.lastEmittedState !== appState) {
      let d
      try {
        d = diff(this.lastEmittedState, appState)
          // remove paths the window does not care about
          .filterNot(shouldIgnoreStateDiffForWindow)
      } catch (e) {
        console.error('Error getting a diff from latest state.')
        // one possible reason immutablediff can throw an error
        // is due to null keys, so let's log any that we find
        const nullKeyPaths = findNullKeyPaths(appState)
        const error = (typeof e === 'object')
          ? e
          : (typeof e === 'string')
            ? new Error(e)
            : new Error()
        for (let keyPath of nullKeyPaths) {
          keyPath = keyPath.map(key => key === null ? 'null' : key)
          const message = ` State path had null entry! Path was: [${keyPath.join(', ')}].`
          error.message += message
        }
        throw error
      }
      if (d && !d.isEmpty()) {
        const stateDiff = d.toJS()
        BrowserWindow.getAllWindows().forEach((wnd) => {
          if (wnd.webContents && !wnd.webContents.isDestroyed()) {
            wnd.webContents.send(messages.APP_STATE_CHANGE, { stateDiff })
          }
        })
        this.lastEmittedState = appState
        this.emit(CHANGE_EVENT, stateDiff)
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

  getLastEmittedState () {
    if (!this.lastEmittedState) {
      this.lastEmittedState = appState
    }

    return this.lastEmittedState
  }
}

const appStore = new AppStore()
const emitChanges = debounce(appStore.emitChanges.bind(appStore), 5)

/**
 * Useful for updating non-react preferences (electron properties, etc).
 * Called when any settings are modified (ex: via preferences).
 */
function handleChangeSettingAction (state, settingKey, settingValue) {
  switch (settingKey) {
    case settings.HARDWARE_ACCELERATION_ENABLED:
      app.setBooleanPref('hardware_acceleration_mode.enabled', settingValue)
      break
    case settings.AUTO_HIDE_MENU:
      BrowserWindow.getAllWindows().forEach(function (wnd) {
        wnd.setAutoHideMenuBar(settingValue)
        wnd.setMenuBarVisibility(!settingValue)
      })
      break
    case settings.DEFAULT_ZOOM_LEVEL:
      filtering.setDefaultZoomLevel(settingValue)
      break
    case settings.TOOLBAR_UI_SCALE:
      {
        const newZoomLevel = zoomLevel[settingValue] || 0
        BrowserWindow.getAllWindows().forEach(function (wnd) {
          wnd.webContents.setZoomLevel(newZoomLevel)
        })
        break
      }
    case settings.HOMEPAGE:
      {
        let homeArray = settingValue.split('|')
        homeArray = homeArray.map(page => {
          page = page.trim()
          const punycodeUrl = urlUtil.getPunycodeUrl(page)
          if (punycodeUrl.replace(/\/$/, '') !== page) {
            page = urlUtil.getPunycodeUrl(page)
          }

          return page
        })

        state = state.setIn(['settings', settingKey], homeArray.join('|'))
        break
      }
  }

  return state
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
  const ledgerReducer = require('../../app/browser/reducers/ledgerReducer')
  const timeStart = process.hrtime()
  if (action.actionType === appConstants.APP_SET_STATE) {
    reducers = [
      require('../../app/browser/reducers/downloadsReducer'),
      require('../../app/browser/reducers/flashReducer'),
      require('../../app/browser/reducers/dappReducer'),
      require('../../app/browser/reducers/autoplayReducer'),
      // tabs, sites and windows reducers need to stay in that order
      // until we have a better way to manage dependencies.
      // tabsReducer must be above dragDropReducer.
      require('../../app/browser/reducers/tabsReducer'),
      require('../../app/browser/reducers/urlBarSuggestionsReducer'),
      require('../../app/browser/reducers/bookmarksReducer'),
      require('../../app/browser/reducers/bookmarkFoldersReducer'),
      require('../../app/browser/reducers/historyReducer'),
      require('../../app/browser/reducers/pinnedSitesReducer'),
      require('../../app/browser/reducers/windowsReducer'),
      require('../../app/browser/reducers/syncReducer'),
      require('../../app/browser/reducers/clipboardReducer'),
      require('../../app/browser/reducers/passwordManagerReducer'),
      require('../../app/browser/reducers/spellCheckerReducer'),
      require('../../app/browser/reducers/tabMessageBoxReducer'),
      require('../../app/browser/reducers/dragDropReducer'),
      require('../../app/browser/reducers/extensionsReducer'),
      require('../../app/browser/reducers/shareReducer'),
      require('../../app/browser/reducers/updatesReducer'),
      require('../../app/browser/reducers/aboutNewTabReducer'),
      require('../../app/browser/reducers/braverySettingsReducer'),
      require('../../app/browser/reducers/siteSettingsReducer'),
      require('../../app/browser/reducers/torReducer'),
      require('../../app/browser/reducers/pageDataReducer'),
      ledgerReducer,
      require('../../app/browser/menu')
    ]
    initialized = true
    appState = action.appState
  }

  if (!initialized) {
    console.error('Action called before state was initialized: ' + action.actionType)
    return
  }

  if (shouldDebugStoreActions) {
    console.log('action:', action.actionType)
  }

  let immutableAction = Immutable.Map()
  // exclude big chucks that have regular JS in it
  if (
    action.actionType === appConstants.APP_ON_FIRST_LEDGER_SYNC ||
    action.actionType === appConstants.APP_ON_BRAVERY_PROPERTIES ||
    action.actionType === appConstants.APP_ON_LEDGER_INIT_READ
  ) {
    appState = ledgerReducer(appState, action, immutableAction)
  } else {
    // maintain backwards compatibility for now by adding an additional param for immutableAction
    immutableAction = makeImmutable(action)
    appState = applyReducers(appState, action, immutableAction)
  }

  switch (action.actionType) {
    case appConstants.APP_SET_STATE:
      // DO NOT ADD TO THIS LIST
      // See tabsReducer.js for app state init example
      // TODO(bridiver) - these should be refactored into reducers
      appState = filtering.init(appState, action, appStore)
      appState = basicAuth.init(appState, action, appStore)
      if (extensionState.isWebTorrentEnabled(appState)) {
        appState = webtorrent.init(appState, action, appStore)
      }
      appState = profiles.init(appState, action, appStore)
      appState = require('../../app/sync').init(appState, action, appStore)
      calculateTopSites(true, true)
      break
    case appConstants.APP_SHUTTING_DOWN:
      if (action.restart) {
        const args = process.argv.slice(1)
        args.push('--relaunch')
        app.relaunch({args})
      } else {
        appDispatcher.shutdown()
      }
      app.quit()
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
      if (!appState.getIn(['updates', 'weekOfInstallation'])) {
        appState = appState.setIn(['updates', 'weekOfInstallation'], dates.lastMonday(new Date()))
      }
      if (!appState.getIn(['updates', 'promoCode'])) {
        appState = appState.setIn(['updates', 'promoCode'], buildConfig.ref || 'none')
      }
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
      appState = handleChangeSettingAction(appState, action.key, action.value)
      break
    case appConstants.APP_SET_SKIP_SYNC:
      {
        if (appState.getIn(action.path)) {
          appState = appState.setIn(action.path.concat(['skipSync']), action.skipSync)
        }
        break
      }
    case appConstants.APP_SHOW_NOTIFICATION:
      {
        let notifications = appState.get('notifications', Immutable.List()) || Immutable.List()
        notifications = notifications.filterNot((notification) => {
          let message = notification.get('message')
          // action.detail is a regular mutable object only when running tests
          return action.detail.get
            ? message === action.detail.get('message')
            : message === action.detail['message']
        })

        // Insert notification next to those with the same style, or at the end
        let insertIndex = notifications.size
        const style = action.detail
          ? action.detail.get
            ? action.detail.get('options').get('style')
            : action.detail['options']['style']
          : undefined
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
      }
    case appConstants.APP_HIDE_NOTIFICATION:
      {
        const notifications = appState.get('notifications', Immutable.List()) || Immutable.List()
        appState = appState.set('notifications', notifications.filterNot((notification) => {
          return notification.get('message') === action.message
        }))
        break
      }
    case appConstants.APP_TAB_CLOSE_REQUESTED:
      const tabValue = tabState.getByTabId(appState, immutableAction.get('tabId'))
      if (!tabValue) {
        break
      }
      const origin = urlUtil.getOrigin(tabValue.get('url'))

      if (origin) {
        const tabsInOrigin = tabState.getTabs(appState).find((tabValue) =>
          urlUtil.getOrigin(tabValue.get('url')) === origin && tabValue.get('tabId') !== immutableAction.get('tabId'))
        if (!tabsInOrigin) {
          const notifications = appState.get('notifications', Immutable.List()) || Immutable.List()
          appState = appState.set('notifications', notifications.filterNot((notification) => {
            return notification.get('frameOrigin') === origin
          }))
        }
      }
      break
    case appConstants.APP_ON_CLEAR_BROWSING_DATA:
      const defaults = appState.get('clearBrowsingDataDefaults')
      const temp = appState.get('tempClearBrowsingData', Immutable.Map())
      const clearData = defaults ? defaults.merge(temp) : temp

      if (clearData.get('browserHistory')) {
        appState = aboutNewTabState.clearTopSites(appState)
        appState = aboutHistoryState.clearHistory(appState)
        syncActions.clearHistory()
        BrowserWindow.getAllWindows().forEach((wnd) => wnd.webContents.send(messages.CLEAR_CLOSED_FRAMES))
      }
      if (clearData.get('downloadHistory')) {
        handleAppAction({actionType: appConstants.APP_CLEAR_COMPLETED_DOWNLOADS})
      }
      // Site cookies clearing should also clear cache so that every cookies will be properly removed
      if (clearData.get('cachedImagesAndFiles') || clearData.get('allSiteCookies')) {
        filtering.clearCache()
      }
      if (clearData.get('savedPasswords')) {
        handleAppAction({actionType: appConstants.APP_CLEAR_PASSWORDS})
      }
      if (clearData.get('allSiteCookies')) {
        filtering.clearStorageData()
      }
      if (clearData.get('autocompleteData')) {
        autofill.clearAutocompleteData()
      }
      if (clearData.get('autofillData')) {
        autofill.clearAutofillData()
      }
      if (clearData.get('savedSiteSettings')) {
        appState = appState.set('siteSettings', Immutable.Map())
        appState = appState.set('temporarySiteSettings', Immutable.Map())
        syncActions.clearSiteSettings()
      }
      appState = appState.set('tempClearBrowsingData', Immutable.Map())
      appState = appState.set('clearBrowsingDataDefaults', clearData)
      break
    case appConstants.APP_ON_TOGGLE_BROWSING_DATA:
      appState = appState.setIn(['tempClearBrowsingData', action.property], action.newValue)
      break
    case appConstants.APP_ON_CANCEL_BROWSING_DATA:
      appState = appState.set('tempClearBrowsingData', Immutable.Map())
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
      autofill.addAutofillAddress(action.detail)
      break
    case appConstants.APP_REMOVE_AUTOFILL_ADDRESS:
      autofill.removeAutofillAddress(action.detail.get('guid'))
      break
    case appConstants.APP_ADD_AUTOFILL_CREDIT_CARD:
      autofill.addAutofillCreditCard(action.detail)
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
        let isDefaultBrowser
        if (platformUtil.isLinux()) {
          const Channel = require('../../app/channel')
          const desktopName = Channel.getLinuxDesktopName()
          for (const p of defaultProtocols) {
            app.setAsDefaultProtocolClient(p, desktopName)
            app.setAsDefaultProtocolClient('', desktopName)
          }
          isDefaultBrowser = app.isDefaultProtocolClient('', desktopName)
        } else {
          for (const p of defaultProtocols) {
            app.setAsDefaultProtocolClient(p)
          }
          isDefaultBrowser = defaultProtocols.every(p => app.isDefaultProtocolClient(p))
        }
        appState = appState.setIn(['settings', settings.IS_DEFAULT_BROWSER], isDefaultBrowser)
      }
      break
    case appConstants.APP_DEFAULT_BROWSER_CHECK_COMPLETE:
      appState = appState.set('defaultBrowserCheckComplete', {})
      break
    case windowConstants.WINDOW_SET_FAVICON:
      if (action.frameProps.get('favicon') !== action.favicon) {
        appState = bookmarksState.updateFavicon(appState, action.frameProps.get('location'), action.favicon)
        appState = historyState.updateFavicon(appState, action.frameProps, action.favicon)
        calculateTopSites(false)
      }
      break
    case appConstants.APP_RENDER_TO_PDF:
      const pdf = require('../../app/pdf')
      appState = pdf.renderToPdf(appState, action)
      break
    case appConstants.APP_SET_OBJECT_ID:
      let obj = appState.getIn(action.objectPath)
      if (obj && obj.constructor === Immutable.Map) {
        appState = appState.setIn(action.objectPath.concat(['objectId']),
          action.objectId)
        appState = syncUtil.updateObjectCache(appState, obj,
          action.objectPath[0])
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
      appState = syncUtil.createObjectCache(appState)
      break
    case appConstants.APP_RESET_SYNC_DATA:
      const sessionStore = require('../../app/sessionStore')
      const syncDefault = Immutable.fromJS(sessionStore.defaultAppState().sync)
      appState = appState.set('sync', syncDefault)

      // Remember which profile this bookmark was originally synced to.
      // Since old bookmarks should be synced when a new profile is created,
      // we have to keep track of which profile already has these bookmarks
      // or else the old profile may have these bookmarks duplicated. #7405
      const originalSeed = appState.getIn(['sync', 'seed'])
      const setOriginalSeed = (state, objects) => {
        objects.forEach((site, key) => {
          if (!site.has('objectId')) {
            return true
          }
          state = state.setIn([STATE_SITES.BOOKMARKS, key, 'originalSeed'], originalSeed)
        })
        return state
      }
      appState = setOriginalSeed(appState, bookmarksState.getBookmarks(appState))
      appState = setOriginalSeed(appState, bookmarkFoldersState.getFolders(appState))
      appState = appState.setIn(['sync', 'devices'], {})
      appState = appState.setIn(['sync', 'objectsById'], {})
      break
    case appConstants.APP_SET_VERSION_INFO:
      if (action.name && action.version) {
        appState = appState.setIn(['about', 'brave', 'versionInformation', action.name], action.version)
      }
      break
    case appConstants.APP_SHOW_DOWNLOAD_DELETE_CONFIRMATION:
      appState = appState.set('deleteConfirmationVisible', true)
      break
    case appConstants.APP_HIDE_DOWNLOAD_DELETE_CONFIRMATION:
      appState = appState.set('deleteConfirmationVisible', false)
      break
    case appConstants.APP_DEFAULT_SEARCH_ENGINE_LOADED:
      appState = appState.set('searchDetail', action.searchDetail)
      break
    case appConstants.APP_SWIPE_LEFT:
      appState = appState.set('swipeLeftPercent', action.percent)
      break
    case appConstants.APP_SWIPE_RIGHT:
      appState = appState.set('swipeRightPercent', action.percent)
      break
    default:
  }

  if (SHOULD_LOG_TIME) {
    timeLogger.log(timeStart, action.actionType)
  }
  emitChanges()
}

appStore.dispatchToken = appDispatcher.register(handleAppAction)

module.exports = appStore
