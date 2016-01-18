/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const mapValuesByKeys = require('../lib/functional').mapValuesByKeys

const _ = null
const AppConstants = {
  APP_NEW_WINDOW: _,
  APP_CLOSE_WINDOW: _,
  APP_ADD_SITE: _,
  APP_SET_STATE: _,
  APP_REMOVE_SITE: _,
  APP_SET_DEFAULT_WINDOW_SIZE: _,
  APP_SET_DATA_FILE_ETAG: _,
  APP_SET_DATA_FILE_LAST_CHECK: _,
  APP_UPDATE_LAST_CHECK: _,
  APP_SET_UPDATE_STATUS: _
}

module.exports = mapValuesByKeys(AppConstants)
