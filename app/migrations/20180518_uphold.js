/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const compareVersions = require('compare-versions')

// per https://github.com/brave/browser-laptop/issues/14152
// add fingerprint exception for existing users for uphold.com
module.exports = (data) => {
  // don't apply if:
  // - user chooses to block all fingerprinting (global setting)
  // - user is not upgrading from 0.22.714 or earlier
  if ((data.fingerprintingProtectionAll && data.fingerprintingProtectionAll.enabled) ||
    !data.lastAppVersion) {
    return false
  }

  let migrationNeeded = false

  try {
    migrationNeeded = compareVersions(data.lastAppVersion, '0.22.714') !== 1
  } catch (e) {}

  if (migrationNeeded) {
    const pattern = 'https?://uphold.com'
    if (!data.siteSettings) {
      data.siteSettings = {}
    }
    if (!data.siteSettings[pattern]) {
      data.siteSettings[pattern] = {}
    }
    let targetSetting = data.siteSettings[pattern]
    if (targetSetting.fingerprintingProtection == null) {
      targetSetting.fingerprintingProtection = 'allowAllFingerprinting'
    }
  }

  return migrationNeeded
}
