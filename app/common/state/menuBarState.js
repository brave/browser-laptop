/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const isWindows = require('../lib/platformUtil').isWindows()
const {getSetting} = require('../../../js/settings')
const settings = require('../../../js/constants/settings')

const api = {
  isMenuBarVisible: (windowState) => {
    return isWindows && (!getSetting(settings.AUTO_HIDE_MENU) || windowState.getIn(['ui', 'menubar', 'isVisible']))
  }
}

module.exports = api
