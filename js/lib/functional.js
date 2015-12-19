/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Map an object's keys to equivalent names as the keys but with dashes
 *
 * @param o The object for the keys to be mapped
 * @return A new object with the values mapped to similar key names
 */
module.exports.mapValuesByKeys = (o) =>
  Object.keys(o).reduce((newObject, k) => {
    newObject[k] = k.toLowerCase().replace(/_/g, '-')
    return newObject
  }, {})
