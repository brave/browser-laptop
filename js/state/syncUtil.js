/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const writeActions = require('../constants/sync/proto').actions
const siteTags = require('../constants/siteTags')
const siteUtil = require('./siteUtil')
const {isDataUrl} = require('../lib/urlutil')

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
const SITE_FIELDS = ['objectId', 'location', 'title', 'customTitle', 'tags', 'favicon', 'themeColor', 'lastAccessedTime', 'creationTime', 'partitionNumber', 'folderId', 'parentFolderId']

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

/**
 * Converts sync records into a form that can be consumed by AppStore.
 * @param {Object} record
 * @param {Immutable.Map} appState
 * @param {Immutable.List=} records - batch of records possibly not yet applied
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

  let tag
  const siteProps = Object.assign(
    {},
    existingObjectData && existingObjectData.toJS(),
    record.historySite,
    record.bookmark,
    record.bookmark && record.bookmark.site,
    {objectId}
  )
  if (siteProps.customTitle === '') {
    // browser-laptop UI expects the customTitle field to not exist if it is empty
    delete siteProps.customTitle
  }
  if (record.objectData === 'bookmark') {
    const existingFolderId = existingObjectData && existingObjectData.get('folderId')
    if (existingFolderId) {
      siteProps.folderId = existingFolderId
    }
    const isFolder = (typeof siteProps.isFolder === 'boolean')
      ? siteProps.isFolder
      : !!existingFolderId
    tag = isFolder
      ? siteTags.BOOKMARK_FOLDER
      : siteTags.BOOKMARK
    const parentFolderObjectId = siteProps.parentFolderObjectId
    if (parentFolderObjectId && parentFolderObjectId.length > 0) {
      siteProps.parentFolderId =
        getFolderIdByObjectId(new Immutable.List(parentFolderObjectId), appState, records)
    } else if (siteProps.hideInToolbar === true) {
      siteProps.parentFolderId = -1
    }
  }
  const siteDetail = new Immutable.Map(pickFields(siteProps, SITE_FIELDS))
  return {siteDetail, tag, existingObjectData}
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
  const appActions = require('../actions/appActions')
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
      require('../actions/appActions').saveSyncDevices({
        [deviceIdString(record.deviceId)]: device
      })
      break
    default:
      throw new Error(`Invalid record objectData: ${record.objectData}`)
  }
}

/**
 * Apply several SyncRecords in a less blocking manner.
 * @param {Array<Object>} records
 */
module.exports.applySyncRecords = (records) => {
  if (!records || records.length === 0) { return }
  const siteRecords = []
  const otherRecords = []
  records.forEach((record) => {
    if (record && ['bookmark', 'historySite'].includes(record.objectData)) {
      siteRecords.push(record)
    } else {
      otherRecords.push(record)
    }
  })
  applyNonBatchedRecords(otherRecords)
  if (siteRecords.length) {
    setImmediate(() => {
      require('../actions/appActions').applySiteRecords(new Immutable.List(siteRecords))
    })
  }
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
    case 'HISTORY_SITES':
      item = module.exports.createSiteData(existingObjectData, appState)
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
module.exports.createSiteCache = (appState) => {
  const objectsById = new Immutable.Map().withMutations(objectsById => {
    appState.get('sites').forEach((site, siteKey) => {
      const objectId = site.get('objectId')
      if (!objectId) { return true }
      const cacheKey = objectId.toJS().join('|')
      objectsById = objectsById.set(cacheKey, ['sites', siteKey])
    })
  })
  return appState.setIn(['sync', 'objectsById'], objectsById)
}

/**
 * Cache a sync object's key path by objectId.
 * XXX: Currently only caches sites (history and bookmarks).
 * @param {Immutable.Map} appState application state
 * @param {Immutable.Map} siteDetail
 * @returns {Immutable.Map} new app state
 */
module.exports.updateSiteCache = (appState, siteDetail) => {
  if (!siteDetail) { return appState }
  const siteKey = siteUtil.getSiteKey(siteDetail)
  const object = appState.getIn(['sites', siteKey])
  const objectId = (object && object.get('objectId')) || siteDetail.get('objectId')
  if (!objectId) { return appState }
  const cacheKey = ['sync', 'objectsById', objectId.toJS().join('|')]
  if (object) {
    return appState.setIn(cacheKey, ['sites', siteKey])
  } else {
    return appState.deleteIn(cacheKey)
  }
}

/**
 * Given an objectId and category, return the matching browser object.
 * @param {Immutable.List} objectId
 * @param {string} category
 * @param {Immutable.Map=} appState
 * @returns {Array} [<Array>, <Immutable.Map>] array is AppStore searchKeyPath e.g. ['sites', 10] for use with updateIn
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
 * Checks whether an object is syncable as a record of the given type
 * @param {string} type
 * @param {Immutable.Map} item
 * @returns {boolean}
 */
module.exports.isSyncable = (type, item) => {
  if (type === 'bookmark') {
    return siteUtil.isBookmark(item) || siteUtil.isFolder(item)
  } else if (type === 'siteSetting') {
    for (let field in module.exports.siteSettingDefaults) {
      if (item.has(field)) {
        return true
      }
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
  const crypto = require('crypto')
  const appActions = require('../actions/appActions')
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
  const folder = appState.getIn(['sites', folderId.toString()])
  if (!folder) { return undefined }
  const objectId = folder.get('objectId')
  if (objectId) {
    return objectId.toJS()
  } else {
    return module.exports.newObjectId(['sites', folderId.toString()])
  }
}

/**
 * Converts a site object into input for sendSyncRecords
 * @param {Object} site
 * @param {Immutable.Map} appState
 * @returns {{name: string, value: object, objectId: Array.<number>}}
 */
module.exports.createSiteData = (site, appState) => {
  const siteData = {
    location: '',
    title: '',
    customTitle: '',
    favicon: '',
    lastAccessedTime: 0,
    creationTime: 0
  }
  for (let field in site) {
    if (field in siteData && !isDataUrl(site[field])) {
      siteData[field] = site[field]
    }
  }
  const immutableSite = Immutable.fromJS(site)
  const siteKey = siteUtil.getSiteKey(immutableSite) || siteUtil.getSiteKey(Immutable.fromJS(siteData))
  if (siteKey === null) {
    // May happen if this is called before the appStore object has its location
    // field populated
    console.log(`Ignoring entry because we can't create site key: ${JSON.stringify(site)}`)
    return
  }
  let name
  let objectId
  let parentFolderObjectId
  let value
  if (module.exports.isSyncable('bookmark', immutableSite)) {
    name = 'bookmark'
    objectId = site.objectId ||
      folderToObjectMap[site.folderId] ||
      module.exports.newObjectId(['sites', siteKey])
    parentFolderObjectId = site.parentFolderObjectId ||
      folderToObjectMap[site.parentFolderId] ||
      findOrCreateFolderObjectId(site.parentFolderId, appState)
    value = {
      site: siteData,
      isFolder: siteUtil.isFolder(immutableSite),
      hideInToolbar: site.parentFolderId === -1,
      parentFolderObjectId
    }
  } else if (siteUtil.isHistoryEntry(immutableSite)) {
    objectId = site.objectId || module.exports.newObjectId(['sites', siteKey])
    name = 'historySite'
    value = siteData
  }
  if (objectId) {
    if (typeof site.folderId === 'number') {
      folderToObjectMap[site.folderId] = objectId
    }
    if (typeof site.parentFolderId === 'number' && parentFolderObjectId) {
      folderToObjectMap[site.parentFolderId] = parentFolderObjectId
    }
    return {
      name,
      objectId,
      value
    }
  }
  console.log(`Warning: Can't create site data: ${JSON.stringify(site)}`)
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

/**
 * @param {Object}
 * @returns {Object}
 */
module.exports.ipcSafeObject = (object) => {
  return deepArrayify(object)
}
