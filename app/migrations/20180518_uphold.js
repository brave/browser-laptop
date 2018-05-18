/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const compareVersions = require('compare-versions')

// per https://github.com/brave/browser-laptop/issues/14152
// add fingerprint exception for existing users for uphold.com
module.exports = (data) => {
  if (!data.lastAppVersion) {
    return
  }

  let migrationNeeded = false

  try {
    migrationNeeded = compareVersions(data.lastAppVersion, '0.22.714') !== 1
  } catch (e) {}

  if (migrationNeeded) {
    const pattern = 'https://uphold.com'
    if (!data.siteSettings[pattern]) {
      data.siteSettings[pattern] = {}
    }
    let targetSetting = data.siteSettings[pattern]
    if (targetSetting.fingerprintingProtection == null) {
      targetSetting.fingerprintingProtection = 'allowAllFingerprinting'
    }
  }
}
