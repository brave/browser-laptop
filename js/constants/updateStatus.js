/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const mapValuesByKeys = require('../lib/functional').mapValuesByKeys

const _ = null
const updateStatus = {
  UPDATE_NONE: _,
  UPDATE_CHECKING: _,
  UPDATE_AVAILABLE: _,
  UPDATE_AVAILABLE_DEFERRED: _,
  UPDATE_DOWNLOADING: _,
  UPDATE_NOT_AVAILABLE: _,
  UPDATE_ERROR: _,
  // Used only when closing from the update UI.
  // indicate the app should close and allow restart.
  // A restart always happens after an update but will
  // re-close unless this is set.
  UPDATE_APPLYING_RESTART: _,
  UPDATE_APPLYING_NO_RESTART: _
}

module.exports = mapValuesByKeys(updateStatus)
