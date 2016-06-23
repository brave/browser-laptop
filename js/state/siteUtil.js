/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const Immutable = require('immutable')
const siteTags = require('../constants/siteTags')
const settings = require('../constants/settings')
const getSetting = require('../settings').getSetting
const urlParse = require('url').parse

/**
 * Obtains the index of the location in sites
 *
 * @param sites The application state's Immutable sites list
 * @param siteDetail The details of the site to get the index of
 * @return index of the site or -1 if not found.
 */
module.exports.getSiteIndex = function (sites, siteDetail, tags) {
  let isBookmarkFolder = typeof tags === 'string' && tags === siteTags.BOOKMARK_FOLDER ||
    tags && typeof tags !== 'string' && tags.includes(siteTags.BOOKMARK_FOLDER)
  if (isBookmarkFolder) {
    return sites.findIndex((site) => site.get('folderId') === siteDetail.get('folderId') && site.get('tags').includes(siteTags.BOOKMARK_FOLDER))
  }
  return sites.findIndex((site) => site.get('location') === siteDetail.get('location') && (site.get('partitionNumber') || 0) === (siteDetail.get('partitionNumber') || 0))
}

/**
 * Checks if a siteDetail has the specified tag
 *
 * @param sites The application state's Immutable sites list
 * @param siteDetail The site to check if it's in the specified tag
 * @return true if the location is already bookmarked
 */
module.exports.isSiteInList = function (sites, siteDetail, tag) {
  const index = module.exports.getSiteIndex(sites, siteDetail, tag)
  if (index === -1) {
    return false
  }
  return sites.get(index).get('tags').includes(tag)
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
  const maxIdItem = getNextFolderIdItem(sites)
  return (maxIdItem ? (maxIdItem.get('folderId') || 0) : 0) + 1
}

/**
 * Adds the specified siteDetail to sites
 *
 * @param sites The application state's Immutable site list
 * @param siteDetails The site details to add a tag to
 * @param tag The tag to add for this site.
 *   See siteTags.js for supported types. No tag means just a history item.
 * @param originalSiteDetail If specified will modify the specified site detail
 * @return The new sites Immutable object
 */
module.exports.addSite = function (sites, siteDetail, tag, originalSiteDetail) {
  if (tag === undefined) {
    tag = siteDetail.getIn(['tags', 0])
  }
  const index = module.exports.getSiteIndex(sites, originalSiteDetail || siteDetail, tag)

  let folderId = siteDetail.get('folderId')
  if (!folderId && tag === siteTags.BOOKMARK_FOLDER) {
    folderId = module.exports.getNextFolderId(sites)
  }

  let tags = index !== -1 && sites.getIn([index, 'tags']) || new Immutable.List()
  if (tag) {
    tags = tags.toSet().add(tag).toList()
  }

  let oldSite
  if (index !== -1) {
    oldSite = sites.getIn([index])
  }

  let site = Immutable.fromJS({
    lastAccessedTime: siteDetail.get('lastAccessedTime') || new Date().getTime(),
    tags,
    location: siteDetail.get('location'),
    // We don't want bookmarks and other site info being renamed on users if they already exist
    // The name should remain the same while it is bookmarked forever.
    title: oldSite && tags.includes(siteTags.BOOKMARK) ? oldSite.get('title') : siteDetail.get('title')
  })
  if (folderId) {
    site = site.set('folderId', Number(folderId))
  }
  if (siteDetail.get('parentFolderId') || oldSite && oldSite.get('parentFolderId')) {
    site = site.set('parentFolderId', Number(siteDetail.get('parentFolderId') || oldSite.get('parentFolderId')))
  }
  if (siteDetail.get('customTitle') || oldSite && oldSite.get('customTitle')) {
    site = site.set('customTitle', siteDetail.get('customTitle') || oldSite.get('customTitle'))
  }
  if (siteDetail.get('partitionNumber') || oldSite && oldSite.get('partitionNumber')) {
    site = site.set('partitionNumber', Number(siteDetail.get('partitionNumber') || oldSite.get('partitionNumber')))
  }
  if (siteDetail.get('favicon') || oldSite && oldSite.get('favicon')) {
    site = site.set('favicon', siteDetail.get('favicon') || oldSite.get('favicon'))
  }

  if (index === -1) {
    return sites.push(site)
  }

  return sites.setIn([index], site)
}

/**
 * Removes the specified tag from a siteDetail
 *
 * @param sites The application state's Immutable sites list
 * @param siteDetail The siteDetail to remove a tag from
 * @return The new sites Immutable object
 */
module.exports.removeSite = function (sites, siteDetail, tag) {
  const index = module.exports.getSiteIndex(sites, siteDetail, tag)
  if (index === -1) {
    return sites
  }
  const tags = sites.getIn([index, 'tags'])
  // If there are no tags and the removeSite call was called without a specific tag
  // then remove the entry completely.
  if (tags.size === 0 && tag) {
    sites = sites.splice(index, 1)
    return sites
  }
  return sites.setIn([index, 'tags'], tags.toSet().remove(tag).toList())
}

function fillParentFolders (parentFolderIds, bookmarkFolder, allBookmarks) {
  if (bookmarkFolder.get('parentFolderId')) {
    parentFolderIds.push(bookmarkFolder.get('parentFolderId'))
    const nextItem = allBookmarks.find((item) => item.get('folderId') === bookmarkFolder.get('parentFolderId'))
    if (nextItem) {
      fillParentFolders(parentFolderIds, nextItem, allBookmarks)
    }
  }
}

/**
 * Moves the specified site from one location to another
 *
 * @param sites The application state's Immutable sites list
 * @param siteDetail The site detail to move
 * @param destinationDetail The site detail to move to
 * @param prepend Whether the destination detail should be prepended or not, not used if destinationIsParent is true
 * @param destinationIsParent Whether the item should be moved inside of the destinationDetail.
 * @param disallowReparent If set to true, parent folder will not be set
 * @return The new sites Immutable object
 */
module.exports.moveSite = function (sites, sourceDetail, destinationDetail, prepend, destinationIsParent, disallowReparent) {
  // Disallow loops
  let parentFolderIds = []
  if (destinationDetail.get('parentFolderId') && sourceDetail.get('folderId')) {
    fillParentFolders(parentFolderIds, destinationDetail, sites)
    if (sourceDetail.get('folderId') === destinationDetail.get('folderId') ||
        parentFolderIds.includes(sourceDetail.get('folderId'))) {
      return sites
    }
  }

  const sourceSiteIndex = module.exports.getSiteIndex(sites, sourceDetail, sourceDetail.get('tags'))
  let destinationSiteIndex
  if (destinationIsParent) {
    // When the destinatiaon is the parent we want to put it at the end
    destinationSiteIndex = sites.size - 1
    prepend = false
  } else {
    destinationSiteIndex = module.exports.getSiteIndex(sites, destinationDetail, destinationDetail.get('tags'))
  }

  let newIndex = destinationSiteIndex + (prepend ? 0 : 1)
  let sourceSite = sites.get(sourceSiteIndex)
  let destinationSite = sites.get(destinationSiteIndex)
  sites = sites.splice(sourceSiteIndex, 1)
  if (newIndex > sourceSiteIndex) {
    newIndex--
  }

  if (!disallowReparent) {
    if (destinationIsParent && destinationDetail.get('folderId') !== sourceSite.get('folderId')) {
      sourceSite = sourceSite.set('parentFolderId', destinationDetail.get('folderId'))
    } else if (!destinationSite.get('parentFolderId')) {
      sourceSite = sourceSite.delete('parentFolderId')
    } else if (destinationSite.get('parentFolderId') !== sourceSite.get('parentFolderId')) {
      sourceSite = sourceSite.set('parentFolderId', destinationSite.get('parentFolderId'))
    }
  }
  return sites.splice(newIndex, 0, sourceSite)
}

module.exports.getDetailFromFrame = function (frame, tag) {
  let location = frame.get('location')
  if (frame.get('pinnedLocation') && tag === siteTags.PINNED) {
    location = frame.get('pinnedLocation')
  }

  return Immutable.fromJS({
    location,
    title: frame.get('title'),
    partitionNumber: frame.get('partitionNumber'),
    tags: tag ? [tag] : [],
    favicon: frame.get('icon')
  })
}

/**
 * Converts a siteDetail to frameOpts format
 * @param {Object} siteDetail - A site detail as per app state
 * @return {Object} A frameOpts plain JS object, not ImmutableJS
 */
module.exports.toFrameOpts = function (siteDetail) {
  return {
    location: siteDetail.get('location'),
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
 * Determines if the site detail is a folder.
 * @param siteDetail The site detail to check.
 * @return true if the site detail is a folder.
 */
module.exports.isFolder = function (siteDetail) {
  return siteDetail.get('tags').includes(siteTags.BOOKMARK_FOLDER)
}

/**
 * Obtains an array of folders
 */
module.exports.getFolders = function (sites, folderId, parentId, labelPrefix) {
  parentId = parentId || 0
  let folders = []
  sites.forEach((site) => {
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
 * Clears out all sites that have no tags.
 * @param sites The application state's Immutable sites list.
 */
module.exports.clearSitesWithoutTags = function (sites) {
  return sites.filter((site) => site.get('tags') && site.get('tags').size > 0)
}

/**
 * Determines if the sites list has any sites with no tags
 * @param sites The application state's Immutable sites list.
 */
module.exports.hasNoTagSites = function (sites) {
  return sites.findIndex((site) => !site.get('tags') || site.get('tags').size === 0) !== -1
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
  let parsed = urlParse(location)
  if (parsed.host && parsed.protocol) {
    return parsed.slashes ? [parsed.protocol, parsed.host].join('//') : [parsed.protocol, parsed.host].join('')
  } else {
    return null
  }
}
