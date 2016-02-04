/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = {
  events: {},
  embedder: null,
  processMessage: function (event) {
    if (event.origin === 'file://') {
      this.embedder = this.embedder || event.source
      var cb = this.events[event.data[0]]
      cb && cb.apply(null, event.data)
    }
  },
  on: function (name, cb) {
    this.events[name] = cb
  },
  send: function () {
    var args = Array.prototype.slice.call(arguments)
    this.embedder && this.embedder.postMessage(args, 'file://')
  }
}

window.addEventListener('message', module.exports.processMessage.bind(module.exports))
