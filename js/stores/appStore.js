/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')
const Immutable = require('immutable')
const {EventEmitter} = require('events')
const assert = require('assert')
const diff = require('immutablediff')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

// Constants
const appConstants = require('../constants/appConstants')
const windowConstants = require('../constants/windowConstants')
const ExtensionConstants = require('../../app/common/constants/extensionConstants')
const settings = require('../constants/settings')
const {STATE_SITES} = require('../constants/stateConstants')
const messages = require('../constants/messages')

// State
const syncUtil = require('../state/syncUtil')
const siteSettings = require('../state/siteSettings')
const basicAuthState = require('../../app/common/state/basicAuthState')
const extensionState = require('../../app/common/state/extensionState')
const aboutNewTabState = require('../../app/common/state/aboutNewTabState')
const aboutHistoryState = require('../../app/common/state/aboutHistoryState')
const tabState = require('../../app/common/state/tabState')
const bookmarksState = require('../../app/common/state/bookmarksState')
const bookmarkFoldersState = require('../../app/common/state/bookmarkFoldersState')
const historyState = require('../../app/common/state/historyState')

// Actions
const syncActions = require('../actions/syncActions')

// Utils
const AppDispatcher = require('../dispatcher/appDispatcher')
const UpdateStatus = require('../constants/updateStatus')
const dates = require('../../app/dates')
const debounce = require('../lib/debounce')
const autofill = require('../../app/autofill')
const nativeImage = require('../../app/nativeImage')
const filtering = require('../../app/filtering')
const basicAuth = require('../../app/browser/basicAuth')
const webtorrent = require('../../app/browser/webtorrent')
const {calculateTopSites} = require('../../app/browser/api/topSites')
const profiles = require('../../app/browser/profiles')
const {zoomLevel} = require('../../app/common/constants/toolbarUserInterfaceScale')
const {makeImmutable} = require('../../app/common/state/immutableUtil')
const urlUtil = require('../lib/urlutil')
const windowApi = require('../../app/browser/api/windowApi')

// Only used internally
const CHANGE_EVENT = 'app-state-change'

const defaultProtocols = ['https', 'http']

let appState = null
let initialized = false

class AppStore extends EventEmitter {
  constructor () {
    super()
    this.lastEmittedState = null
  }

  getState () {
    return appState
  }

  emitChanges () {
    if (this.lastEmittedState) {
      const d = diff(this.lastEmittedState, appState)
      if (!d.isEmpty()) {
        BrowserWindow.getAllWindows().forEach((wnd) => {
          if (wnd.webContents && !wnd.webContents.isDestroyed()) {
            wnd.webContents.send(messages.APP_STATE_CHANGE, { stateDiff: d.toJS() })
          }
        })
        this.lastEmittedState = appState
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

  getLastEmmitedState () {
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
      require('../../app/browser/reducers/bookmarksReducer'),
      require('../../app/browser/reducers/bookmarkFoldersReducer'),
      require('../../app/browser/reducers/historyReducer'),
      require('../../app/browser/reducers/pinnedSitesReducer'),
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
      require('../../app/browser/reducers/topSitesReducer'),
      require('../../app/ledger').doAction,
      require('../../app/browser/menu')
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
      appState = require('../../app/sync').init(appState, action, appStore)
      calculateTopSites(true, true)
      break
    case appConstants.APP_SHUTTING_DOWN:
      AppDispatcher.shutdown()
      app.quit()
      break
    case appConstants.APP_NEW_WINDOW:
      appState = windowApi.createWindow(action, appState)
      break
    case appConstants.APP_CHANGE_NEW_TAB_DETAIL:
      appState = aboutNewTabState.mergeDetails(appState, action)
      if (action.refresh) {
        calculateTopSites(true, true)
      }
      break
    case appConstants.APP_DATA_URL_COPIED:
      nativeImage.copyDataURL(action.dataURL, action.html, action.text)
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
          siteSettings.mergeSiteSetting(appState.get(propertyName), urlUtil.getOrigin(action.url), 'flash', 1))
        break
      }
    case appConstants.APP_ALLOW_FLASH_ALWAYS:
      {
        const propertyName = action.isPrivate ? 'temporarySiteSettings' : 'siteSettings'
        const expirationTime = Date.now() + (7 * 24 * 3600 * 1000)
        appState = appState.set(propertyName,
          siteSettings.mergeSiteSetting(appState.get(propertyName), urlUtil.getOrigin(action.url), 'flash', expirationTime))
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
      const origin = urlUtil.getOrigin(tabValue.get('url'))

      if (origin) {
        const tabsInOrigin = tabState.getTabs(appState).find((tabValue) =>
          urlUtil.getOrigin(tabValue.get('url')) === origin && tabValue.get('tabId') !== immutableAction.get('tabId'))
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
      if (action.frameProps.get('favicon') !== action.favicon) {
        appState = bookmarksState.updateFavicon(appState, action.frameProps.get('location'), action.favicon)
        appState = historyState.updateFavicon(appState, action.frameProps, action.favicon)
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
    case appConstants.APP_SWIPE_LEFT:
      appState = appState.set('swipeLeftPercent', action.percent)
      break
    case appConstants.APP_SWIPE_RIGHT:
      appState = appState.set('swipeRightPercent', action.percent)
      break
    default:
  }

  emitChanges()
}

appStore.dispatchToken = AppDispatcher.register(handleAppAction)

module.exports = appStore
