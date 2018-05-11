/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const mapValuesByKeys = require('../lib/functional').mapValuesByKeys

const _ = null
const downloadStates = {
  PENDING: _,
  IN_PROGRESS: _,
  RESUMING: _,
  PAUSED: _,
  COMPLETED: _,
  CANCELLED: _,
  INTERRUPTED: _,
  UNAUTHORIZED: _,
  SAFE_BROWSING_BLOCKED: _
}

module.exports = mapValuesByKeys(downloadStates)
