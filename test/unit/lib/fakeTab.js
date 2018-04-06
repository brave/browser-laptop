/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const EventEmitter = require('events')
const util = require('util')

let nextGuestInstanceId = 0

function FakeTab (id, windowId, guestInstanceId = nextGuestInstanceId++) {
  this.id = id
  this.windowId = windowId
  this.guestInstanceId = guestInstanceId
  this.session = {
    partition: 'persist:partition-0'
  }
  this._isDestroyed = false
  this._canGoBack = false
  this._canGoForward = false
  this._isPlaceholder = false
}

util.inherits(FakeTab, EventEmitter)

const proto = FakeTab.prototype

proto.getId = function () {
  return this.id
}

proto.tabValue = function () {
  return {
    id: this.id,
    windowId: this.windowId
  }
}

proto.isDestroyed = function () {
  return this._isDestroyed
}

proto.canGoBack = function () {
  return this._canGoBack
}

proto.canGoForward = function () {
  return this._canGoForward
}

proto.isPlaceholder = function () {
  return this._isPlaceholder
}

module.exports = FakeTab
