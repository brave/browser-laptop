/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const getSetting = require('../../../js/settings').getSetting
const settings = require('../../../js/constants/settings')

module.exports.shouldDisplayDialog = (state) => {
  return !getSetting(settings.IS_DEFAULT_BROWSER) &&
    !state.get('defaultBrowserCheckComplete') &&
    getSetting(settings.CHECK_DEFAULT_ON_STARTUP)
}
