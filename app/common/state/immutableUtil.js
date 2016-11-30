/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

const api = {
  isImmutable: (obj) => {
    return obj && obj.toJS
  },

  isMap: (obj) => {
    return Immutable.Map.isMap(obj)
  },

  isList: (obj) => {
    return Immutable.List.isList(obj)
  },

  makeImmutable: (obj) => {
    return api.isImmutable(obj) ? obj : Immutable.fromJS(obj)
  }
}

module.exports = api
