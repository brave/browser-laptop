/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

class Dispatcher {

  constructor () {
    this.callbacks = []
    this.promises = []
  }

  /**
   * Register a Store's callback so that it may be invoked by an action.
   * @param {function} callback The callback to be registered.
   * @return {number} The index of the callback within the _callbacks array.
   */
  register (callback) {
    this.callbacks.push(callback)
    return this.callbacks.length - 1 // index
  }

  /**
   * dispatch
   * @param  {object} payload The data from the action.
   */
  dispatch (payload) {
    // First create array of promises for callbacks to reference.
    const resolves = []
    const rejects = []
    this.promises = this.callbacks.map(function (_, i) {
      return new Promise(function (resolve, reject) {
        resolves[i] = resolve
        rejects[i] = reject
      })
    })
    // Dispatch to callbacks and resolve/reject promises.
    this.callbacks.forEach(function (callback, i) {
      // Callback can return an obj, to resolve, or a promise, to chain.
      // See waitFor() for why this might be useful.
      Promise.resolve(callback(payload)).then(function () {
        resolves[i](payload)
      }, function () {
        rejects[i](new Error('Dispatcher callback unsuccessful'))
      })
    })
    this.promises = []
  }
}

module.exports = Dispatcher
