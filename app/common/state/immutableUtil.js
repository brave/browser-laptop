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

  isSameHashCode: (first, second) => {
    if (first == null && second == null) {
      return true
    } else if (first == null || second == null) {
      return false
    }

    return first.hashCode() === second.hashCode()
  },

  makeImmutable: (obj) => {
    return api.isImmutable(obj) ? obj : Immutable.fromJS(obj)
  },

  deleteImmutablePaths: (obj, paths) => {
    return paths.reduce((result, path) => {
      if (path.constructor === Array) {
        return result.deleteIn(path)
      }
      return result.delete(path)
    }, obj)
  },

  makeJS: (obj, defaultValue) => {
    if (obj == null && defaultValue !== undefined) {
      return defaultValue
    }
    return api.isImmutable(obj) ? obj.toJS() : obj
  }
}

module.exports = api
