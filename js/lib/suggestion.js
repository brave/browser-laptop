/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appConfig = require('../constants/appConfig')

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
  const s1Priority = module.exports.sortingPriority(
    s1.get('count') || 0,
    (new Date()).getTime(),
    s1.get('lastAccessedTime') || (new Date()).getTime(),
    appConfig.urlSuggestions.ageDecayConstant
  )
  const s2Priority = module.exports.sortingPriority(
    s2.get('count') || 0,
    (new Date()).getTime(),
    s2.get('lastAccessedTime') || (new Date()).getTime(),
    appConfig.urlSuggestions.ageDecayConstant
  )
  return s2Priority - s1Priority
}
