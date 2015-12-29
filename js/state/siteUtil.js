/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const Immutable = require('immutable')

var exports = {}

/**
 * Obtains the index of the location in sites
 *
 * @param sites The application state's Immutable sites list
 * @param location The frameProps of the page in question
 * @return index of the location or -1 if not found.
 */
exports.getSiteUrlIndex = function (sites, location) {
  return sites.findIndex(site => site.get('location') === location)
}

/**
 * Checks if a frameProps has the specified tag
 *
 * @param sites The application state's Immutable sites list
 * @param location The location of the page in question
 * @param tag The tag of the site to check
 * @return true if the location is already bookmarked
 */
exports.isSiteInList = function (sites, location, tag) {
  let index = exports.getSiteUrlIndex(sites, location)
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
 * @param tag The tag to add for this site.  Supported tags are:
 *   'bookmark' for bookmarks.
 *   'reader' for reading list.
 * Otherwise it's only considered to be a history item
 * @return The new sites Immutable object
 */
exports.addSite = function (sites, frameProps, tag) {
  let index = exports.getSiteUrlIndex(sites, frameProps.get('location'))
  let tags = sites.getIn([index, 'tags']) || new Immutable.List()
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
exports.removeSite = function (sites, frameProps, tag) {
  let index = exports.getSiteUrlIndex(sites, frameProps.get('location'))
  if (index === -1) {
    return sites
  }

  let tags = sites.getIn([index, 'tags'])
  return sites.setIn([index, 'tags'], tags.toSet().remove(tag).toList())
}

/**
 * Detemrines the icon class to use for the site
 *
 * @param site The site in question
 * @return the class of the fontawesome icon to use
 */
exports.getSiteIconClass = function (site) {
  if (site.get('tags').includes('bookmark')) {
    return 'fa-star'
  }
  if (site.get('tags').includes('reader')) {
    return 'fa-book'
  }
  return 'fa-file-o'
}

module.exports = exports
