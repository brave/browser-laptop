/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// UPDATE_HOST should be set to the host name for the auto-updater server
var updateHost = process.env.UPDATE_HOST || 'https://brave-laptop-updates.global.ssl.fastly.net'

module.exports = {
  adBlockUrl: 'https://s3.amazonaws.com/adblock-data/{version}/ABPFilterParserData.dat',
  // TODO: When this version changes we need to add cleanup
  // code to adBlock.js to remove the old file
  adBlockVersion: '1',
  msBetweenDataFileRechecks: 1000 * 60 * 60 * 24, // 1 day
  updates: {
    // Check for front end updates every hour
    appUpdateCheckFrequency: 1000 * 60 * 60,
    // Check after 2 minutes, near startup
    runtimeUpdateCheckDelay: 1000 * 60 * 2,
    // If true user will not be notified before updates are reloaded
    autoAppUpdate: false,
    autoRuntimeUpdate: false,
    // url to check for updates
    baseUrl: `${updateHost}/1/releases`
  }
}
