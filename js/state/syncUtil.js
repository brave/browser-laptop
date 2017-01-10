/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const writeActions = require('../constants/sync/proto').actions

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

/**
 * Apply a bookmark or historySite SyncRecord to the browser data store.
 * @param {Object} record
 * @param {Array.<string>} tags
 */
const applySiteRecord = (record, siteDetail, tag) => {
  const appActions = require('../actions/appActions')
  const objectId = new Immutable.List(record.objectId)
  const category = CATEGORY_MAP[record.objectData].categoryName
  const existingObject = this.getObjectById(objectId, category)
  const existingObjectData = existingObject && existingObject[1]

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

/**
 * Given a SyncRecord, apply it to the browser data store.
 * @param {Object} record
 */
module.exports.applySyncRecord = (record) => {
  const objectId = new Immutable.List(record.objectId)
  switch (record.objectData) {
    case 'bookmark':
      const siteTags = require('../constants/siteTags')
      const tag = record.bookmark.isFolder
        ? siteTags.BOOKMARK_FOLDER
        : siteTags.BOOKMARK
      let bookmarkProps = Object.assign({}, record.bookmark, record.bookmark.site, {objectId})
      delete bookmarkProps.bookmark
      const bookmarkSite = new Immutable.Map(bookmarkProps)
      applySiteRecord(record, bookmarkSite, tag)
      break
    case 'historySite':
      const historyProps = Object.assign({}, record.historySite, {objectId})
      const historySite = new Immutable.Map(historyProps)
      applySiteRecord(record, historySite, null)
      break
    case 'siteSetting':
      // TODO
      break
    case 'device':
      // TODO
      break
    default:
      throw new Error(`Invalid record objectData: ${record.objectData}`)
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
  const existingObject = this.getObjectById(objectId, categoryName)
  if (!existingObject) { return null }

  const existingObjectData = existingObject[1].toJS()
  let item
  switch (categoryName) {
    case 'BOOKMARKS':
    case 'HISTORY_SITES':
      item = this.createSiteData(existingObjectData)
      break
    case 'PREFERENCES':
      const hostPattern = existingObject[0]
      item = this.createSiteSettingsData(hostPattern, existingObjectData)
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
    case 'HISTORY_SITES':
      return appState.get('sites').findEntry((site, index) => {
        const itemObjectId = site.get('objectId')
        return (itemObjectId && itemObjectId.equals(objectId))
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
 * Sets object id on a state entry.
 * @param {Immutable.Map} item
 * @returns {Immutable.map}
 */
module.exports.setObjectId = (item) => {
  if (!item || !item.toJS) {
    return
  }
  if (item.get('objectId')) {
    return item
  }
  const crypto = require('crypto')
  return item.set('objectId', new Immutable.List(crypto.randomBytes(16)))
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
 * Converts a site object into input for sendSyncRecords
 * @param {Object} site
 * @param {number=} siteIndex
 * @returns {{name: string, value: object, objectId: Array.<number>}}
 */
module.exports.createSiteData = (site, siteIndex) => {
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
  if (module.exports.isSyncable('bookmark', Immutable.fromJS(site))) {
    if (!site.objectId && typeof siteIndex !== 'number') {
      throw new Error('Missing bookmark objectId.')
    }
    return {
      name: 'bookmark',
      objectId: site.objectId || module.exports.newObjectId(['sites', siteIndex]),
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
      objectId: site.objectId || module.exports.newObjectId(['sites', siteIndex]),
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
  const value = Object.assign({}, siteSettingDefaults, {hostPattern})

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
    objectId: setting.objectId || module.exports.newObjectId(['siteSettings', hostPattern]),
    value
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
