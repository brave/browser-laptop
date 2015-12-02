import Immutable from 'immutable'

/**
 * Obtains the index of the location in sites
 *
 * @param sites The application state's Immutable sites list
 * @param location The frameProps of the page in question
 * @return index of the location or -1 if not found.
 */
function getSiteUrlIndex (sites, location) {
  return sites.findIndex(site => site.get('location') === location)
}

/**
 * Checks if a frameProps is bookmarked
 *
 * @param sites The application state's Immutable sites list
 * @param location The location of the page in question
 * @return true if the location is already bookmarked
 */
export function isURLBookmarked (sites, location) {
  let index = getSiteUrlIndex(sites, location)
  if (index === -1) {
    return false
  }
  return sites.get(index).get('tags').includes('bookmark')
}

/**
 * Checks if a frameProps is in the reading list
 *
 * @param sites The application state's Immutable sites list
 * @param location The location of the page in question
 * @return true if the location is already in the reading list
 */
export function isURLInReadingList (sites, location) {
  let index = getSiteUrlIndex(sites, location)
  if (index === -1) {
    return false
  }
  return sites.get(index).get('tags').includes('reader')
}

/**
 * Detemrines the icon class to use for the site
 *
 * @param site The site in question
 * @return the class of the fontawesome icon to use
 */
export function getSiteIconClass (site) {
  if (site.get('tags').includes('bookmark')) {
    return 'fa-star'
  }
  if (site.get('tags').includes('reader')) {
    return 'fa-book'
  }
  return 'fa-file-o'
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
export function addSite (sites, frameProps, tag) {
  let index = getSiteUrlIndex(sites, frameProps.get('location'))
  let tags = sites.getIn([index, 'tags']) || new Immutable.List()
  let visitCount = (sites.getIn([index, 'visitCount']) || 0) + 1
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
    title: frameProps.get('title'),
    visitCount
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
export function removeSite (sites, frameProps, tag) {
  let index = getSiteUrlIndex(sites, frameProps.get('location'))
  if (index === -1) {
    return sites
  }

  let tags = sites.getIn([index, 'tags'])
  return sites.setIn([index, 'tags'], tags.toSet().remove(tag).toList())
}
