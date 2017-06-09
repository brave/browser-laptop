/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const mapValuesByKeys = require('../lib/functional').mapValuesByKeys

const _ = null
const syncConstants = {
  SYNC_CLEAR_HISTORY: _,
  SYNC_CLEAR_SITE_SETTINGS: _
}

module.exports = mapValuesByKeys(syncConstants)
