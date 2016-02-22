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
 * @param location The frameProps of the page in question
 * @param partitionNumber The partition number of the session or undefined
 * @return index of the location or -1 if not found.
 */
module.exports.getSiteIndex = function (sites, location, partitionNumber, title, tags) {
  let isBookmarkFolder = typeof tags === 'string' && tags === siteTags.BOOKMARK_FOLDER ||
    typeof tags !== 'string' && tags.includes(siteTags.BOOKMARK_FOLDER)
  if (isBookmarkFolder) {
    return sites.findIndex(site => site.get('title') === title && site.get('tags').includes(siteTags.BOOKMARK_FOLDER))
  }
  return sites.findIndex(site => site.get('location') === location && (site.get('partitionNumber') || 0) === (partitionNumber || 0))
}

/**
 * Checks if a frameProps has the specified tag
 *
 * @param sites The application state's Immutable sites list
 * @param siteDetail The site to check if it's in the specified tag
 * @return true if the location is already bookmarked
 */
module.exports.isSiteInList = function (sites, siteDetail, tag) {
  const index = module.exports.getSiteIndex(sites, siteDetail.get('location'), siteDetail.get('partitionNumber'), siteDetail.get('title'), tag)
  if (index === -1) {
    return false
  }
  return sites.get(index).get('tags').includes(tag)
}

/**
 * Adds the specified frameProps to sites
 *
 * @param sites The application state's Immutable site list
 * @param frameProps The frameProps of the page in question
 * @param tag The tag to add for this site.
 *   See siteTags.js for supported types. No tag means just a history item.
 * @param originalDetail If specified will modify the specified site detail
 * @return The new sites Immutable object
 */
module.exports.addSite = function (sites, frameProps, tag, originalDetail) {
  const index = module.exports.getSiteIndex(sites,
      originalDetail && originalDetail.get('location') || frameProps.get('location'),
      originalDetail && originalDetail.get('partitionNumber') || frameProps.get('partitionNumber'),
      originalDetail && originalDetail.get('title') || frameProps.get('title'),
      tag)
  let tags = index !== -1 && sites.getIn([index, 'tags']) || new Immutable.List()
  if (tag) {
    tags = tags.toSet().add(tag).toList()
  } else {
    // If we aren't adding any tags and we're a private tab,
    // then do nothing.
    if (frameProps.get('isPrivate')) {
      return sites
    }
  }

  let site = Immutable.fromJS({
    lastAccessed: new Date(),
    tags,
    location: frameProps.get('location'),
    title: frameProps.get('title')
  })
  if (frameProps.get('partitionNumber')) {
    site = site.set('partitionNumber', frameProps.get('partitionNumber'))
  }

  if (index === -1) {
    return sites.push(site)
  }

  return sites.setIn([index], site)
}

/**
 * Removes the specified frameProps from sites
 *
 * @param sites The application state's Immutable sites list
 * @param frameProps The frameProps of the page in question
 * @return The new sites Immutable object
 */
module.exports.removeSite = function (sites, frameProps, tag) {
  let index = -1
  if (frameProps.get('pinnedLocation') && tag === siteTags.PINNED) {
    index = module.exports.getSiteIndex(sites, frameProps.get('pinnedLocation'), frameProps.get('partitionNumber'), frameProps.get('title'), tag)
  }
  // When pinning a tab from the current window the src might not be
  // set to the current site on that first window.
  // So only if it's not found with the src and it's a pinned tab,
  // then check the src then location.  This also fixes pinned sites
  // with HTTPS Everywhere.
  if (index === -1) {
    index = module.exports.getSiteIndex(sites, frameProps.get('location'), frameProps.get('partitionNumber'), frameProps.get('title'), tag)
  }
  if (index === -1) {
    return sites
  }
  const tags = sites.getIn([index, 'tags'])
  return sites.setIn([index, 'tags'], tags.toSet().remove(tag).toList())
}

module.exports.moveSite = function (sites, sourceDetail, destinationDetail, prepend) {
  const sourceSiteIndex = module.exports.getSiteIndex(sites, sourceDetail.get('location'), sourceDetail.get('partitionNumber'), sourceDetail.get('title'), sourceDetail.get('tags'))
  // TODO: Need partition number for drag and drop
  let newIndex = module.exports.getSiteIndex(sites, destinationDetail.get('location'), destinationDetail.get('partitionNumber'), destinationDetail.get('title'), destinationDetail.get('tags')) + (prepend ? 0 : 1)
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
  return Immutable.fromJS({
    location: frame.get('location'),
    title: frame.get('title'),
    partitionNumber: frame.get('partitionNumber'),
    tags: [tag]
  })
}
