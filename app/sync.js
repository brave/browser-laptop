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
const syncActions = require('../js/constants/sync/proto').actions
const config = require('../js/constants/appConfig').sync
const appActions = require('../js/actions/appActions')
const appConstants = require('../js/constants/appConstants')
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
      objectId: Array.from(crypto.randomBytes(16)),
      [item.name]: item.value
    }
  }))
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
 * @returns {{name: string, value: object}}
 */
const createSiteData = (site) => {
  const siteData = {
    location: '',
    title: '',
    customTitle: '',
    lastAccessedTime: 0,
    creationTime: 0
  }
  for (let field in site) {
    siteData[field] = site[field]
  }
  if (isBookmark(site)) {
    return {
      name: 'bookmark',
      value: {
        site: siteData,
        isFolder: site.tags.includes('bookmark-folder'),
        folderId: site.folderId || 0,
        parentFolderId: site.parentFolderId || 0
      }
    }
  } else if (!site.tags || !site.tags.length) {
    return {
      name: 'historySite',
      value: siteData
    }
  }
}

/**
 * Converts a site settings object into input for sendSyncRecords
 * @param {string} hostPattern
 * @param {Object} setting
 * @returns {{name: string, value: object}}
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
    } else {
      value[field] = setting[field]
    }
  }

  return {
    name: 'siteSetting',
    value
  }
}

const doAction = (sender, action) => {
  switch (action.actionType) {
    case appConstants.APP_ADD_SITE:
      if (action.siteDetail.constructor === Immutable.Map) {
        sendSyncRecords(sender, syncActions.CREATE, [createSiteData(action.siteDetail.toJS())])
      }
      break
    case appConstants.APP_REMOVE_SITE:
      if (action.siteDetail.constructor === Immutable.Map) {
        sendSyncRecords(sender, syncActions.DELETE, [createSiteData(action.siteDetail.toJS())])
      }
      break
    default:
  }
}

/**
 * Called when sync client is done initializing.
 * @param {boolean} isFirstRun - whether this is the first time sync is running
 * @param {number} lastFetchTimestamp - timestamp in s when the last sync fetch occured
 * @param {Event} e
 */
module.exports.onSyncReady = (isFirstRun, lastFetchTimestamp, e) => {
  appDispatcher.register(doAction.bind(null, e.sender))
  if (isFirstRun) {
    // Sync the device id for this device
    sendSyncRecords(e.sender, syncActions.CREATE, [{
      name: 'device',
      value: {
        name: 'browser-laptop' // todo: support user-chosen names
      }
    }])
    // Sync old data
    const appState = AppStore.getState()
    const sites = appState.get('sites').toJS()
    const bookmarks = sites ? sites.filter(isBookmark) : null
    if (bookmarks) {
      // Don't sync full history for now to save bandwidth
      sendSyncRecords(e.sender, syncActions.CREATE, bookmarks.map(createSiteData))
    }
    const siteSettings = appState.get('siteSettings').toJS()
    if (siteSettings) {
      sendSyncRecords(e.sender, syncActions.CREATE,
        Object.keys(siteSettings).map((item) => {
          return createSiteSettingsData(item, siteSettings[item])
        }))
    }
  }
  ipcMain.on(messages.RECEIVE_SYNC_RECORDS, (event, categoryName, records) => {
    if (categoryNames.includes(categoryName) || !records || !records.length) {
      return
    }
    // TODO: update appstate
  })
  // Periodically poll for new records
  let startAt = lastFetchTimestamp
  setInterval(() => {
    e.sender.send(messages.FETCH_SYNC_RECORDS, categoryNames, startAt)
    startAt = now()
    appActions.saveSyncInitData(null, null, startAt)
  }, config.fetchInterval)
}

module.exports.init = function (initialState) {
  if (config.enabled !== true) {
    return
  }
  ipcMain.on(messages.GET_INIT_DATA, (e) => {
    const seed = initialState.seed ? initialState.seed.data : null
    const savedDeviceId = initialState.deviceId ? initialState.deviceId.data : null
    deviceId = savedDeviceId
    e.sender.send(messages.GOT_INIT_DATA, seed, deviceId, config)
  })
  ipcMain.on(messages.SAVE_INIT_DATA, (e, seed, newDeviceId) => {
    if (!deviceId && newDeviceId) {
      deviceId = Array.from(newDeviceId)
    }
    appActions.saveSyncInitData(seed, newDeviceId)
  })
  ipcMain.on(messages.SYNC_READY, module.exports.onSyncReady.bind(null,
    !initialState.seed && !initialState.deviceId,
    initialState.lastFetchTimestamp || 0))
  ipcMain.on(messages.SYNC_DEBUG, (e, msg) => {
    console.log('sync-client:', msg)
  })
}
