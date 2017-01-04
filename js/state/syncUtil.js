/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')

/**
 * Sets object id on a state entry.
 * @param {Immutable.Map} item
 * @returns {Immutable.map}
 */
module.exports.setObjectId = (item) => {
  if (!item || !item.toJS) {
    return
  }
  if (item.get('objectId')) {
    return item
  }
  const crypto = require('crypto')
  return item.set('objectId', new Immutable.List(crypto.randomBytes(16)))
}
