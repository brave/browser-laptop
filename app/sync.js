/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const electron = require('electron')
const crypto = require('crypto')
const ipcMain = electron.ipcMain
const messages = require('../js/constants/sync/messages')
const categories = require('../js/constants/sync/proto').categories
const writeActions = require('../js/constants/sync/proto').actions
const config = require('../js/constants/appConfig').sync
const appActions = require('../js/actions/appActions')
const syncConstants = require('../js/constants/syncConstants')
const appDispatcher = require('../js/dispatcher/appDispatcher')
const AppStore = require('../js/stores/appStore')

const categoryNames = Object.keys(categories)
const categoryMap = {
  'bookmark': 'BOOKMARKS',
  'historySite': 'HISTORY_SITES',
  'siteSetting': 'PREFERENCES',
  'device': 'PREFERENCES'
}

let deviceId = null /** @type {Array|null} */
let pollIntervalId = null

/**
 * Gets current time in seconds
 */
const now = () => {
  return Math.floor(Date.now() / 1000)
}

/**
 * Sends sync records of the same category to the sync server.
 * @param {event.sender} sender
 * @param {number} action
 * @param {Array.<{name: string, value: Object}>} data
 */
const sendSyncRecords = (sender, action, data) => {
  if (!deviceId) {
    throw new Error('Cannot build a sync record because deviceId is not set')
  }
  if (!data || !data.length) {
    return
  }
  const category = categoryMap[data[0].name]
  sender.send(messages.SEND_SYNC_RECORDS, category, data.map((item) => {
    if (!item || !item.name || !item.value) {
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

/**
 * Sets a new object ID for an existing object in appState
 * @param {Array.<string>} objectPath - Path to get to the object from appState root,
 *   for use with Immutable.setIn
 * @returns {Array.<number>}
 */
const newObjectId = (objectPath) => {
  const objectId = new Immutable.List(crypto.randomBytes(16))
  appActions.setObjectId(objectId, objectPath)
  return objectId.toJS()
}

/**
 * Checks whether a site is a bookmark or a bookmark folder
 * @param {Object} site
 * @returns {boolean}
 */
const isBookmark = (site) => {
  return (site.tags &&
    (site.tags.includes('bookmark') || site.tags.includes('bookmark-folder')))
}

/**
 * Converts a site object into input for sendSyncRecords
 * @param {Object} site
 * @param {number=} siteIndex
 * @returns {{name: string, value: object, objectId: Array.<number>}}
 */
const createSiteData = (site, siteIndex) => {
  const siteData = {
    location: '',
    title: '',
    customTitle: '',
    lastAccessedTime: 0,
    creationTime: 0
  }
  for (let field in site) {
    if (field in siteData) {
      siteData[field] = site[field]
    }
  }
  if (isBookmark(site)) {
    if (!site.objectId && typeof siteIndex !== 'number') {
      throw new Error('Missing bookmark objectId.')
    }
    return {
      name: 'bookmark',
      objectId: site.objectId || newObjectId(['sites', siteIndex]),
      value: {
        site: siteData,
        isFolder: site.tags.includes('bookmark-folder'),
        folderId: site.folderId || 0,
        parentFolderId: site.parentFolderId || 0
      }
    }
  } else if (!site.tags || !site.tags.length) {
    if (!site.objectId && typeof siteIndex !== 'number') {
      throw new Error('Missing historySite objectId.')
    }
    return {
      name: 'historySite',
      objectId: site.objectId || newObjectId(['sites', siteIndex]),
      value: siteData
    }
  }
}

/**
 * Converts a site settings object into input for sendSyncRecords
 * @param {string} hostPattern
 * @param {Object} setting
 * @returns {{name: string, value: object, objectId: Array.<number>}}
 */
const createSiteSettingsData = (hostPattern, setting) => {
  const adControlEnum = {
    showBraveAds: 0,
    blockAds: 1,
    allowAdsAndTracking: 2
  }
  const cookieControlEnum = {
    block3rdPartyCookie: 0,
    allowAllCookies: 1
  }
  const value = {
    hostPattern: hostPattern || '',
    zoomLevel: 0,
    shieldsUp: true,
    adControl: 1,
    cookieControl: 0,
    safeBrowsing: true,
    noScript: false,
    httpsEverywhere: true,
    fingerprintingProtection: false,
    ledgerPayments: true,
    ledgerPaymentsShown: true
  }

  for (let field in setting) {
    if (field === 'adControl') {
      value.adControl = adControlEnum[setting.adControl]
    } else if (field === 'cookieControl') {
      value.cookieControl = cookieControlEnum[setting.cookieControl]
    } else if (field in value) {
      value[field] = setting[field]
    }
  }

  return {
    name: 'siteSetting',
    objectId: setting.objectId || newObjectId(['siteSettings', hostPattern]),
    value
  }
}

const doAction = (sender, action) => {
  if (!action.item || !action.item.toJS) {
    return
  }
  // Only accept items who have an objectId set already
  if (!action.item.get('objectId')) {
    console.log('Missing object ID!', action.item.toJS())
    return
  }
  switch (action.actionType) {
    case syncConstants.SYNC_ADD_SITE:
      sendSyncRecords(sender, writeActions.CREATE, [createSiteData(action.item.toJS())])
      break
    case syncConstants.SYNC_UPDATE_SITE:
      sendSyncRecords(sender, writeActions.UPDATE, [createSiteData(action.item.toJS())])
      break
    case syncConstants.SYNC_REMOVE_SITE:
      sendSyncRecords(sender, writeActions.DELETE, [createSiteData(action.item.toJS())])
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
  appDispatcher.register(doAction.bind(null, e.sender))
  if (isFirstRun) {
    // Sync the device id for this device
    sendSyncRecords(e.sender, writeActions.CREATE, [{
      name: 'device',
      objectId: newObjectId(['sync']),
      value: {
        name: 'browser-laptop' // todo: support user-chosen names
      }
    }])
  }
  // Sync bookmarks that have not been synced yet
  const appState = AppStore.getState()
  const sites = appState.get('sites').toJS() || []
  sites.forEach((site, i) => {
    if (site && !site.objectId && isBookmark(site)) {
      sendSyncRecords(e.sender, writeActions.CREATE, [createSiteData(site, i)])
    }
  })
  // Sync site settings in case they changed while sync was disabled
  const siteSettings = appState.get('siteSettings').toJS()
  if (siteSettings) {
    sendSyncRecords(e.sender, writeActions.UPDATE,
      Object.keys(siteSettings).map((item) => {
        return createSiteSettingsData(item, siteSettings[item])
      }))
  }
  ipcMain.on(messages.RECEIVE_SYNC_RECORDS, (event, categoryName, records) => {
    if (categoryNames.includes(categoryName) || !records || !records.length) {
      return
    }
    // TODO (Ayumi): get existing objects with objectId, send
    // RESOLVE_SYNC_RECORDS, handle RESOLVED_SYNC_RECORDS
  })
  // Periodically poll for new records
  let startAt = appState.getIn(['sync', 'lastFetchTimestamp']) || 0
  const poll = () => {
    e.sender.send(messages.FETCH_SYNC_RECORDS, categoryNames, startAt)
    startAt = now()
    appActions.saveSyncInitData(null, null, startAt)
  }
  poll()
  pollIntervalId = setInterval(poll, config.fetchInterval)
}

module.exports.init = function (initialState) {
  if (config.enabled !== true) {
    return
  }
  ipcMain.on(messages.GET_INIT_DATA, (e) => {
    const seed = initialState.seed || null
    deviceId = initialState.deviceId || null
    e.sender.send(messages.GOT_INIT_DATA, seed, deviceId, config)
  })
  ipcMain.on(messages.SAVE_INIT_DATA, (e, seed, newDeviceId) => {
    if (!deviceId && newDeviceId) {
      deviceId = Array.from(newDeviceId)
    }
    appActions.saveSyncInitData(new Immutable.List(seed),
      new Immutable.List(newDeviceId))
  })
  ipcMain.on(messages.SYNC_READY, module.exports.onSyncReady.bind(null,
    !initialState.seed && !initialState.deviceId))
  ipcMain.on(messages.SYNC_DEBUG, (e, msg) => {
    console.log('sync-client:', msg)
  })
}

module.exports.stop = function () {
  clearInterval(pollIntervalId)
}
