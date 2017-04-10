/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const mapValuesByKeys = require('../lib/functional').mapValuesByKeys

const _ = null
const preferenceTabs = {
  GENERAL: _,
  SEARCH: _,
  TABS: _,
  PLUGINS: _,
  SYNC: _,
  SHIELDS: _,
  SECURITY: _,
  PAYMENTS: _,
  ADVANCED: _,
  EXTENSIONS: _
}

module.exports = mapValuesByKeys(preferenceTabs)
