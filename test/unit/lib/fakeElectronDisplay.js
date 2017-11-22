/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

class FakeElectronDisplay {
  constructor () {
    this.id = 1
    this.bounds = {
      x: 0,
      y: 0,
      width: 1280,
      height: 1100
    }
    this.size = {
      width: 1280,
      height: 1100
    }
    this.workAreaSize = {
      width: 1100,
      height: 1000
    }
  }
}

module.exports = FakeElectronDisplay
