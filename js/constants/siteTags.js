/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const mapValuesByKeys = require('../lib/functional').mapValuesByKeys

const _ = null
const siteTags = {
  DEFAULT: _,
  BOOKMARK: _,
  BOOKMARK_FOLDER: _,
  PINNED: _,
  READING_LIST: _
}

module.exports = mapValuesByKeys(siteTags)
