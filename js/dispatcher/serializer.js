/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'
const Immutable = require('immutable')

/**
 * Converts an action in place to a serializable equivalent which is safe
 * to communicate across processes.  This basically just remoes all of the
 * Immutable JS.
 */
module.exports.serialize = (action) => {
  for (let property in action) {
    if (action.hasOwnProperty(property) && action[property] && action[property].toJS) {
      action[property] = action[property].toJS()
    }
  }
  return action
}

/**
 * Converts a serialized action in place to one using ImmutableJS where possible.
 */
module.exports.deserialize = (action) => {
  for (let property in action) {
    if (action.hasOwnProperty(property) && action[property] instanceof Object) {
      action[property] = Immutable.fromJS(action[property])
    }
  }
  return action
}
