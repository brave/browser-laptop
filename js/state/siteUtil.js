/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const Immutable = require('immutable')
const siteTags = require('../constants/siteTags')

/**
 * Obtains the index of the location in sites
 *
 * @param sites The application state's Immutable sites list
 * @param siteDetail The details of the site to get the index of
 * @return index of the site or -1 if not found.
 */
module.exports.getSiteIndex = function (sites, siteDetail, tags) {
  let isBookmarkFolder = typeof tags === 'string' && tags === siteTags.BOOKMARK_FOLDER ||
    typeof tags !== 'string' && tags.includes(siteTags.BOOKMARK_FOLDER)
  if (isBookmarkFolder) {
    return sites.findIndex(site => site.get('title') === siteDetail.get('title') && site.get('tags').includes(siteTags.BOOKMARK_FOLDER))
  }
  return sites.findIndex(site => site.get('location') === siteDetail.get('location') && (site.get('partitionNumber') || 0) === (siteDetail.get('partitionNumber') || 0))
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
  const index = module.exports.getSiteIndex(sites, originalSiteDetail || siteDetail, tag)
  let tags = index !== -1 && sites.getIn([index, 'tags']) || new Immutable.List()
  if (tag) {
    tags = tags.toSet().add(tag).toList()
  }

  let site = Immutable.fromJS({
    lastAccessed: new Date(),
    tags,
    location: siteDetail.get('location'),
    title: siteDetail.get('title')
  })
  if (siteDetail.get('partitionNumber')) {
    site = site.set('partitionNumber', siteDetail.get('partitionNumber'))
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
  return sites.setIn([index, 'tags'], tags.toSet().remove(tag).toList())
}

module.exports.moveSite = function (sites, sourceDetail, destinationDetail, prepend) {
  const sourceSiteIndex = module.exports.getSiteIndex(sites, sourceDetail, sourceDetail.get('tags'))
  // TODO: Need partition number for drag and drop
  let newIndex = module.exports.getSiteIndex(sites, destinationDetail, destinationDetail.get('tags')) + (prepend ? 0 : 1)
  let sourceSite = sites.get(sourceSiteIndex)
  sites = sites.splice(sourceSiteIndex, 1)
  if (newIndex > sourceSiteIndex) {
    newIndex--
  }
  return sites.splice(newIndex, 0, sourceSite)
}

/**
 * Detemrines the icon class to use for the site
 *
 * @param site The site in question
 * @return the class of the fontawesome icon to use
 */
module.exports.getSiteIconClass = function (site) {
  if (site.get('tags').includes('bookmark')) {
    return 'fa-star-o'
  }
  if (site.get('tags').includes('reader')) {
    return 'fa-book'
  }
  return 'fa-file-o'
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
    tags: tag ? [tag] : []
  })
}

module.exports.isEquivalent = function (siteDetail1, siteDetail2) {
  const isFolder1 = siteDetail1.get('tags').includes(siteTags.BOOKMARK_FOLDER)
  const isFolder2 = siteDetail2.get('tags').includes(siteTags.BOOKMARK_FOLDER)
  if (isFolder1 !== isFolder2) {
    return false
  }

  // If they are both folders
  if (isFolder1) {
    return siteDetail1.get('title') === siteDetail2.get('title')
  }
  return siteDetail1.get('location') === siteDetail2.get('location') && siteDetail1.get('partitionNumber') !== siteDetail2.get('partitionNumber')
}
