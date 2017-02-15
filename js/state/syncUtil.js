/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const writeActions = require('../constants/sync/proto').actions
const siteUtil = require('./siteUtil')

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

const siteSettingDefaults = {
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
  ledgerPaymentsShown: true
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
 * Apply a bookmark or historySite SyncRecord to the browser data store.
 * @param {Object} record
 * @param {Immutable.Map} siteDetail
 */
const applySiteRecord = (record) => {
  const appActions = require('../actions/appActions')
  const siteTags = require('../constants/siteTags')
  const objectId = new Immutable.List(record.objectId)
  const category = CATEGORY_MAP[record.objectData].categoryName
  const existingObject = module.exports.getObjectById(objectId, category)
  const existingObjectData = existingObject && existingObject[1]
  let tag

  let siteProps = Object.assign(
    {},
    existingObjectData && existingObjectData.toJS(),
    record.historySite,
    record.bookmark,
    record.bookmark && record.bookmark.site,
    {objectId}
  )
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
        getFolderIdByObjectId(new Immutable.List(parentFolderObjectId))
    }
  }
  const siteDetail = new Immutable.Map(pickFields(siteProps, SITE_FIELDS))

  switch (record.action) {
    case writeActions.CREATE:
      appActions.addSite(siteDetail, tag, undefined, undefined, true)
      break
    case writeActions.UPDATE:
      appActions.addSite(siteDetail, tag, existingObjectData, null, true)
      break
    case writeActions.DELETE:
      appActions.removeSite(siteDetail, tag, true)
      break
  }
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
    1: 'allowAllCookies'
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
  const objectId = new Immutable.List(record.objectId)
  const category = CATEGORY_MAP[record.objectData].categoryName
  const hostPattern = record.siteSetting.hostPattern
  if (!hostPattern) {
    throw new Error('siteSetting.hostPattern is required.')
  }

  let applySetting = null
  switch (record.action) {
    case writeActions.CREATE:
    case writeActions.UPDATE:
      // Set the objectId if needed so we can access the existing object
      let existingObject = module.exports.getObjectById(objectId, category)
      if (!existingObject) {
        appActions.changeSiteSetting(hostPattern, 'objectId', objectId, false, true)
        existingObject = module.exports.getObjectById(objectId, category)
      }
      const existingObjectData = existingObject[1]
      applySetting = (key, value) => {
        const applyValue = getValue(key, value)
        if (existingObjectData.get(key) === applyValue) { return }
        appActions.changeSiteSetting(hostPattern, key, applyValue, false, true)
      }
      break
    case writeActions.DELETE:
      applySetting = (key, _value) => {
        appActions.removeSiteSetting(hostPattern, key, false, true)
      }
      break
  }

  for (let key in record.siteSetting) {
    if (key === 'hostPattern') { continue }
    applySetting(key, record.siteSetting[key])
  }
}

/**
 * Given a SyncRecord, apply it to the browser data store.
 * @param {Object} record
 */
module.exports.applySyncRecord = (record) => {
  if (!record || !record.objectData) {
    console.log(`Warning: Can't apply empty record: ${record}`)
    return
  }
  switch (record.objectData) {
    case 'bookmark':
    case 'historySite':
      applySiteRecord(record)
      break
    case 'siteSetting':
      applySiteSettingRecord(record)
      break
    case 'device':
      // TODO
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
  setImmediate(() => {
    const record = records.shift()
    module.exports.applySyncRecord(record)
    module.exports.applySyncRecords(records)
  })
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
  const existingObject = module.exports.getObjectById(objectId, categoryName)
  if (!existingObject) { return null }

  const existingObjectData = existingObject[1].toJS()
  let item
  switch (categoryName) {
    case 'BOOKMARKS':
    case 'HISTORY_SITES':
      item = module.exports.createSiteData(existingObjectData)
      break
    case 'PREFERENCES':
      const hostPattern = existingObject[0]
      item = module.exports.createSiteSettingsData(hostPattern, existingObjectData)
      break
    default:
      throw new Error(`Invalid category: ${categoryName}`)
  }
  if (!item) {
    throw new Error(`Can't create JS from existingObject! ${existingObjectData}`)
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
 * Given an objectId and category, return the matching browser object.
 * @param {Immutable.List} objectId
 * @param {string} category
 * @returns {Array} [<Array>, <Immutable.Map>] array is AppStore searchKeyPath e.g. ['sites', 10] for use with updateIn
 */
module.exports.getObjectById = (objectId, category) => {
  if (!(objectId instanceof Immutable.List)) {
    throw new Error('objectId must be an Immutable.List')
  }

  const AppStore = require('../stores/appStore')
  const appState = AppStore.getState()
  switch (category) {
    case 'BOOKMARKS':
      return appState.get('sites').findEntry((site, index) => {
        const itemObjectId = site.get('objectId')
        const isBookmark = siteUtil.isFolder(site) || siteUtil.isBookmark(site)
        return (isBookmark && itemObjectId && itemObjectId.equals(objectId))
      })
    case 'HISTORY_SITES':
      return appState.get('sites').findEntry((site, index) => {
        const itemObjectId = site.get('objectId')
        const isBookmark = siteUtil.isFolder(site) || siteUtil.isBookmark(site)
        return (!isBookmark && itemObjectId && itemObjectId.equals(objectId))
      })
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
 * @returns {number|undefined}
 */
const getFolderIdByObjectId = (objectId) => {
  const entry = module.exports.getObjectById(objectId, 'BOOKMARKS')
  if (!entry) { return undefined }
  return entry[1].get('folderId')
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
  if (type === 'bookmark' && item.get('tags')) {
    return (item.get('tags').includes('bookmark') ||
      item.get('tags').includes('bookmark-folder'))
  } else if (type === 'siteSetting') {
    for (let field in siteSettingDefaults) {
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
 * @returns {Array.<number>}
 */
module.exports.findOrCreateFolderObjectId = (folderId) => {
  if (typeof folderId !== 'number') { return undefined }
  const AppStore = require('../stores/appStore')
  const folder = AppStore.getState().getIn(['sites', folderId.toString()])
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
 * @returns {{name: string, value: object, objectId: Array.<number>}}
 */
module.exports.createSiteData = (site) => {
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
  const siteKey = siteUtil.getSiteKey(Immutable.fromJS(site)) || siteUtil.getSiteKey(Immutable.fromJS(siteData))
  if (siteKey === null) {
    throw new Error('Sync could not create siteKey')
  }
  if (module.exports.isSyncable('bookmark', Immutable.fromJS(site))) {
    const objectId = site.objectId || module.exports.newObjectId(['sites', siteKey])
    const parentFolderObjectId = site.parentFolderObjectId || (site.parentFolderId && module.exports.findOrCreateFolderObjectId(site.parentFolderId))
    return {
      name: 'bookmark',
      objectId,
      value: {
        site: siteData,
        isFolder: site.tags.includes('bookmark-folder'),
        parentFolderObjectId
      }
    }
  } else if (!site.tags || !site.tags.length || site.tags.includes('pinned')) {
    return {
      name: 'historySite',
      objectId: site.objectId || module.exports.newObjectId(['sites', siteKey]),
      value: siteData
    }
  }
  console.log(`Warning: Can't create site data: ${site}`)
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
    allowAllCookies: 1
  }
  const objectData = {hostPattern}

  for (let key in setting) {
    if (key === 'objectId') { continue }
    const value = setting[key]
    if (key === 'adControl' && typeof adControlEnum[value] !== 'undefined') {
      objectData[key] = adControlEnum[value]
    } else if (key === 'cookieControl' && typeof cookieControlEnum[value] !== 'undefined') {
      objectData[key] = cookieControlEnum[value]
    } else if (key in siteSettingDefaults) {
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
