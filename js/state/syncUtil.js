/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const appActions = require('../actions/appActions')
const crypto = require('crypto')
const writeActions = require('../constants/sync/proto').actions
const {getSetting} = require('../settings')
const {isDataUrl} = require('../lib/urlutil')
const FunctionBuffer = require('../lib/functionBuffer')
const bookmarkUtil = require('../../app/common/lib/bookmarkUtil')
const bookmarkFoldersState = require('../../app/common/state/bookmarkFoldersState')
const bookmarkFoldersUtil = require('../../app/common/lib/bookmarkFoldersUtil')
const settings = require('../constants/settings')
const historyUtil = require('../../app/common/lib/historyUtil')

const {STATE_SITES} = require('../constants/stateConstants')

const CATEGORY_MAP = {
  bookmark: {
    categoryName: 'BOOKMARKS',
    settingName: 'SYNC_TYPE_BOOKMARK'
  },
  historySite: {
    categoryName: 'HISTORY_SITES',
    settingName: 'SYNC_TYPE_HISTORY'
  },
  siteSetting: {
    categoryName: 'PREFERENCES',
    settingName: 'SYNC_TYPE_SITE_SETTING'
  },
  device: {
    categoryName: 'PREFERENCES'
  }
}
module.exports.CATEGORY_MAP = CATEGORY_MAP

module.exports.siteSettingDefaults = {
  hostPattern: '',
  zoomLevel: 0,
  shieldsUp: true,
  adControl: 1,
  cookieControl: 0,
  safeBrowsing: true,
  noScript: false,
  httpsEverywhere: true,
  fingerprintingProtection: false,
  ledgerPayments: true,
  ledgerPaymentsShown: true,
  ledgerPinPercentage: 0
}

// Whitelist of valid browser-laptop site fields. In browser-laptop, site
// is used for both bookmarks and history sites.
const SITE_FIELDS = [
  'objectId',
  'location',
  'title',
  'favicon',
  'themeColor',
  'lastAccessedTime',
  'creationTime',
  'partitionNumber',
  'folderId',
  'parentFolderId'
]

// The Sync cache maps {sync objectId} -> {app state object path}
// See createObjectCache() and updateObjectCache().
const STATE_SITES_VALUES = Object.values(STATE_SITES)
const CACHED_STATE_COLLECTIONS = STATE_SITES_VALUES

const pickFields = (object, fields) => {
  return fields.reduce((a, x) => {
    if (object.hasOwnProperty(x)) { a[x] = object[x] }
    return a
  }, {})
}

/**
 * Convert deviceId to a type better suited for object keys.
 * @param {Array.<number>} deviceId
 * @returns {string}
 */
const deviceIdString = (deviceId) => {
  return deviceId.join('|')
}
module.exports.deviceIdString = deviceIdString

// Cache of bookmark folder object IDs mapped to folder IDs
// Used when receiving folder records
let objectToFolderMap = new Immutable.Map()
// Cache of folder IDs mapped to object IDs to prevent double-assigning object IDs to
// folders due to delay in appState propagation. See
// https://github.com/brave/browser-laptop/issues/8892#issuecomment-307954974
// Used when sending folder records
const folderToObjectMap = {}

const getBookmarkSiteDataFromRecord = (siteProps, appState, records, existingObjectData) => {
  const newSiteProps = Object.assign({}, siteProps)
  const existingFolderId = existingObjectData && existingObjectData.get('folderId')
  if (existingFolderId) {
    newSiteProps.folderId = existingFolderId
  }
  const parentFolderObjectId = newSiteProps.parentFolderObjectId
  if (parentFolderObjectId && parentFolderObjectId.length > 0) {
    newSiteProps.parentFolderId =
      getFolderIdByObjectId(new Immutable.List(parentFolderObjectId), appState, records)
  } else {
    // Null or empty parentFolderObjectId on a record corresponds to
    // a top-level bookmark. -1 indicates a hidden bookmark (Other bookmarks).
    newSiteProps.parentFolderId = siteProps.hideInToolbar ? -1 : 0
  }
  return newSiteProps
}

/**
 * Converts sync bookmark and history records into an object that can be
 * consumed by AppStore actions.
 * @param {Object} record
 * @param {Immutable.Map} appState
 * @param {Immutable.List=} records - batch of records possibly not yet applied
 * @returns {Object}
 */
module.exports.getSiteDataFromRecord = (record, appState, records) => {
  const objectId = new Immutable.List(record.objectId)
  const category = CATEGORY_MAP[record.objectData].categoryName
  let existingObjectData

  if (record.action !== writeActions.CREATE) {
    const existingObject = getObjectById(objectId, category,
      appState)
    existingObjectData = existingObject && existingObject[1]
  }

  let siteProps = Object.assign(
    {},
    existingObjectData && existingObjectData.toJS(),
    record.historySite,
    record.bookmark,
    record.bookmark && record.bookmark.site,
    {objectId}
  )
  // customTitle was previously used in browser-laptop
  if (siteProps.customTitle) {
    siteProps.title = siteProps.customTitle
  }
  delete siteProps.customTitle
  if (record.objectData === 'bookmark') {
    siteProps = getBookmarkSiteDataFromRecord(siteProps, appState, records, existingObjectData)
  }
  return new Immutable.Map(pickFields(siteProps, SITE_FIELDS))
}

const applySiteSettingRecord = (record) => {
  // TODO: In Sync lib syncRecordAsJS() convert Enums into strings
  const adControlEnum = {
    0: 'showBraveAds',
    1: 'blockAds',
    2: 'allowAdsAndTracking'
  }
  const cookieControlEnum = {
    0: 'block3rdPartyCookie',
    1: 'allowAllCookies',
    2: 'blockAllCookies'
  }
  const getValue = (key, value) => {
    if (key === 'adControl') {
      return adControlEnum[value]
    } else if (key === 'cookieControl') {
      return cookieControlEnum[value]
    } else {
      return value
    }
  }
  const hostPattern = record.siteSetting.hostPattern
  if (!hostPattern) {
    throw new Error('siteSetting.hostPattern is required.')
  }

  let applySetting = null
  switch (record.action) {
    case writeActions.CREATE:
    case writeActions.UPDATE:
      applySetting = (key, value) => {
        const applyValue = getValue(key, value)
        appActions.changeSiteSetting(hostPattern, key, applyValue, false, true)
      }
      break
    case writeActions.DELETE:
      applySetting = (key, _value) => {
        appActions.removeSiteSetting(hostPattern, key, false, true)
      }
      break
  }

  // Set the record objectId if it doesn't exist already
  appActions.changeSiteSetting(hostPattern, 'objectId', new Immutable.List(record.objectId), false, true)
  for (let key in record.siteSetting) {
    if (key === 'hostPattern') { continue }
    applySetting(key, record.siteSetting[key])
  }
}

const applyNonBatchedRecords = (records) => {
  if (!records.length) { return }
  setImmediate(() => {
    const record = records.shift()
    applySyncRecord(record)
    applyNonBatchedRecords(records)
  })
}

/**
 * Given a SyncRecord, apply it to the browser data store.
 * @param {Object} record
 */
const applySyncRecord = (record) => {
  if (!record || !record.objectData) {
    console.log(`Warning: Can't apply empty record: ${record}`)
    return
  }
  switch (record.objectData) {
    case 'bookmark':
    case 'historySite':
      // these are handled in batches now
      console.log(`Warning: Skipping unexpected site record: ${record}`)
      break
    case 'siteSetting':
      applySiteSettingRecord(record)
      break
    case 'device':
      const device = Object.assign({}, record.device, {lastRecordTimestamp: record.syncTimestamp})
      appActions.saveSyncDevices({
        [deviceIdString(record.deviceId)]: device
      })
      break
    default:
      throw new Error(`Invalid record objectData: ${record.objectData}`)
  }
}

const assignFolderIdsToRecords = (records, state) => {
  const folders = bookmarkFoldersState.getFolders(state)
  let nextFolderId = bookmarkFoldersUtil.getNextFolderId(folders)
  return records.map(record => {
    if (record.action !== writeActions.DELETE &&
      record.bookmark && record.bookmark.isFolder &&
      record.bookmark.site &&
      typeof record.bookmark.site.folderId !== 'number') {
      record.bookmark.site.folderId = nextFolderId
      nextFolderId = nextFolderId + 1
    }
    return record
  })
}

/**
 * Apply several SyncRecords in a less blocking manner.
 * @param {Array<Object>} records
 */
module.exports.applySyncRecords = (records) => {
  if (!records || records.length === 0) { return }
  const AppStore = require('../stores/appStore')
  const appState = AppStore.getState()
  const otherRecords = []
  const shouldAddRecord = (record) =>
    [writeActions.CREATE, writeActions.UPDATE].includes(record.action)
  const shouldRemoveRecord = (record) => writeActions.DELETE === record.action

  // Ensure that all folders are assigned folderIds
  records = assignFolderIdsToRecords(records, appState)

  /*
   * Apply records in the same order they're received.
   * For example assume these Create bookmark records:
   * [Site 1, Site 2, Folder A, Site X (in Folder A)]
   * If we accumulated all bookmark sites and applied together, then Folder A
   * would be out of order.
   * So instead we buffer all records applied with a particular action (e.g.
   * bookmark sites), then when the apply action changes (e.g. to folders) we
   * first flush the buffer (e.g. apply the first sequence of sites).
   */
  const functionBuffer = new FunctionBuffer((args) => new Immutable.List(args))
  records.forEach((record) => {
    if (!record) {
      return true
    }
    if (record.objectData === 'bookmark') {
      const siteData = module.exports.getSiteDataFromRecord(record, appState, records).set('skipSync', true)
      if (shouldAddRecord(record)) {
        if (record.bookmark.isFolder) {
          functionBuffer.buffer(appActions.addBookmarkFolder, siteData)
        } else {
          functionBuffer.buffer(appActions.addBookmark, siteData)
        }
      } else if (shouldRemoveRecord(record)) {
        if (record.bookmark.isFolder) {
          const folderKey = bookmarkFoldersUtil.getKey(siteData)
          functionBuffer.buffer(appActions.removeBookmarkFolder, folderKey)
        } else {
          const siteKey = bookmarkUtil.getKey(siteData)
          functionBuffer.buffer(appActions.removeBookmark, siteKey)
        }
      }
    } else if (record.objectData === 'historySite') {
      const siteData = module.exports.getSiteDataFromRecord(record, appState, records)
      if (shouldAddRecord(record)) {
        functionBuffer.buffer(appActions.addHistorySite, siteData)
      } else if (shouldRemoveRecord(record)) {
        const siteKey = historyUtil.getKey(siteData)
        functionBuffer.buffer(appActions.removeHistorySite, siteKey)
      }
    } else {
      otherRecords.push(record)
    }
  })
  functionBuffer.flush()
  applyNonBatchedRecords(otherRecords)
}

/**
 * Given a category and SyncRecord, get an existing browser object.
 * Used to respond to IPC GET_EXISTING_OBJECTS.
 * @param {string} categoryName
 * @param {Object} syncRecord
 * @returns {Object=}
 */
module.exports.getExistingObject = (categoryName, syncRecord) => {
  const AppStore = require('../stores/appStore')
  const appState = AppStore.getState()
  const objectId = new Immutable.List(syncRecord.objectId)
  const existingObject = getObjectById(objectId, categoryName, appState)
  if (!existingObject) { return null }

  const existingObjectKeyPath = existingObject[0]
  const existingObjectData = existingObject[1].toJS()
  let item
  switch (categoryName) {
    case 'BOOKMARKS':
      item = module.exports.createBookmarkData(existingObjectData, appState)
      break
    case 'HISTORY_SITES':
      item = module.exports.createHistorySiteData(existingObjectData)
      break
    case 'PREFERENCES':
      const hostPattern = existingObjectKeyPath[existingObjectKeyPath.length - 1]
      item = module.exports.createSiteSettingsData(hostPattern, existingObjectData)
      break
    default:
      throw new Error(`Invalid category: ${categoryName}`)
  }
  if (!item) {
    console.log(`Warning: Can't create JS from existingObject! ${JSON.stringify(existingObjectData)}`)
    return null
  }
  return {
    action: writeActions.CREATE,
    deviceId: appState.getIn(['sync', 'deviceId']),
    objectData: item.name,
    objectId: item.objectId,
    [item.name]: item.value
  }
}

/**
 * Cache sync objects' key paths by objectIds.
 * NOTE: Deletes current cache entries.
 * XXX: Currently only caches sites (history and bookmarks).
 * @param {Immutable.Map} appState application state
 * @returns {Immutable.Map} new app state
 */
module.exports.createObjectCache = (appState) => {
  const objectsById = new Immutable.Map().withMutations(objectsById => {
    for (let collectionKey of CACHED_STATE_COLLECTIONS) {
      appState.get(collectionKey).forEach((object, objectKey) => {
        const objectId = object.get('objectId')
        if (!objectId) { return true }
        const cacheKey = objectId.toJS().join('|')
        objectsById = objectsById.set(cacheKey, [collectionKey, objectKey])
      })
    }
  })
  return appState.setIn(['sync', 'objectsById'], objectsById)
}

/**
 * Cache a sync object's key path by objectId.
 * XXX: Currently only caches sites (history and bookmarks).
 * @param {Immutable.Map} appState application state
 * @param {Immutable.Map} object object detail (e.g. siteDetail)
 * @param {string} collectionKey one of CACHED_STATE_COLLECTIONS ('bookmarks', 'bookmarkFolders', 'historySites', 'pinnedSites')
 * @returns {Immutable.Map} new app state
 */
module.exports.updateObjectCache = (appState, object, collectionKey) => {
  if (!module.exports.syncEnabled() || !object || (typeof object.isEmpty === 'function' && object.isEmpty()) || !collectionKey || !CACHED_STATE_COLLECTIONS.includes(collectionKey)) {
    return appState
  }
  // XXX: Currently only caches sites (history and bookmarks).
  let objectKey = null
  switch (collectionKey) {
    case STATE_SITES.BOOKMARKS:
      objectKey = bookmarkUtil.getKey(object)
      break
    case STATE_SITES.BOOKMARK_FOLDERS:
      objectKey = bookmarkFoldersUtil.getKey(object)
      break
    case STATE_SITES.HISTORY_SITES:
      objectKey = historyUtil.getKey(object)
      break
  }

  const stateKeyPath = [collectionKey, objectKey]
  const stateObject = appState.getIn(stateKeyPath)
  const objectId = (stateObject && stateObject.get('objectId')) || object.get('objectId')
  if (!objectId) { return appState }
  const cacheKey = ['sync', 'objectsById', objectId.toJS().join('|')]
  if (stateObject) {
    return appState.setIn(cacheKey, stateKeyPath)
  } else {
    return appState.deleteIn(cacheKey)
  }
}

/**
 * Given an objectId, return the matching browser object.
 * @param {Immutable.List} objectId
 * @param {string} category
 * @param {Immutable.Map=} appState
 * @returns {Array} [<Array>, <Immutable.Map>] array is AppStore searchKeyPath e.g. ['bookmarkSites', 10] for use with updateIn
 */
const getObjectById = (objectId, category, appState) => {
  if (!(objectId instanceof Immutable.List)) {
    throw new Error('objectId must be an Immutable.List')
  }

  if (!appState) {
    const AppStore = require('../stores/appStore')
    appState = AppStore.getState()
  }
  switch (category) {
    case 'BOOKMARKS':
    case 'HISTORY_SITES':
      const objectKey = appState.getIn(['sync', 'objectsById', objectId.toJS().join('|')])
      const object = objectKey && appState.getIn(objectKey)
      if (!object) {
        return null
      } else {
        return [objectKey, object]
      }
    case 'PREFERENCES':
      return appState.get('siteSettings').findEntry((siteSetting, hostPattern) => {
        const itemObjectId = siteSetting.get('objectId')
        return (itemObjectId && itemObjectId.equals(objectId))
      })
    default:
      throw new Error(`Invalid object category: ${category}`)
  }
}

/**
 * Given an bookmark folder objectId, find the folder and return its folderId.
 * @param {Immutable.List} objectId
 * @param {Immutable.Map=} appState
 * @param {Immutable.List=} records
 * @returns {number|undefined}
 */
const getFolderIdByObjectId = (objectId, appState, records) => {
  if (objectToFolderMap.has(objectId)) {
    return objectToFolderMap.get(objectId)
  }
  let folderId
  const entry = getObjectById(objectId, 'BOOKMARKS', appState)
  if (entry) {
    folderId = entry[1].get('folderId')
  } else if (records) {
    // Look for a folder record with a matching object ID in this record batch
    const matchingFolder = records.find((record) => {
      record = Immutable.fromJS(record)
      return record && objectId.equals(record.get('objectId')) && typeof record.getIn(['bookmark', 'site', 'folderId']) === 'number'
    })
    if (matchingFolder) {
      folderId = matchingFolder.bookmark.site.folderId
    }
  }
  if (folderId) {
    objectToFolderMap = objectToFolderMap.set(objectId, folderId)
  }
  return folderId
}

/**
 * Gets current time in seconds
 */
module.exports.now = () => {
  return Math.floor(Date.now() / 1000)
}

/**
 * Checks whether an object is syncable as a bookmark.
 * @param {Immutable.Map} item
 * @returns {boolean}
 */
module.exports.isSyncableBookmark = (site) => {
  return bookmarkUtil.isBookmark(site) || bookmarkFoldersUtil.isFolder(site)
}

/**
 * Checks whether an object is syncable as a history site.
 * @param {Immutable.Map} item
 * @returns {boolean}
 */
module.exports.isSyncableHistorySite = (site) => {
  if (!site) {
    return false
  }
  const order = site.get('order')
  const location = site.get('location')
  return !order &&
    typeof location === 'string' &&
    !location.startsWith('about:')
}

/**
 * Checks whether an object is syncable as a site setting.
 * @param {Immutable.Map} item
 * @returns {boolean}
 */
module.exports.isSyncableSiteSetting = (item) => {
  for (let field in module.exports.siteSettingDefaults) {
    if (item.has(field)) {
      return true
    }
  }
  return false
}

/**
 * Sets a new object ID for an existing object in appState
 * @param {Array.<string>} objectPath - Path to get to the object from appState root,
 *   for use with Immutable.setIn
 * @returns {Array.<number>}
 */
module.exports.newObjectId = (objectPath) => {
  const objectId = new Immutable.List(crypto.randomBytes(16))
  appActions.setObjectId(objectId, objectPath)
  return objectId.toJS()
}

/**
 * Given a bookmark folder's folderId, get or set its object ID.
 * @param {number} folderId
 * @param {Immutable.Map} appState
 * @returns {Array.<number>}
 */
const findOrCreateFolderObjectId = (folderId, appState) => {
  if (typeof folderId !== 'number' || folderId < 0) { return undefined }
  if (!appState) {
    const AppStore = require('../stores/appStore')
    appState = AppStore.getState()
  }
  const folder = bookmarkFoldersState.getFolder(appState, folderId)
  if (folder.isEmpty()) { return undefined }
  const objectId = folder.get('objectId')
  if (objectId) {
    return objectId.toJS()
  } else {
    return module.exports.newObjectId([STATE_SITES.BOOKMARK_FOLDERS, folder.get('key')])
  }
}

const pickSiteData = (site) => {
  const siteData = {
    location: '',
    title: '',
    favicon: '',
    lastAccessedTime: 0,
    creationTime: 0
  }
  for (let field in site) {
    if (field in siteData && !isDataUrl(site[field])) {
      siteData[field] = site[field]
    }
  }
  return siteData
}

/**
 * Converts a bookmark site object into input for sendSyncRecords.
 * @param {Object} site
 * @param {Immutable.Map} appState
 * @returns {{name: string, value: object, objectId: Array.<number>}}
 */
module.exports.createBookmarkData = (site, appState) => {
  const siteData = pickSiteData(site)
  const immutableSite = Immutable.fromJS(site)
  const isFolder = bookmarkFoldersUtil.isFolder(immutableSite)
  const collectionUtil = isFolder ? bookmarkFoldersUtil : bookmarkUtil
  const siteKey = collectionUtil.getKey(immutableSite) ||
    collectionUtil.getKey(Immutable.fromJS(siteData))
  if (siteKey === null) {
    // May happen if this is called before the appStore object has its location
    // field populated
    console.log(`createBookmarkData ignoring entry because we can't create site key: ${JSON.stringify(site)}`)
    return
  }

  const sitesCollection = isFolder ? STATE_SITES.BOOKMARK_FOLDERS : STATE_SITES.BOOKMARKS
  const objectId = site.objectId ||
    folderToObjectMap[site.folderId] ||
    module.exports.newObjectId([sitesCollection, siteKey])
  if (!objectId) {
    console.log(`Warning: createBookmarkData can't create site data: ${JSON.stringify(site)}`)
  }

  const parentFolderObjectId = site.parentFolderObjectId ||
    folderToObjectMap[site.parentFolderId] ||
    findOrCreateFolderObjectId(site.parentFolderId, appState)
  const value = {
    site: siteData,
    isFolder,
    hideInToolbar: site.parentFolderId === -1,
    parentFolderObjectId
  }
  return {
    name: 'bookmark',
    objectId,
    value
  }
}

/**
 * Converts a bookmark site object into input for sendSyncRecords.
 * @param {Object} site
 * @returns {{name: string, value: object, objectId: Array.<number>}}
 */
module.exports.createHistorySiteData = (site) => {
  const siteData = pickSiteData(site)
  const siteKey = historyUtil.getKey(Immutable.fromJS(site)) ||
    historyUtil.getKey(Immutable.fromJS(siteData))
  if (siteKey === null) {
    // May happen if this is called before the appStore object has its location
    // field populated
    console.log(`createHistorySiteData ignoring site because we can't create site key: ${JSON.stringify(site)}`)
    return
  }

  const objectId = site.objectId || module.exports.newObjectId([STATE_SITES.HISTORY_SITES, siteKey])
  if (!objectId) {
    console.log(`Warning: createHistorySiteData can't create site data: ${JSON.stringify(site)}`)
  }

  return {
    name: 'historySite',
    objectId,
    value: siteData
  }
}

/**
 * Converts a site settings object into input for sendSyncRecords
 * @param {string} hostPattern
 * @param {Object} setting
 * @returns {{name: string, value: object, objectId: Array.<number>}}
 */
module.exports.createSiteSettingsData = (hostPattern, setting) => {
  const adControlEnum = {
    showBraveAds: 0,
    blockAds: 1,
    allowAdsAndTracking: 2
  }
  const cookieControlEnum = {
    block3rdPartyCookie: 0,
    allowAllCookies: 1,
    blockAllCookies: 2
  }
  const objectData = {hostPattern}

  for (let key in setting) {
    if (key === 'objectId') { continue }
    const value = setting[key]
    if (key === 'adControl' && typeof adControlEnum[value] !== 'undefined') {
      objectData[key] = adControlEnum[value]
    } else if (key === 'cookieControl' && typeof cookieControlEnum[value] !== 'undefined') {
      objectData[key] = cookieControlEnum[value]
    } else if (key in module.exports.siteSettingDefaults) {
      objectData[key] = value
    }
  }

  return {
    name: 'siteSetting',
    objectId: setting.objectId || module.exports.newObjectId(['siteSettings', hostPattern]),
    value: objectData
  }
}

/**
 * Deep modify object Uint8Array into Array.<Number> because IPC can't send
 * Uint8Array (see brave/sync issue #17). Returns a copy.
 */
const deepArrayify = (sourceObject) => {
  let object = Object.assign({}, sourceObject)
  const has = Object.prototype.hasOwnProperty.bind(object)
  for (let k in object) {
    if (!has(k) || object[k] instanceof Array) { continue }
    if (object[k] instanceof Uint8Array) {
      object[k] = Array.from(object[k])
    } else if (typeof object[k] === 'object') {
      object[k] = deepArrayify(Object.assign({}, object[k]))
    }
  }
  return object
}
module.exports.deepArrayify = deepArrayify

/**
 * @param {Object}
 * @returns {Object}
 */
module.exports.ipcSafeObject = (object) => {
  return deepArrayify(object)
}

module.exports.syncEnabled = () => {
  return getSetting(settings.SYNC_ENABLED) === true
}
