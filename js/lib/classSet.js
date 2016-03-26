/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Converts an object with boolean properties to a CSS string.
 * Only the property names with truthy values are included.
 */
module.exports = (obj) => Object.keys(obj).filter((prop) => obj[prop]).join(' ')
