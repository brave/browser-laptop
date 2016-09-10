/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const mapValuesByKeys = require('../../../js/lib/functional').mapValuesByKeys

const _ = null
const ExtensionConstants = {
  BROWSER_ACTION_REGISTERED: _,
  BROWSER_ACTION_UPDATED: _,
  EXTENSION_INSTALLED: _,
  EXTENSION_UNINSTALLED: _,
  EXTENSION_ENABLED: _,
  EXTENSION_DISABLED: _
}

module.exports = mapValuesByKeys(ExtensionConstants)
