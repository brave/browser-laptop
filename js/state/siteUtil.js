/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const Immutable = require('immutable')
const normalizeUrl = require('normalize-url')
const siteTags = require('../constants/siteTags')
const settings = require('../constants/settings')
const getSetting = require('../settings').getSetting
const UrlUtil = require('../lib/urlutil')
const urlParse = require('../../app/common/urlParse')
const {makeImmutable} = require('../../app/common/state/immutableUtil')

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
 * Checks if a siteDetail has the specified tag
 *
 * @param sites The application state's Immutable sites map
 * @param siteDetail The site to check if it's in the specified tag
 * @return true if the location is already bookmarked
 */
module.exports.isSiteBookmarked = function (sites, siteDetail) {
  if (!sites) {
    return false
  }

  const site = sites.find((site) =>
    isBookmark(site.get('tags')) &&
    site.get('location') === UrlUtil.getLocationIfPDF(siteDetail.get('location')) &&
    (site.get('partitionNumber') || 0) === (siteDetail.get('partitionNumber') || 0)
  )

  if (site) {
    return true
  }
  return false
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
 * Adds or updates the specified siteDetail in sites.
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
 * @param {Function=} syncCallback specified if this change should be synced
 * @return The new sites Immutable object
 */
module.exports.addSite = function (sites, siteDetail, tag, originalSiteDetail, syncCallback) {
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
        sites = module.exports.removeSite(sites, dupFolder, siteTags.BOOKMARK_FOLDER, true)
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

  if (site.has('location')) {
    site = site.set('location', UrlUtil.getLocationIfPDF(site.get('location')))
  }

  const key = module.exports.getSiteKey(site)
  if (key === null) {
    return sites
  }
  if (getSetting(settings.SYNC_ENABLED) === true && syncCallback) {
    site = module.exports.setObjectId(site)
    syncCallback(site)
  }
  return sites.set(key, site)
}

/**
 * Removes the specified tag from a siteDetail
 *
 * @param {Immutable.Map} sites The application state's Immutable sites map
 * @param {Immutable.Map} siteDetail The siteDetail to remove a tag from
 * @param {string} tag
 * @param {boolean} reorder whether to reorder sites (default with reorder)
 * @param {Function=} syncCallback
 * @return {Immutable.Map} The new sites Immutable object
 */
module.exports.removeSite = function (sites, siteDetail, tag, reorder = true, syncCallback) {
  const key = module.exports.getSiteKey(siteDetail)
  if (!key) {
    return sites
  }
  if (getSetting(settings.SYNC_ENABLED) === true && syncCallback) {
    syncCallback(sites.getIn([key]))
  }

  const tags = sites.getIn([key, 'tags'])
  if (isBookmarkFolder(tags)) {
    const folderId = sites.getIn([key, 'folderId'])
    const childSites = sites.filter((site) => site.get('parentFolderId') === folderId)
    childSites.forEach((site) => {
      const tags = site.get('tags')
      tags.forEach((tag) => {
        sites = module.exports.removeSite(sites, site, tag, false, syncCallback)
      })
    })
  }
  let site = sites.get(key)
  if (!site) {
    return sites
  }
  if (isBookmark(tag)) {
    if (isPinnedTab(tags)) {
      const tags = site.get('tags').filterNot((tag) => tag === siteTags.BOOKMARK)
      site = site.set('tags', tags)
      return sites.set(key, site)
    }
    if (sites.size && reorder) {
      const order = sites.getIn([key, 'order'])
      sites = reorderSite(sites, order)
    }
    return sites.delete(key)
  } else if (isPinnedTab(tag)) {
    const tags = site.get('tags').filterNot((tag) => tag === siteTags.PINNED)
    site = site.set('tags', tags)
    return sites.set(key, site)
  } else {
    site = site.set('lastAccessedTime', undefined)
    return sites.set(key, site)
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
 * @param siteDetail The site detail to move
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
 * @param sites The application state's Immutable sites map
 * @param siteDetail The site detail to move
 * @param destinationDetail The site detail to move to
 * @param prepend Whether the destination detail should be prepended or not, not used if destinationIsParent is true
 * @param destinationIsParent Whether the item should be moved inside of the destinationDetail.
 * @param disallowReparent If set to true, parent folder will not be set
 * @param {Function=} syncCallback
 * @return The new sites Immutable object
 */
module.exports.moveSite = function (sites, sourceDetail, destinationDetail, prepend,
  destinationIsParent, disallowReparent, syncCallback) {
  if (!module.exports.isMoveAllowed(sites, sourceDetail, destinationDetail)) {
    return sites
  }

  const sourceKey = module.exports.getSiteKey(sourceDetail)
  const destinationKey = module.exports.getSiteKey(destinationDetail)

  const sourceSiteIndex = sites.getIn([sourceKey, 'order'])
  let destinationSiteIndex
  if (destinationIsParent) {
    // When the destination is the parent we want to put it at the end
    destinationSiteIndex = sites.size - 1
    prepend = true
  } else {
    destinationSiteIndex = sites.getIn([destinationKey, 'order'])
  }

  let sourceSite = sites.get(sourceKey)
  if (!sourceSite) {
    return sites
  }
  let newIndex = destinationSiteIndex + (prepend ? 0 : 1)
  if (destinationSiteIndex > sourceSiteIndex) {
    --newIndex
  }
  const destinationSite = sites.get(destinationKey)
  sites = sites.delete(sourceKey)
  sites = sites.map((site) => {
    const siteOrder = site.get('order')
    if (siteOrder >= newIndex && siteOrder < sourceSiteIndex) {
      return site.set('order', siteOrder + 1)
    } else if (siteOrder <= newIndex && siteOrder > sourceSiteIndex) {
      return site.set('order', siteOrder - 1)
    }
    return site
  })
  sourceSite = sourceSite.set('order', newIndex)

  if (!disallowReparent) {
    if (destinationIsParent && destinationDetail.get('folderId') !== sourceSite.get('folderId')) {
      sourceSite = sourceSite.set('parentFolderId', destinationDetail.get('folderId'))
    } else if (!destinationSite.get('parentFolderId')) {
      sourceSite = sourceSite.set('parentFolderId', 0)
    } else if (destinationSite.get('parentFolderId') !== sourceSite.get('parentFolderId')) {
      sourceSite = sourceSite.set('parentFolderId', destinationSite.get('parentFolderId'))
    }
  }
  if (getSetting(settings.SYNC_ENABLED) === true && syncCallback) {
    syncCallback(sourceSite)
  }
  return sites.set(module.exports.getSiteKey(sourceSite), sourceSite)
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

module.exports.getDetailFromTab = function (tab, tag) {
  return Immutable.fromJS({
    location: tab.get('url'),
    title: tab.get('title'),
    tags: tag ? [tag] : []
  })
}

/**
 * Update the favicon URL for all entries in the sites list
 * which match a given location. Currently, there should only be
 * one match, but this will handle multiple.
 *
 * @param sites The application state's Immutable sites list
 * @param location URL for the entry needing an update
 * @param favicon favicon URL
 */
module.exports.updateSiteFavicon = function (sites, location, favicon) {
  sites = makeImmutable(sites)

  if (UrlUtil.isNotURL(location)) {
    return sites
  }
  if (!Immutable.Map.isMap(sites)) {
    return sites
  }

  const matchingIndices = []

  sites.filter((site, index) => {
    if (!site || typeof site.get !== 'function') {
      return false
    }
    if (isBookmarkFolder(site.get('tags'))) {
      return false
    }
    if (UrlUtil.isNotURL(site.get('location'))) {
      return false
    }
    if (normURL(site.get('location')) === normURL(location)) {
      matchingIndices.push(index)
      return true
    }
    return false
  })

  if (!matchingIndices.length) return sites

  let updatedSites = sites
  matchingIndices.forEach((index) => {
    updatedSites = updatedSites.setIn([index, 'favicon'], favicon)
  })

  return updatedSites
}

/**
 * Normalizes a URL for comparison, with special handling for magnet links
 */
function normURL (url) {
  const lowerURL = url.toLowerCase()
  if (lowerURL.startsWith('magnet:?')) return lowerURL
  try {
    return normalizeUrl(url)
  } catch (e) {
    return url
  }
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
    if (siteDetail.get('location').startsWith('about:')) {
      return false
    }
    if (Immutable.is(siteDetail.get('tags'), new Immutable.List(['default'])) &&
      siteDetail.get('lastAccessedTime') === 1) {
      // This is a Brave default newtab site
      return false
    }
    return !!siteDetail.get('lastAccessedTime') && !isBookmarkFolder(siteDetail.get('tags'))
  }
  return false
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
 * @param {function} syncCallback
 */
module.exports.clearHistory = function (sites, syncCallback) {
  let bookmarks = sites.filter((site) => site.get('tags') && site.get('tags').size > 0)
  bookmarks.forEach((site, index) => {
    if (site.get('lastAccessedTime')) {
      bookmarks = bookmarks.setIn([index, 'lastAccessedTime'], null)
      if (getSetting(settings.SYNC_ENABLED) === true && syncCallback && site.get('objectId')) {
        syncCallback(site.set('lastAccessedTime', null))
      }
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
