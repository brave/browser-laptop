/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const Immutable = require('immutable')
const siteCache = require('../../app/common/state/siteCache')
const siteTags = require('../constants/siteTags')
const settings = require('../constants/settings')
const getSetting = require('../settings').getSetting
const UrlUtil = require('../lib/urlutil')
const urlParse = require('../../app/common/urlParse')
const {makeImmutable} = require('../../app/common/state/immutableUtil')

const defaultTags = new Immutable.List([siteTags.DEFAULT])

const isBookmark = (tags) => {
  if (!tags) {
    return false
  }
  return tags.includes(siteTags.BOOKMARK)
}

const isBookmarkFolder = (tags) => {
  if (!tags) {
    return false
  }
  return (typeof tags === 'string' && tags === siteTags.BOOKMARK_FOLDER) ||
    (tags && typeof tags !== 'string' && tags.includes(siteTags.BOOKMARK_FOLDER))
}

const isPinnedTab = (tags) => {
  if (!tags) {
    return false
  }
  return tags.includes(siteTags.PINNED)
}
module.exports.isPinnedTab = isPinnedTab

const reorderSite = (sites, order) => {
  sites = sites.map((site) => {
    const siteOrder = site.get('order')
    if (siteOrder > order) {
      return site.set('order', siteOrder - 1)
    }
    return site
  })
  return sites
}

/**
 * Sort comparator for sort function
 */
module.exports.siteSort = (x, y) => {
  if (x.get('order') < y.get('order')) {
    return -1
  } else if (x.get('order') > y.get('order')) {
    return 1
  } else {
    return 0
  }
}

/**
 * Calculate siteKey for siteDetail
 *
 * @param siteDetail The site to to be calculated
 * @return key if siteDetail is valid
 */
module.exports.getSiteKey = function (siteDetail) {
  if (!siteDetail) {
    return null
  }
  const folderId = siteDetail.get('folderId')
  let location = siteDetail.get('location')
  if (folderId) {
    return folderId.toString()
  } else if (location) {
    location = UrlUtil.getLocationIfPDF(location)
    return location + '|' +
      (siteDetail.get('partitionNumber') || 0) + '|' +
      (siteDetail.get('parentFolderId') || 0)
  }
  return null
}

/**
 * Calculate location for siteKey
 *
 * @param siteKey The site key to to be calculated
 * @return {string|null}
 */
module.exports.getLocationFromSiteKey = function (siteKey) {
  if (!siteKey) {
    return null
  }

  const splitKey = siteKey.split('|', 2)
  if (typeof splitKey[0] === 'string' && typeof splitKey[1] === 'string') {
    return splitKey[0]
  }
  return null
}

/**
 * Checks if a siteDetail has the specified tag.
 * Depends on siteDeatil siteKey being accurate.
 *
 * @param sites The application state's Immutable sites map
 * @param siteDetail The site to check if it's in the specified tag
 * @return true if the location is already bookmarked
 */
module.exports.isSiteBookmarked = function (sites, siteDetail) {
  const siteKey = module.exports.getSiteKey(siteDetail)
  const siteTags = sites.getIn([siteKey, 'tags'])
  return isBookmark(siteTags)
}

/**
 * Checks if a location is bookmarked.
 *
 * @param state The application state Immutable map
 * @param {string} location
 * @return {boolean}
 */
module.exports.isLocationBookmarked = function (state, location) {
  const sites = state.get('sites')
  const siteKeys = siteCache.getLocationSiteKeys(state, location)
  if (!siteKeys || siteKeys.length === 0) {
    return false
  }
  return siteKeys.some(key => {
    const site = sites.get(key)
    if (!site) {
      return false
    }
    return isBookmark(site.get('tags'))
  })
}

const getNextFolderIdItem = (sites) =>
  sites.max((siteA, siteB) => {
    const folderIdA = siteA.get('folderId')
    const folderIdB = siteB.get('folderId')
    if (folderIdA === folderIdB) {
      return 0
    }
    if (folderIdA === undefined) {
      return false
    }
    if (folderIdB === undefined) {
      return true
    }
    return folderIdA > folderIdB
  })

module.exports.getNextFolderId = (sites) => {
  const defaultFolderId = 0
  if (!sites) {
    return defaultFolderId
  }
  const maxIdItem = getNextFolderIdItem(sites)
  return (maxIdItem ? (maxIdItem.get('folderId') || 0) : 0) + 1
}

module.exports.getNextFolderName = (sites, name) => {
  if (!sites) {
    return name
  }
  const site = sites.find((site) =>
    isBookmarkFolder(site.get('tags')) &&
    site.get('customTitle') === name
  )
  if (!site) {
    return name
  }
  const filenameFormat = /(.*) \((\d+)\)/
  let result = filenameFormat.exec(name)
  if (!result) {
    return module.exports.getNextFolderName(sites, name + ' (1)')
  }
  const nextNum = parseInt(result[2]) + 1
  return module.exports.getNextFolderName(sites, result[1] + ' (' + nextNum + ')')
}

const mergeSiteLastAccessedTime = (oldSiteDetail, newSiteDetail, tag) => {
  const newTime = newSiteDetail && newSiteDetail.get('lastAccessedTime')
  const oldTime = oldSiteDetail && oldSiteDetail.get('lastAccessedTime')
  if (!isBookmark(tag) && !isBookmarkFolder(tag)) {
    return newTime || new Date().getTime()
  }
  if (newTime && newTime !== 0) {
    return newTime
  } else if (oldTime && oldTime !== 0) {
    return oldTime
  } else {
    return 0
  }
}

// Some details can be copied from the existing siteDetail if null
// ex: parentFolderId, partitionNumber, and favicon
const mergeSiteDetails = (oldSiteDetail, newSiteDetail, tag, folderId, order) => {
  let tags = (oldSiteDetail && oldSiteDetail.get('tags')) || new Immutable.List()
  if (tag) {
    tags = tags.toSet().add(tag).toList()
  }

  const customTitle = typeof newSiteDetail.get('customTitle') === 'string'
    ? newSiteDetail.get('customTitle')
    : (newSiteDetail.get('customTitle') || (oldSiteDetail && oldSiteDetail.get('customTitle')))

  const lastAccessedTime = mergeSiteLastAccessedTime(oldSiteDetail, newSiteDetail, tag)

  let site = makeImmutable({
    lastAccessedTime,
    tags,
    objectId: newSiteDetail.get('objectId') || (oldSiteDetail ? oldSiteDetail.get('objectId') : undefined),
    title: newSiteDetail.get('title'),
    order
  })

  if (oldSiteDetail && oldSiteDetail.get('order') !== undefined) {
    site = site.set('order', oldSiteDetail.get('order'))
  }

  if (newSiteDetail.get('location')) {
    site = site.set('location', newSiteDetail.get('location'))
  }
  if (folderId) {
    site = site.set('folderId', Number(folderId))
  }
  if (typeof customTitle === 'string') {
    site = site.set('customTitle', customTitle)
  }
  if (newSiteDetail.get('parentFolderId') !== undefined || (oldSiteDetail && oldSiteDetail.get('parentFolderId'))) {
    let parentFolderId = newSiteDetail.get('parentFolderId') !== undefined
      ? newSiteDetail.get('parentFolderId') : oldSiteDetail.get('parentFolderId')
    site = site.set('parentFolderId', Number(parentFolderId))
  }
  if (newSiteDetail.get('partitionNumber') !== undefined || (oldSiteDetail && oldSiteDetail.get('partitionNumber'))) {
    let partitionNumber = newSiteDetail.get('partitionNumber') !== undefined
    ? newSiteDetail.get('partitionNumber') : oldSiteDetail.get('partitionNumber')
    site = site.set('partitionNumber', Number(partitionNumber))
  }
  if (newSiteDetail.get('favicon') || (oldSiteDetail && oldSiteDetail.get('favicon'))) {
    site = site.set('favicon', newSiteDetail.get('favicon') || oldSiteDetail.get('favicon'))
  }
  if (newSiteDetail.get('themeColor') || (oldSiteDetail && oldSiteDetail.get('themeColor'))) {
    site = site.set('themeColor', newSiteDetail.get('themeColor') || oldSiteDetail.get('themeColor'))
  }
  if (site.get('tags').size === 0) {
    // Increment the visit count for history items
    site = site.set('count', ((oldSiteDetail || site).get('count') || 0) + 1)
  }

  return site
}

/**
 * Adds or updates the specified siteDetail in appState.sites.
 *
 * Examples of updating:
 * - editing bookmark in add/edit modal
 * - when timestamp is added (history entry)
 * - moving bookmark to/from a folder
 *
 * @param sites The application state's Immutable site list
 * @param siteDetails The site details object to add or update
 * @param tag The tag to add for this site
 *   See siteTags.js for supported types. No tag means just a history item
 * @param originalSiteDetail If specified, use when searching site list
 * @param {boolean=} skipSync - True if this site was downloaded by sync and
 *   does not to be re-uploaded
 * @return The new state Immutable object
 */
module.exports.addSite = function (state, siteDetail, tag, originalSiteDetail, skipSync) {
  let sites = state.get('sites')
  // Get tag from siteDetail object if not passed via tag param
  if (tag === undefined) {
    tag = siteDetail.getIn(['tags', 0])
  }

  let originalSiteKey
  if (originalSiteDetail) {
    originalSiteKey = module.exports.getSiteKey(originalSiteDetail)
  }

  const oldKey = originalSiteKey || module.exports.getSiteKey(siteDetail)
  const oldSite = oldKey !== null ? sites.get(oldKey) : null
  let folderId = siteDetail.get('folderId')

  if (tag === siteTags.BOOKMARK_FOLDER) {
    if (!oldSite && folderId) {
      // Remove duplicate folder (needed for import)
      const dupFolder = sites.find((site) => isBookmarkFolder(site.get('tags')) &&
        site.get('parentFolderId') === siteDetail.get('parentFolderId') &&
        site.get('customTitle') === siteDetail.get('customTitle'))
      if (dupFolder) {
        state = module.exports.removeSite(state, dupFolder, siteTags.BOOKMARK_FOLDER, true)
      }
    } else if (!folderId) {
      // Assign an id if this is a new folder
      folderId = module.exports.getNextFolderId(sites)
    }
  }

  let site = mergeSiteDetails(oldSite, siteDetail, tag, folderId, sites.size)
  if (oldSite) {
    sites = sites.delete(oldKey)
  }

  let location
  if (site.has('location')) {
    location = UrlUtil.getLocationIfPDF(site.get('location'))
    site = site.set('location', location)
  }
  const oldLocation = (oldSite && oldSite.get('location')) || site.get('location')
  state = siteCache.removeLocationSiteKey(state, oldLocation, oldKey)

  if (skipSync) {
    site = site.set('skipSync', true)
  }

  state = state.set('sites', sites)
  const key = module.exports.getSiteKey(site)
  if (key === null) {
    return state
  }
  state = state.setIn(['sites', key], site)
  state = siteCache.addLocationSiteKey(state, location, key)
  return state
}

/**
 * Removes the appropriate tag from a site given the site's sync objectId.
 * @param {Immutable.Map} state - Application state
 * @param {Array} objectId - Object ID of object to be deleted
 * @param {string} objectData - oneof 'historySite', 'bookmark'
 * @returns {Immutable.Map}
 */
module.exports.removeSiteByObjectId = function (state, objectId, objectData) {
  if (!objectId) {
    return state
  }
  const cacheKey = ['sync', 'objectsById', objectId.join('|')]
  const objectKey = state.getIn(cacheKey)
  const site = objectKey && state.getIn(objectKey)
  if (!site) {
    return state
  }
  let tag = ''
  if (objectData === 'bookmark') {
    // determine whether this is a folder
    tag = site.get('folderId') ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK
  }
  state = module.exports.removeSite(state, site, tag)
  // If the object has been removed completely, purge it from the sync site
  // cache
  if (!state.getIn(objectKey)) {
    state = state.deleteIn(cacheKey)
  }
  return state
}

/**
 * Removes the specified tag from a siteDetail
 *
 * @param {Immutable.Map} state The application state Immutable map
 * @param {Immutable.Map} siteDetail The siteDetail to remove a tag from
 * @param {string} tag
 * @param {boolean} reorder whether to reorder sites (default with reorder)
 * @return {Immutable.Map} The new state Immutable object
 */
module.exports.removeSite = function (state, siteDetail, tag, reorder = true) {
  let sites = state.get('sites')
  const key = module.exports.getSiteKey(siteDetail)
  if (!key) {
    return state
  }

  const tags = sites.getIn([key, 'tags'])
  if (isBookmarkFolder(tags)) {
    const folderId = sites.getIn([key, 'folderId'])
    const childSites = sites.filter((site) => site.get('parentFolderId') === folderId)
    childSites.forEach((site) => {
      const tags = site.get('tags')
      tags.forEach((tag) => {
        state = module.exports.removeSite(state, site, tag, false)
      })
    })
  }

  const location = siteDetail.get('location')
  state = siteCache.removeLocationSiteKey(state, location, key)

  const stateKey = ['sites', key]
  let site = state.getIn(stateKey)
  if (!site) {
    return state
  }
  if (isBookmark(tag)) {
    if (isPinnedTab(tags)) {
      const tags = site.get('tags').filterNot((tag) => tag === siteTags.BOOKMARK)
      site = site.set('tags', tags)
      return state.setIn(stateKey, site)
    }
    if (state.get('sites').size && reorder) {
      const order = state.getIn(stateKey.concat(['order']))
      state = state.set('sites', reorderSite(state.get('sites'), order))
    }
    return state.deleteIn(['sites', key])
  } else if (isPinnedTab(tag)) {
    const tags = site.get('tags').filterNot((tag) => tag === siteTags.PINNED)
    site = site.set('tags', tags)
    return state.setIn(stateKey, site)
  } else {
    site = site.set('lastAccessedTime', undefined)
    return state.setIn(stateKey, site)
  }
}

/**
 * Called by isMoveAllowed
 * Trace a folder's ancestory, collecting all parent folderIds until reaching Bookmarks Toolbar (folderId=0)
 */
const getAncestorFolderIds = (parentFolderIds, bookmarkFolder, allBookmarks) => {
  if (bookmarkFolder.get('parentFolderId')) {
    parentFolderIds.push(bookmarkFolder.get('parentFolderId'))
    const nextItem = allBookmarks.find((item) => item.get('folderId') === bookmarkFolder.get('parentFolderId'))
    if (nextItem) {
      getAncestorFolderIds(parentFolderIds, nextItem, allBookmarks)
    }
  }
}

/**
 * Determine if a proposed move is valid
 *
 * @param sites The application state's Immutable sites list
 * @param sourceDetail The site detail to move
 * @param destinationDetail The site detail to move to
 */
module.exports.isMoveAllowed = (sites, sourceDetail, destinationDetail) => {
  if (typeof destinationDetail.get('parentFolderId') === 'number' && typeof sourceDetail.get('folderId') === 'number') {
    // Folder can't be its own parent
    if (sourceDetail.get('folderId') === destinationDetail.get('folderId')) {
      return false
    }
    // Ancestor folder can't be moved into a descendant
    let ancestorFolderIds = []
    getAncestorFolderIds(ancestorFolderIds, destinationDetail, sites)
    if (ancestorFolderIds.includes(sourceDetail.get('folderId'))) {
      return false
    }
  }
  return true
}

/**
 * Moves the specified site from one location to another
 *
 * @param state The application state Immutable map
 * @param sourceKey The site key to move
 * @param destinationKey The site key to move to
 * @param prepend Whether the destination detail should be prepended or not, not used if destinationIsParent is true
 * @param destinationIsParent Whether the item should be moved inside of the destinationDetail.
 * @param disallowReparent If set to true, parent folder will not be set
 * @return The new state Immutable object
 */
module.exports.moveSite = function (state, sourceKey, destinationKey, prepend,
  destinationIsParent, disallowReparent) {
  let sites = state.get('sites')
  let sourceSite = sites.get(sourceKey) || Immutable.Map()
  const destinationSite = sites.get(destinationKey) || Immutable.Map()

  if (sourceSite.isEmpty() || !module.exports.isMoveAllowed(sites, sourceSite, destinationSite)) {
    return state
  }

  const sourceSiteIndex = sourceSite.get('order')
  let destinationSiteIndex
  if (destinationIsParent) {
    // When the destination is the parent we want to put it at the end
    destinationSiteIndex = sites.size - 1
    prepend = true
  } else {
    destinationSiteIndex = destinationSite.get('order')
  }

  let newIndex = destinationSiteIndex + (prepend ? 0 : 1)
  if (destinationSiteIndex > sourceSiteIndex) {
    --newIndex
  }

  const location = sourceSite.get('location')
  state = siteCache.removeLocationSiteKey(state, location, sourceKey)
  state = state.deleteIn(['sites', sourceKey])
  state = state.set('sites', state.get('sites').map((site) => {
    const siteOrder = site.get('order')
    if (siteOrder >= newIndex && siteOrder < sourceSiteIndex) {
      return site.set('order', siteOrder + 1)
    } else if (siteOrder <= newIndex && siteOrder > sourceSiteIndex) {
      return site.set('order', siteOrder - 1)
    }
    return site
  }))
  sourceSite = sourceSite.set('order', newIndex)

  if (!disallowReparent) {
    if (destinationIsParent && destinationSite.get('folderId') !== sourceSite.get('folderId')) {
      sourceSite = sourceSite.set('parentFolderId', destinationSite.get('folderId'))
    } else if (destinationSite.get('parentFolderId') == null) {
      sourceSite = sourceSite.set('parentFolderId', 0)
    } else if (destinationSite.get('parentFolderId') !== sourceSite.get('parentFolderId')) {
      sourceSite = sourceSite.set('parentFolderId', destinationSite.get('parentFolderId'))
    }
  }
  const destinationSiteKey = module.exports.getSiteKey(sourceSite)
  state = siteCache.addLocationSiteKey(state, location, destinationSiteKey)
  return state.setIn(['sites', destinationSiteKey], sourceSite)
}

module.exports.getDetailFromFrame = function (frame, tag) {
  let location = frame.get('location')
  if (frame.get('pinnedLocation') && tag === siteTags.PINNED) {
    location = frame.get('pinnedLocation')
  }

  return makeImmutable({
    location,
    title: frame.get('title'),
    partitionNumber: frame.get('partitionNumber'),
    tags: tag ? [tag] : [],
    favicon: frame.get('icon'),
    themeColor: frame.get('themeColor') || frame.get('computedThemeColor')
  })
}

const getSitesBySubkey = (sites, siteKey, tag) => {
  if (!sites || !siteKey) {
    return makeImmutable([])
  }
  const splitKey = siteKey.split('|', 2)
  const partialKey = splitKey.join('|')
  const matches = sites.filter((site, key) => {
    if (key.indexOf(partialKey) > -1 && (!tag || (tag && site.get('tags').includes(tag)))) {
      return true
    }
    return false
  })
  return matches.toList()
}

module.exports.getDetailFromTab = function (tab, tag, sites) {
  let location = tab.get('url')
  const partitionNumber = tab.get('partitionNumber')
  let parentFolderId

  // if site map is available, look up extra information:
  // - original url (if redirected)
  // - parent folder id
  if (sites) {
    let results = makeImmutable([])

    // get all sites matching URL and partition (disregarding parentFolderId)
    let siteKey = module.exports.getSiteKey(makeImmutable({location, partitionNumber}))
    results = results.merge(getSitesBySubkey(sites, siteKey, tag))

    // only check for provisional location if entry is not found
    if (results.size === 0) {
      // if provisional location is different, grab any results which have that URL
      // this may be different if the site was redirected
      const provisionalLocation = tab.getIn(['frame', 'provisionalLocation'])
      if (provisionalLocation && provisionalLocation !== location) {
        siteKey = module.exports.getSiteKey(makeImmutable({
          location: provisionalLocation,
          partitionNumber
        }))
        results = results.merge(getSitesBySubkey(sites, siteKey, tag))
      }
    }

    // update details which get returned below
    if (results.size > 0) {
      location = results.getIn([0, 'location'])
      parentFolderId = results.getIn([0, 'parentFolderId'])
    }
  }

  const siteDetail = {
    location: location,
    title: tab.get('title'),
    tags: tag ? [tag] : []
  }
  if (partitionNumber) {
    siteDetail.partitionNumber = partitionNumber
  }
  if (parentFolderId) {
    siteDetail.parentFolderId = parentFolderId
  }
  return Immutable.fromJS(siteDetail)
}

module.exports.getDetailFromCreateProperties = function (createProperties, tag) {
  const siteDetail = {
    location: createProperties.get('url'),
    tags: tag ? [tag] : []
  }
  if (createProperties.get('partitionNumber') !== undefined) {
    siteDetail.partitionNumber = createProperties.get('partitionNumber')
  }
  return Immutable.fromJS(siteDetail)
}

/**
 * Update the favicon URL for all entries in the state sites
 * which match a given location. Currently, there should only be
 * one match, but this will handle multiple.
 *
 * @param state The application state
 * @param location URL for the entry needing an update
 * @param favicon favicon URL
 */
module.exports.updateSiteFavicon = function (state, location, favicon) {
  if (UrlUtil.isNotURL(location)) {
    return state
  }
  const siteKeys = siteCache.getLocationSiteKeys(state, location)
  if (!siteKeys || siteKeys.length === 0) {
    return state
  }
  siteKeys.forEach((siteKey) => {
    state = state.setIn(['sites', siteKey, 'favicon'], favicon)
  })
  return state
}

/**
 * Converts a siteDetail to createProperties format
 * @param {Object} siteDetail - A site detail as per app state
 * @return {Object} A createProperties plain JS object, not ImmutableJS
 */
module.exports.toCreateProperties = function (siteDetail) {
  return {
    url: siteDetail.get('location'),
    partitionNumber: siteDetail.get('partitionNumber')
  }
}

/**
 * Compares 2 site details
 * @param siteDetail1 The first site detail to compare.
 * @param siteDetail2 The second site detail to compare.
 * @return true if the site details should be considered the same.
 */
module.exports.isEquivalent = function (siteDetail1, siteDetail2) {
  const isFolder1 = module.exports.isFolder(siteDetail1)
  const isFolder2 = module.exports.isFolder(siteDetail2)
  if (isFolder1 !== isFolder2) {
    return false
  }

  // If they are both folders
  if (isFolder1) {
    return siteDetail1.get('folderId') === siteDetail2.get('folderId')
  }
  return siteDetail1.get('location') === siteDetail2.get('location') && siteDetail1.get('partitionNumber') === siteDetail2.get('partitionNumber')
}

/**
 * Determines if the site detail is a bookmark.
 * @param siteDetail The site detail to check.
 * @return true if the site detail has a bookmark tag.
 */
module.exports.isBookmark = function (siteDetail) {
  if (siteDetail) {
    return isBookmark(siteDetail.get('tags'))
  }
  return false
}

/**
 * Determines if the site detail is a folder.
 * @param siteDetail The site detail to check.
 * @return true if the site detail is a folder.
 */
module.exports.isFolder = function (siteDetail) {
  if (siteDetail) {
    return isBookmarkFolder(siteDetail.get('tags')) && siteDetail.get('folderId') !== undefined
  }
  return false
}

/**
 * Determines if the site detail is an imported bookmark.
 * @param siteDetail The site detail to check.
 * @return true if the site detail is a folder.
 */
module.exports.isImportedBookmark = function (siteDetail) {
  return siteDetail.get('lastAccessedTime') === 0
}

/**
 * Determines if the site detail is a history entry.
 * @param siteDetail The site detail to check.
 * @return true if the site detail is a history entry.
 */
module.exports.isHistoryEntry = function (siteDetail) {
  if (siteDetail && typeof siteDetail.get('location') === 'string') {
    const tags = siteDetail.get('tags')
    if (siteDetail.get('location').startsWith('about:') ||
      module.exports.isDefaultEntry(siteDetail) ||
      isBookmarkFolder(tags)) {
      return false
    }
    return !!siteDetail.get('lastAccessedTime') || !tags || tags.size === 0
  }
  return false
}

/**
 * Determines if the site detail is one of default sites in about:newtab.
 * @param {Immutable.Map} siteDetail The site detail to check.
 * @returns {boolean} if the site detail is a default newtab entry.
 */
module.exports.isDefaultEntry = function (siteDetail) {
  return Immutable.is(siteDetail.get('tags'), defaultTags) &&
    siteDetail.get('lastAccessedTime') === 1
}

/**
 * Get a folder by folderId
 * @returns {Immutable.List.<Immutable.Map>} sites
 * @param {number} folderId
 * @returns {Array[<number>, <Immutable.Map>]|undefined}
 */
module.exports.getFolder = function (sites, folderId) {
  const entry = sites.findEntry((site, _path) => {
    return module.exports.isFolder(site) && site.get('folderId') === folderId
  })
  if (!entry) { return undefined }
  return entry
}

/**
 * Obtains an array of folders
 */
module.exports.getFolders = function (sites, folderId, parentId, labelPrefix) {
  parentId = parentId || 0
  let folders = []
  sites.toList().sort(module.exports.siteSort).forEach((site) => {
    if ((site.get('parentFolderId') || 0) === parentId && module.exports.isFolder(site)) {
      if (site.get('folderId') === folderId) {
        return
      }
      const label = (labelPrefix || '') + (site.get('customTitle') || site.get('title'))
      folders.push({
        folderId: site.get('folderId'),
        parentFolderId: site.get('parentFolderId'),
        label
      })
      const subsites = module.exports.getFolders(sites, folderId, site.get('folderId'), (label || '') + ' / ')
      folders = folders.concat(subsites)
    }
  })
  return folders
}

/**
 * Filters out non recent sites based on the app setting for history size.
 * @param sites The application state's Immutable sites list.
 */
module.exports.filterOutNonRecents = function (sites) {
  const sitesWithTags = sites
    .filter((site) => site.get('tags').size)
  const topHistorySites = sites
    .filter((site) => site.get('tags').size === 0)
    .sort((site1, site2) => (site2.get('lastAccessedTime') || 0) - (site1.get('lastAccessedTime') || 0))
    .take(getSetting(settings.AUTOCOMPLETE_HISTORY_SIZE))
  return sitesWithTags.concat(topHistorySites)
}

/**
 * Filters sites relative to a parent site (folder).
 * @param sites The application state's Immutable sites list.
 * @param relSite The folder to filter to.
 */
module.exports.filterSitesRelativeTo = function (sites, relSite) {
  if (!relSite.get('folderId')) {
    return sites
  }
  return sites.filter((site) => site.get('parentFolderId') === relSite.get('folderId'))
}

/**
 * Clears history by
 * - filtering out entries which have no tags
 * - setting lastAccessedTime to null for remaining entries (bookmarks)
 * @param sites The application state's Immutable sites list.
 */
module.exports.clearHistory = function (sites) {
  let bookmarks = sites.filter((site) => site.get('tags') && site.get('tags').size > 0)
  bookmarks.forEach((site, index) => {
    if (site.get('lastAccessedTime')) {
      bookmarks = bookmarks.setIn([index, 'lastAccessedTime'], null)
    }
  })
  return bookmarks
}

/**
 * Returns all sites that have a bookmark tag.
 * @param sites The application state's Immutable sites list.
 */

module.exports.getBookmarks = function (sites) {
  if (sites) {
    return sites.filter((site) => isBookmarkFolder(site.get('tags')) || isBookmark(site.get('tags')))
  }
  return makeImmutable({})
}

/**
 * Gets a site origin (scheme + hostname + port) from a URL or null if not
 * available.
 * @param {string} location
 * @return {string?}
 */
module.exports.getOrigin = function (location) {
  // Returns scheme + hostname + port
  if (typeof location !== 'string') {
    return null
  }
  if (location.startsWith('file://')) {
    return 'file:///'
  }
  let parsed = urlParse(location)
  if (parsed.host && parsed.protocol) {
    return parsed.slashes ? [parsed.protocol, parsed.host].join('//') : [parsed.protocol, parsed.host].join('')
  } else {
    return null
  }
}
