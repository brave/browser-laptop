/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const fs = require('fs')
const Immutable = require('immutable')
const sessionStorageVersion = 1
const sessionStorageName = `session-store-${sessionStorageVersion}`

/**
 * Saves the specified immutable browser state to storage.
 *
 * @param browserState Immutable applicaiton state as per
 *   https://github.com/brave/browser/wiki/Application-State
 * @return a promise which resolves when the state is saved
 */
module.exports.saveAppState = (payload) => {
  return new Promise(resolve => {
    payload = payload.toJS()

    // Don't persist private frames
    // TODO when we have per window state as well:
    // payload.frames = payload.frames.filter(frame => !frame.isPrivate)
    fs.writeFile(sessionStorageName, JSON.stringify(payload), (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Loads the browser state from storage.
 *
 * @return a promise which resolves with the immutable browser state or
 * rejects if the state cannot be loaded.
 */
module.exports.loadAppState = () => {
  return new Promise((resolve, reject) => {

    fs.readFile(sessionStorageName, (err, data) => {
      if (err || !data) {
        reject(err)
      }
      data = JSON.parse(data)
      resolve(Immutable.fromJS(data))
    })
  })
}

/**
 * Obtains the default application level state
 */
module.exports.defaultAppState = () => {
  return Immutable.fromJS({
    windows: [],
    sites: [],
    visits: [],
    updateAvailable: false
  })
}
