/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const mapValuesByKeys = require('../lib/functional').mapValuesByKeys

const _ = null
const settings = {
  // General tab
  STARTUP_MODE: _,
  HOMEPAGE: _,
  // Search tab
  DEFAULT_SEARCH_ENGINE: _,
  // Tabs tab
  SWITCH_TO_NEW_TABS: _,
  PAINT_TABS: _,
  TABS_PER_TAB_PAGE: _,
  // Privacy Tab
  HISTORY_SUGGESTIONS: _,
  BOOKMARK_SUGGESTIONS: _,
  OPENED_TAB_SUGGESTIONS: _,
  // Security Tab
  BLOCK_REPORTED_SITES: _
}

module.exports = mapValuesByKeys(settings)

