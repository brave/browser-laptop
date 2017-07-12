/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const siteTags = require('../constants/siteTags')
const UrlUtil = require('../lib/urlutil')
const urlParse = require('../../app/common/urlParse')

// TODO remove
const isBookmark = (tags) => {
  if (!tags) {
    return false
  }
  return tags.includes(siteTags.BOOKMARK)
}

// TODO remove
const isBookmarkFolder = (tags) => {
  if (!tags) {
    return false
  }
  return (typeof tags === 'string' && tags === siteTags.BOOKMARK_FOLDER) ||
    (tags && typeof tags !== 'string' && tags.includes(siteTags.BOOKMARK_FOLDER))
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
 * Checks if a siteDetail has the specified tag.
 * Depends on siteDeatil siteKey being accurate.
 *
 * @param sites The application state's Immutable sites map
 * @param siteDetail The site to check if it's in the specified tag
 * @return true if the location is already bookmarked
 */
// TODO remove this when sync is updated
module.exports.isSiteBookmarked = function (sites, siteDetail) {
  const siteKey = module.exports.getSiteKey(siteDetail)
  const siteTags = sites.getIn([siteKey, 'tags'])
  return isBookmark(siteTags)
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

  // TODO fix so that correct remove is called
  /*
  let tag = ''
  if (objectData === 'bookmark') {
    // determine whether this is a folder
    tag = site.get('folderId') ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK
  }
  state = module.exports.removeSite(state, site, tag)
  */
  // If the object has been removed completely, purge it from the sync site
  // cache
  if (!state.getIn(objectKey)) {
    state = state.deleteIn(cacheKey)
  }
  return state
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
 * Determines if the site detail is a bookmark.
 * @param siteDetail The site detail to check.
 * @return true if the site detail has a bookmark tag.
 */
// TODO remove when sync is refactored
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
// TODO remove when sync is refactored
module.exports.isFolder = function (siteDetail) {
  if (siteDetail) {
    return isBookmarkFolder(siteDetail.get('tags')) && siteDetail.get('folderId') !== undefined
  }
  return false
}

/**
 * Determines if the site detail is a history entry.
 * @param siteDetail The site detail to check.
 * @return true if the site detail is a history entry.
 */
// TODO remove when sync is refactored
module.exports.isHistoryEntry = function (siteDetail) {
  if (siteDetail && typeof siteDetail.get('location') === 'string') {
    const tags = siteDetail.get('tags')
    if (siteDetail.get('location').startsWith('about:') ||
      isBookmarkFolder(tags)) {
      return false
    }
    return !!siteDetail.get('lastAccessedTime') || !tags || tags.size === 0
  }
  return false
}

/**
 * Gets a site origin (scheme + hostname + port) from a URL or null if not
 * available.
 * @param {string} location
 * @return {string|null}
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
