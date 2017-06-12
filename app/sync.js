/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const electron = require('electron')
const qr = require('qr-image')
const ipcMain = electron.ipcMain
const locale = require('./locale')
const messages = require('../js/constants/messages')
const siteTags = require('../js/constants/siteTags')
const syncMessages = require('../js/constants/sync/messages')
const categories = require('../js/constants/sync/proto').categories
const writeActions = require('../js/constants/sync/proto').actions
const config = require('../js/constants/appConfig').sync
const syncExtensionId = require('../js/constants/config').syncExtensionId
const appActions = require('../js/actions/appActions')
const syncConstants = require('../js/constants/syncConstants')
const appDispatcher = require('../js/dispatcher/appDispatcher')
const AppStore = require('../js/stores/appStore')
const siteUtil = require('../js/state/siteUtil')
const syncUtil = require('../js/state/syncUtil')
const getSetting = require('../js/settings').getSetting
const settings = require('../js/constants/settings')
const extensions = require('./extensions')

const CATEGORY_MAP = syncUtil.CATEGORY_MAP
const CATEGORY_NAMES = Object.keys(categories)

// The sync background script message sender
let backgroundSender = null

const log = (message) => {
  if (!config.debug) { return }
  console.log(`sync ${new Date().getTime()}:`, message)
}

const syncEnabled = () => {
  return getSetting(settings.SYNC_ENABLED) === true
}

let deviceId = null /** @type {Array|null} */
let pollIntervalId = null

let deviceIdSent = false
let bookmarksToolbarShown = false

// Syncs state diffs to the sync server if needed
const appStoreChangeCallback = function (diffs) {
  if (!backgroundSender) {
    return
  }

  // Fields that should trigger a sync SEND when changed
  const syncFields = {
    sites: ['location', 'tags', 'customTitle', 'folderId', 'parentFolderId'],
    siteSettings: Object.keys(syncUtil.siteSettingDefaults)
  }
  diffs.forEach((diff) => {
    if (!diff || !diff.path) {
      return
    }
    const path = diff.path.split('/')
    if (path.length < 3) {
      // We are looking for paths like ['', 'sites', 'https://brave.com/', 'title']
      return
    }
    const type = path[1]
    const fieldsToPick = syncFields[type]
    if (!fieldsToPick) {
      return
    }

    let action = null

    if (path.length === 3 || path[3] === 'tags') {
      // XXX: adding/removing a tag (e.g. 'bookmark') corresponds to adding/deleting a site record in sync
      if (diff.op === 'add') {
        action = writeActions.CREATE
      } else if (diff.op === 'remove') {
        action = writeActions.DELETE
      }
    } else if (fieldsToPick.includes(path[3])) {
      action = writeActions.UPDATE
    }

    if (action === null) {
      return
    }

    const statePath = path.slice(1, 3).map((item) => item.replace(/~1/g, '/'))
    const state = AppStore.getState()
    const entry = state.getIn(statePath)
    const isSite = type === 'sites'

    if (isSite && action === writeActions.DELETE && !entry) {
      // If we deleted the site, it is no longer availble in appState.
      // Find the corresponding objectId using the sync cache
      // and send this in the sync record
      const objectId = syncUtil.siteKeyToObjectId(state, statePath[1])
      if (objectId) {
        // Delete the site from both history and bookmarks
        sendSyncRecords(backgroundSender, action, [{
          name: 'bookmark',
          objectId,
          value: {}
        }])
        sendSyncRecords(backgroundSender, action, [{
          name: 'historySite',
          objectId,
          value: {}
        }])
      }
    } else if (entry && entry.toJS) {
      const entryJS = entry.toJS()
      if (action === writeActions.DELETE && isSite) {
        const tags = entryJS.tags || []
        sendSyncRecords(backgroundSender, action, [{
          objectId: entryJS.objectId,
          value: {},
          name: tags.includes(siteTags.BOOKMARK) || siteTags.includes(siteTags.BOOKMARK_FOLDER)
            ? 'historySite' // if the site is still a bookmark, it must have been deleted from history
            : 'bookmark'
        }])
      } else {
        sendSyncRecords(backgroundSender, action, [
          isSite ? syncUtil.createSiteData(entryJS, state) : syncUtil.createSiteSettingsData(statePath[1], entryJS)
        ])
      }
    }
  })
}

/**
 * Sends sync records of the same category to the sync server.
 * @param {event.sender} sender
 * @param {number} action
 * @param {Array.<{objectId: Array, name: string, value: Object}>} data
 */
const sendSyncRecords = (sender, action, data) => {
  if (!deviceId) {
    throw new Error('Cannot build a sync record because deviceId is not set')
  }
  if (!data || !data.length || !data[0]) {
    return
  }
  const category = CATEGORY_MAP[data[0].name]
  if (!category ||
    (category.settingName && !getSetting(settings[category.settingName]))) {
    return
  }
  sender.send(syncMessages.SEND_SYNC_RECORDS, category.categoryName, data.map((item) => {
    if (!item || !item.name || !item.value || !item.objectId) {
      return
    }
    return {
      action,
      deviceId,
      objectId: item.objectId,
      [item.name]: item.value
    }
  }))
}

const dispatcherCallback = (action) => {
  if (!backgroundSender) {
    return
  }

  if (action.key === settings.SYNC_ENABLED) {
    if (action.value === false) {
      module.exports.stop()
    }
  }
  // If sync is not enabled, the following actions should be ignored.
  if (!syncEnabled() || backgroundSender.isDestroyed()) {
    return
  }
  switch (action.actionType) {
    case syncConstants.SYNC_CLEAR_HISTORY:
      backgroundSender.send(syncMessages.DELETE_SYNC_CATEGORY, CATEGORY_MAP.historySite.categoryName)
      break
    case syncConstants.SYNC_CLEAR_SITE_SETTINGS:
      backgroundSender.send(syncMessages.DELETE_SYNC_SITE_SETTINGS)
      break
    default:
  }
}

/**
 * Called when sync client is done initializing.
 * @param {boolean} isFirstRun - whether this is the first time sync is running
 * @param {Event} e
 */
module.exports.onSyncReady = (isFirstRun, e) => {
  appActions.setSyncSetupError(null)
  if (!syncEnabled()) {
    return
  }
  AppStore.addChangeListener(appStoreChangeCallback)

  if (!deviceIdSent && isFirstRun) {
    // Sync the device id for this device
    sendSyncRecords(e.sender, writeActions.CREATE, [{
      name: 'device',
      objectId: syncUtil.newObjectId(['sync']),
      value: {
        name: getSetting(settings.SYNC_DEVICE_NAME)
      }
    }])
    deviceIdSent = true
  }
  const appState = AppStore.getState()
  const sites = appState.get('sites') || new Immutable.List()
  const seed = appState.get('seed') || new Immutable.List()

  /**
   * Sync a bookmark that has not been synced yet, first syncing the parent
   * folder if needed. For folders, set and memoize folderId to ensure
   * consistent parentFolderObjectIds.
   * Otherwise siteUtil.createSiteData() will generate new objectIds every
   * call; there's not enough time to dispatch id updates to appStore.sites.
   * @param {Immutable.Map} site
   */
  const folderToObjectId = {}
  const shouldSyncBookmark = (site) => {
    if (!site) { return false }
    // originalSeed is set on reset to prevent synced bookmarks on a device
    // from being  re-synced.
    const originalSeed = site.get('originalSeed')
    if (site.get('objectId') && (!originalSeed || seed.equals(originalSeed))) {
      return false
    }
    if (folderToObjectId[site.get('folderId')]) { return false }
    return syncUtil.isSyncable('bookmark', site)
  }
  const syncBookmark = (site) => {
    const siteJS = site.toJS()

    const parentFolderId = site.get('parentFolderId')
    if (typeof parentFolderId === 'number') {
      if (!folderToObjectId[parentFolderId]) {
        const folderResult = siteUtil.getFolder(sites, parentFolderId)
        if (folderResult) {
          syncBookmark(folderResult[1])
        }
      }
      siteJS.parentFolderObjectId = folderToObjectId[parentFolderId]
    }

    const record = syncUtil.createSiteData(siteJS)
    const folderId = site.get('folderId')
    if (typeof folderId === 'number') {
      folderToObjectId[folderId] = record.objectId
    }

    sendSyncRecords(e.sender, writeActions.CREATE, [record])
  }

  // Sync bookmarks that have not been synced yet.
  siteUtil.getBookmarks(sites).filter(site => shouldSyncBookmark(site))
    .sortBy(site => site.get('order'))
    .forEach(syncBookmark)

  // Sync site settings that have not been synced yet
  // FIXME: If Sync was disabled and settings were changed, those changes
  // might not be synced.
  const siteSettings =
    appState.get('siteSettings').filter((value, key) => {
      return !value.get('objectId') && syncUtil.isSyncable('siteSetting', value)
    }).toJS()
  if (siteSettings) {
    sendSyncRecords(e.sender, writeActions.UPDATE,
      Object.keys(siteSettings).map((item) => {
        return syncUtil.createSiteSettingsData(item, siteSettings[item])
      }))
  }

  appActions.createSyncCache()
  e.sender.send(syncMessages.FETCH_SYNC_DEVICES)

  // Periodically poll for new records
  let startAt = appState.getIn(['sync', 'lastFetchTimestamp']) || 0
  const poll = () => {
    let categoryNames = []
    for (let type in CATEGORY_MAP) {
      let item = CATEGORY_MAP[type]
      if (item.settingName && getSetting(settings[item.settingName]) === true) {
        categoryNames.push(item.categoryName)
      }
    }
    e.sender.send(syncMessages.FETCH_SYNC_RECORDS, categoryNames, startAt)
    startAt = syncUtil.now()
    appActions.saveSyncInitData(null, null, startAt)
  }
  poll()
  pollIntervalId = setInterval(poll, config.fetchInterval)
}

/**
 * Called to initialize sync, regardless of whether it is enabled.
 * @param {Object} initialState - initial appState.sync
 */
module.exports.init = function (appState) {
  const initialState = appState.get('sync') || new Immutable.Map()
  const reset = () => {
    log('Resetting browser local sync state.')
    appActions.changeSetting(settings.SYNC_ENABLED, false)
    appActions.changeSetting(settings.SYNC_DEVICE_NAME, undefined)
    appActions.resetSyncData()
  }
  // sent by about:preferences when sync should be reloaded
  ipcMain.on(messages.RELOAD_SYNC_EXTENSION, () => {
    extensions.reloadExtension(syncExtensionId)
  })
  // sent by about:preferences when resetting sync
  ipcMain.on(messages.RESET_SYNC, (e) => {
    if (backgroundSender) {
      // send DELETE_SYNC_USER to sync client. it replies with DELETED_SYNC_USER
      backgroundSender.send(syncMessages.DELETE_SYNC_USER)
    } else {
      reset()
    }
  })
  ipcMain.on(syncMessages.DELETED_SYNC_USER, (e) => {
    reset()
  })
  // GET_INIT_DATA is the first message sent by the sync-client when it starts
  ipcMain.on(syncMessages.GET_INIT_DATA, (e) => {
    // Set the message sender
    backgroundSender = e.sender
    // Clear any old errors
    appActions.setSyncSetupError(null)
    // Unregister the previous dispatcher cb
    if (dispatcherCallback) {
      appDispatcher.unregister(dispatcherCallback)
    }
    // Register the dispatcher callback now that we have a valid sender
    appDispatcher.register(dispatcherCallback)
    // Send the initial data
    if (syncEnabled()) {
      const appState = AppStore.getState().get('sync')
      const seed = appState.get('seed') ? Array.from(appState.get('seed')) : null
      deviceId = appState.get('deviceId') ? Array.from(appState.get('deviceId')) : null
      const syncConfig = {
        apiVersion: config.apiVersion,
        debug: config.debug,
        serverUrl: getSetting(settings.SYNC_NETWORK_DISABLED)
          ? 'http://localhost' // set during tests to simulate network failure
          : config.serverUrl
      }
      e.sender.send(syncMessages.GOT_INIT_DATA, seed, deviceId, syncConfig)
    }
  })
  // SAVE_INIT_DATA is sent by about:preferences before sync is enabled
  // when restoring from an existing seed
  ipcMain.on(syncMessages.SAVE_INIT_DATA, (e, seed, newDeviceId) => {
    const isRestoring = seed && !newDeviceId
    if (!deviceId && newDeviceId) {
      deviceId = Array.from(newDeviceId)
    }
    if (!seed && newDeviceId) {
      appActions.saveSyncInitData(null, new Immutable.List(newDeviceId), null)
      return
    }
    try {
      let chunks = []
      qr.image(Buffer.from(seed).toString('hex')).on('data', (chunk) => {
        chunks.push(chunk)
      }).on('end', () => {
        let seedQr = 'data:image/png;base64,' + Buffer.concat(chunks).toString('base64')
        appActions.saveSyncInitData(new Immutable.List(seed),
          newDeviceId ? new Immutable.List(newDeviceId) : null, null, seedQr)
      })
    } catch (ex) {
      console.log('qr image error: ' + ex.toString())
      appActions.saveSyncInitData(new Immutable.List(seed),
        newDeviceId ? new Immutable.List(newDeviceId) : null)
    }
    if (isRestoring) {
      // we are restoring from a previous seed. wait for the seed to be saved
      // before reloading, or sync-client will override the seed.
      extensions.reloadExtension(syncExtensionId)
    }
  })
  const isFirstRun = !initialState.get('seed') && !initialState.get('deviceId')
  ipcMain.on(syncMessages.SYNC_READY, module.exports.onSyncReady.bind(null,
    isFirstRun))
  ipcMain.on(syncMessages.SYNC_DEBUG, (e, msg) => {
    log(msg)
  })
  ipcMain.on(syncMessages.SYNC_SETUP_ERROR, (e, error) => {
    if (error === 'Failed to fetch') {
      // This is probably the most common error, so give it a more useful message.
      error = locale.translation('connectionError')
    }
    appActions.setSyncSetupError(error || locale.translation('unknownError'))
  })
  ipcMain.on(syncMessages.GET_EXISTING_OBJECTS, (event, categoryName, records) => {
    if (!syncEnabled()) {
      return
    }
    let devices = {}
    log(`getting existing objects for ${records.length} ${categoryName}`)
    if (!CATEGORY_NAMES.includes(categoryName) || !records || !records.length) {
      return
    }
    const recordsAndExistingObjects = records.map((record) => {
      const safeRecord = syncUtil.ipcSafeObject(record)
      const deviceId = syncUtil.deviceIdString(safeRecord.deviceId)
      devices[deviceId] = {lastRecordTimestamp: record.syncTimestamp}
      const existingObject = syncUtil.getExistingObject(categoryName, record)
      return [safeRecord, existingObject]
    })
    event.sender.send(syncMessages.RESOLVE_SYNC_RECORDS, categoryName, recordsAndExistingObjects)
    // For each device we saw, update its last record timestamp.
    appActions.saveSyncDevices(devices)
  })
  ipcMain.on(syncMessages.RESOLVED_SYNC_RECORDS, (event, categoryName, records) => {
    if (!records || !records.length) {
      return
    }
    if (!bookmarksToolbarShown && isFirstRun) {
      // syncing for the first time
      const bookmarks = siteUtil.getBookmarks(AppStore.getState().get('sites'))
      if (!bookmarks.size) {
        for (const record of records) {
          if (record && record.objectData === 'bookmark') {
            appActions.changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
            bookmarksToolbarShown = true
            break
          }
        }
      }
    }
    syncUtil.applySyncRecords(records)
  })
  return appState
}

/**
 * Called when sync is disabled.
 */
module.exports.stop = function () {
  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId)
  }
  appActions.setSyncSetupError(null)
  AppStore.removeChangeListener(appStoreChangeCallback)
}
