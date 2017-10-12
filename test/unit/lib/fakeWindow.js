/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const EventEmitter = require('events')

class FakeWindow extends EventEmitter {
  constructor (id) {
    super()
    this.id = id
    this.webContents = Object.assign(new EventEmitter())
    this.webContents.send = this.webContents.emit
  }
  getId () {
    return this.id
  }
}

module.exports = FakeWindow
