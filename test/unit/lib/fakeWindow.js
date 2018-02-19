/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const EventEmitter = require('events')
const util = require('util')

// cannot be a class since sinon has
// trouble stubbing the constructor for a class
function FakeWindow (id) {
  this.id = id
  this.webContents = Object.assign(new EventEmitter())
  this.webContents.send = this.webContents.emit
  this._isVisible = false
  this.webContents.browserWindowOptions = { }
}

util.inherits(FakeWindow, EventEmitter)

//
// instance functions
//

FakeWindow.prototype.getId = function () {
  return this.id
}
FakeWindow.prototype.getBounds = function () {
  return {
    x: 10,
    y: 10,
    width: 800,
    height: 600
  }
}
FakeWindow.prototype.isDestroyed = function () {
  return false
}
FakeWindow.prototype.loadURL = function (url) { }
FakeWindow.prototype.show = function () {
  this._isVisible = true
}
FakeWindow.prototype.hide = function () {
  this._isVisible = false
}
FakeWindow.prototype.setFullScreen = function () { }
FakeWindow.prototype.maximize = function () { }
FakeWindow.prototype.isVisible = function () {
  return this._isVisible
}

//
// static functions
//

FakeWindow.getFocusedWindow = function () {
  return new FakeWindow(1)
}
FakeWindow.getActiveWindow = function () {
  return new FakeWindow(1)
}
FakeWindow.getAllWindows = function () {
  return [new FakeWindow(1)]
}
FakeWindow.fromWebContents = function () {
  return new FakeWindow(1)
}

module.exports = FakeWindow
