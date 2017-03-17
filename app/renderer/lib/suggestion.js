/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const urlParse = require('../../common/urlParse')
const appConfig = require('../../../js/constants/appConfig')
const _ = require('underscore')
const Immutable = require('immutable')
const {makeImmutable} = require('../../common/state/immutableUtil')

const sigmoid = (t) => {
  return 1 / (1 + Math.pow(Math.E, -t))
}

const ONE_DAY = 1000 * 60 * 60 * 24

/*
 * Calculate the sorting priority for a history item based on number of
 * accesses and time since last access
 *
 * @param {number} count - The number of times this site has been accessed
 * @param {number} currentTime - Current epoch millisecnds
 * @param {boolean} lastAccessedTime - Epoch milliseconds of last access
 *
 */
module.exports.sortingPriority = (count, currentTime, lastAccessedTime, ageDecayConstant) => {
  // number of days since last access (with fractional component)
  const ageInDays = (currentTime - (lastAccessedTime || currentTime)) / ONE_DAY
  // decay factor based on age
  const ageFactor = 1 - ((sigmoid(ageInDays / ageDecayConstant) - 0.5) * 2)
  // sorting priority
  // console.log(count, ageInDays, ageFactor, count * ageFactor)
  return count * ageFactor
}

/*
 * Sort two history items by priority
 *
 * @param {ImmutableObject} s1 - first history item
 * @param {ImmutableObject} s2 - second history item
 *
 * Return the relative order of two site entries taking into consideration
 * the number of times the site has been accessed and the length of time
 * since the last access.
 *
 * The base sort order is determined by the count attribute of the site
 * entry. A modifier is then computed based on the length of time since
 * the last access. A sigmoid function is used to weight more recent
 * entries higher than entries in the past. This is not a linear function,
 * entries in the far past with many counts will still be discounted
 * heavily as the sigmoid modifier will cancel most of the count
 * base parameter.
 *
 * Below is a sample comparison of two sites that have been accessed
 * recently (but not at the identical time). Each site is accessed
 * 9 times. The count is discounted by an aging factor calculated
 * using the sigmoid decay function.
 *
 *   http://www.gm.ca/gm/
 *
 *   ageInDays 0.17171469907407408
 *   ageFactor 0.9982828546969802
 *   count     9
 *   priority  0.9982828546969802
 *
 *   http://www.gm.com/index.html
 *
 *   ageInDays 0.17148791666666666
 *   ageFactor 0.9982851225143763
 *   count     9
 *   priority  0.9982851225143763
 *
 */
module.exports.sortByAccessCountWithAgeDecay = (s1, s2) => {
  const now = new Date()
  const s1Priority = module.exports.sortingPriority(
    s1.get('count') || 0,
    now.getTime(),
    s1.get('lastAccessedTime') || now.getTime(),
    appConfig.urlSuggestions.ageDecayConstant
  )
  const s2Priority = module.exports.sortingPriority(
    s2.get('count') || 0,
    now.getTime(),
    s2.get('lastAccessedTime') || now.getTime(),
    appConfig.urlSuggestions.ageDecayConstant
  )
  return s2Priority - s1Priority
}

/*
 * Return a 1 if the url is 'simple' as in without query, search or
 * hash components. Return 0 otherwise.
 *
 * @param {ImmutableObject} site - object represent history entry
 *
 */
module.exports.simpleDomainNameValue = (site) => {
  const parsed = urlParse(site.get('location'))
  if (parsed.hash === null && parsed.search === null && parsed.query === null && parsed.pathname === '/') {
    return 1
  } else {
    return 0
  }
}

/*
 * Normalize a location for url suggestion sorting
 *
 * @param {string} location - history item location
 *
 */
module.exports.normalizeLocation = (location) => {
  if (typeof location === 'string') {
    location = location.replace(/www\./, '')
    location = location.replace(/^http:\/\//, '')
    location = location.replace(/^https:\/\//, '')
  }
  return location
}

/*
 * Determines based on user input if the location should
 * be normalized.  If the user is typing http prefix then
 * they are specifying something explicitly.
 *
 * @return true if urls being compared should be normalized
 */
module.exports.shouldNormalizeLocation = (input) => {
  const prefixes = ['http://', 'https://', 'www.']
  return prefixes.every((prefix) => {
    if (input.length > prefix.length) {
      return true
    }
    for (let i = 0; i < Math.min(prefix.length, input.length); i++) {
      if (input[i] !== prefix[i]) {
        return true
      }
    }
    return false
  })
}

/*
 * return a site representing the simple location for a
 * set of related sites without a history item for the
 * simple location.
 *
 * This is used to show a history suggestion for something
 * like www.google.com if it has not been visited but
 * there are two or more locations with that prefix containing
 * path info or parameters
 *
 * @param {Array[Object]} sites - array of similar sites
 */
var virtualSite = (sites) => {
  // array of sites without paths or query params
  var simple = sites.filter((parsed) => {
    return (parsed.hash === null && parsed.search === null && parsed.query === null && parsed.pathname === '/')
  })
  // if there are no simple locations then we will build and return one
  if (simple.length === 0) {
    // we need to create a virtual history item
    return Immutable.Map({
      location: sites[0].protocol + '//' + sites[0].host,
      count: 0,
      title: sites[0].host,
      lastAccessedTime: (new Date()).getTime()
    })
  }
}

/*
 * Create an array of simple locations from history
 * The simple locations will be the root domain for a location
 * without parameters or path
 *
 * @param {ImmutableList[ImmutableMap]} - history
 */
module.exports.createVirtualHistoryItems = (historySites) => {
  historySites = makeImmutable(historySites || {})

  // parse each history item
  const parsedHistorySites = []
  historySites.forEach((site) => {
    if (site && site.get('location')) {
      parsedHistorySites.push(
        urlParse(site.get('location'))
      )
    }
  })
  // group them by host
  var grouped = _.groupBy(parsedHistorySites, (parsedSite) => {
    return parsedSite.host || 'unknown'
  })
  // find groups with more than 2 of the same host
  var multiGroupKeys = _.filter(_.keys(grouped), (k) => {
    return grouped[k].length > 0
  })
  // potentially create virtual history items
  var virtualHistorySites = _.map(multiGroupKeys, (location) => {
    return virtualSite(grouped[location])
  })
  virtualHistorySites = _.filter(virtualHistorySites, (site) => {
    return !!site
  })
  return Immutable.fromJS(_.object(virtualHistorySites.map((site) => {
    return [site.location, site]
  })))
}
